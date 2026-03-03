import type { APIRoute } from 'astro';
import { createSessionAny, getNeonSqlClient, hasNeonDatabase, uuid } from '../../../lib/db';
import { isAdminEmail } from '../../../lib/admin-emails';

/**
 * POST /api/auth/oauth
 * Point d'entrée OAuth pour l'app mobile (Expo).
 * Reçoit { provider, token, email, name } depuis le client mobile,
 * vérifie le token côté serveur, puis crée/met à jour le compte CAPITUNE.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as {
      provider?: string;
      token?: string;
      email?: string;
      name?: string;
    };

    const { provider, token, email: clientEmail, name: clientName } = body;

    if (!provider || !token) {
      return json({ message: 'provider et token requis.' }, 400);
    }
    if (provider !== 'google' && provider !== 'microsoft') {
      return json({ message: 'Provider non supporté.' }, 400);
    }

    // ── Vérification du token côté serveur ────────────────────────────────
    let verifiedEmail = '';
    let verifiedName  = '';

    try {
      if (provider === 'google') {
        const res  = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return json({ message: 'Token Google invalide.' }, 401);
        const ui   = await res.json() as { email?: string; name?: string };
        verifiedEmail = ui.email ?? '';
        verifiedName  = ui.name  ?? clientName ?? '';
      } else {
        const res  = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return json({ message: 'Token Microsoft invalide.' }, 401);
        const ui   = await res.json() as {
          mail?: string; userPrincipalName?: string; displayName?: string;
        };
        verifiedEmail = ui.mail ?? ui.userPrincipalName ?? '';
        verifiedName  = ui.displayName ?? clientName ?? '';
      }
    } catch {
      // Fallback sur les données fournies par le client si l'API est inaccessible
      verifiedEmail = clientEmail ?? '';
      verifiedName  = clientName  ?? '';
    }

    const email = verifiedEmail.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ message: 'Impossible de vérifier l\'email.' }, 400);
    }

    const name  = verifiedName || email.split('@')[0];
    const role  = isAdminEmail(email) ? 'admin' : 'client';

    const db     = (locals.runtime?.env as Env | undefined)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();

    let userId: string;
    let sessionToken: string;
    let accountType = 'client';

    // ── D1 (Cloudflare Workers) ───────────────────────────────────────────
    if (db) {
      const existing = await db
        .prepare('SELECT id, account_type FROM users WHERE email = ?')
        .bind(email)
        .first<{ id: string; account_type: string }>();

      if (existing) {
        userId      = existing.id;
        accountType = existing.account_type ?? 'client';
        // Mettre à jour le nom si vide
        await db.prepare('UPDATE users SET name = ? WHERE id = ? AND (name IS NULL OR name = \'\')')
          .bind(name, userId).run();
      } else {
        userId = uuid();
        await db.prepare(
          `INSERT INTO users (id, email, name, password_hash, role, account_type, email_verified, created_at)
           VALUES (?, ?, ?, '', ?, ?, 1, datetime('now'))`
        ).bind(userId, email, name, role, 'client').run();
      }
      sessionToken = await createSessionAny(db, userId);

    // ── Neon (Postgres) ───────────────────────────────────────────────────
    } else if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ message: 'Base de données indisponible.' }, 500);

      const rows = await sql`
        SELECT id, account_type FROM users WHERE email = ${email} LIMIT 1
      `;
      if (rows.length > 0) {
        userId      = rows[0].id as string;
        accountType = rows[0].account_type ?? 'client';
        await sql`UPDATE users SET name = ${name} WHERE id = ${userId} AND (name IS NULL OR name = '')`;
      } else {
        userId = uuid();
        await sql`
          INSERT INTO users (id, email, name, password_hash, role, account_type, email_verified, created_at)
          VALUES (${userId}, ${email}, ${name}, '', ${role}, 'client', true, NOW())
        `;
      }
      sessionToken = await createSessionAny(null, userId);

    } else {
      return json({ message: 'Base de données non configurée.' }, 500);
    }

    return json({
      ok:    true,
      token: sessionToken,
      user:  { id: userId, email, name, role, account_type: accountType },
    });

  } catch (err) {
    console.error('[/api/auth/oauth]', err);
    return json({ message: 'Erreur serveur.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
