import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../lib/db';
import { generateVerificationToken, buildVerifyUrl } from '../../lib/tokens';
import { sendEmail, buildVerificationEmail } from '../../lib/email';

export const prerender = false;

const RATE_LIMIT_MS = 60 * 1000; // 1 minute entre chaque envoi

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email ?? '').toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email invalide.' }, 400);
    }

    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    const resendApiKey =
      (locals.runtime?.env as Env & { RESEND_API_KEY?: string })?.RESEND_API_KEY ??
      (import.meta.env.RESEND_API_KEY as string | undefined) ??
      (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>).RESEND_API_KEY : undefined);

    const token = generateVerificationToken();
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const sentAt = Date.now();
    let userName = email;

    if (db) {
      // ── D1 ───────────────────────────────────────────────────────────────
      const user = await db
        .prepare(`SELECT id, name, email_verified, email_verification_sent_at FROM users WHERE email = ? LIMIT 1`)
        .bind(email)
        .first<{ id: string; name: string; email_verified: number; email_verification_sent_at: number | null }>()
        .catch(() => null);

      if (!user) return json({ error: 'Aucun compte associé à cet email.' }, 404);
      if (user.email_verified === 1) return json({ error: 'Ce compte est déjà vérifié.' }, 400);

      // Rate limiting
      if (user.email_verification_sent_at && Date.now() - user.email_verification_sent_at < RATE_LIMIT_MS) {
        const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - user.email_verification_sent_at)) / 1000);
        return json({ error: `Veuillez attendre ${wait} secondes avant de renvoyer l'email.` }, 429);
      }

      userName = user.name || email;

      await db
        .prepare(
          `UPDATE users
           SET email_verification_token = ?,
               email_verification_expires = ?,
               email_verification_sent_at = ?
           WHERE id = ?`
        )
        .bind(token, expires, sentAt, user.id)
        .run();

    } else if (useNeon) {
      // ── Neon / PostgreSQL ─────────────────────────────────────────────────
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Base de données indisponible.' }, 500);

      const rows = await sql<{
        id: string; name: string; email_verified: boolean; email_verification_sent_at: bigint | null;
      }>`SELECT id, name, email_verified, email_verification_sent_at FROM users WHERE email = ${email} LIMIT 1`;

      const user = rows[0] ?? null;
      if (!user) return json({ error: 'Aucun compte associé à cet email.' }, 404);
      if (user.email_verified) return json({ error: 'Ce compte est déjà vérifié.' }, 400);

      if (
        user.email_verification_sent_at &&
        Date.now() - Number(user.email_verification_sent_at) < RATE_LIMIT_MS
      ) {
        const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - Number(user.email_verification_sent_at))) / 1000);
        return json({ error: `Veuillez attendre ${wait} secondes avant de renvoyer l'email.` }, 429);
      }

      userName = user.name || email;

      await sql`
        UPDATE users
        SET email_verification_token = ${token},
            email_verification_expires = ${expires},
            email_verification_sent_at = ${sentAt}
        WHERE id = ${user.id}
      `;
    }

    // Envoi email
    const verifyUrl = buildVerifyUrl(request.url, token, email);
    const result = await sendEmail(
      {
        to: email,
        subject: 'Confirmez votre adresse courriel — CAPI',
        html: buildVerificationEmail(userName, verifyUrl),
      },
      resendApiKey,
    );

    if (!result.ok && result.error !== 'RESEND_API_KEY_MISSING') {
      return json({ error: 'Erreur lors de l\'envoi de l\'email. Réessayez.' }, 500);
    }

    // En dev sans clé API, log le lien pour faciliter le test
    if (result.error === 'RESEND_API_KEY_MISSING') {
      console.info('[dev] Lien de vérification :', verifyUrl);
    }

    return json({ ok: true });

  } catch (e) {
    console.error('[resend-verification]', e);
    return json({ error: 'Erreur serveur.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
