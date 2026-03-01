import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const token = url.searchParams.get('token')?.trim();
  const email = url.searchParams.get('email')?.trim().toLowerCase();

  if (!token || !email) {
    return redirect('/connexion?verify_error=lien_invalide');
  }

  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();

  try {
    if (db) {
      // ── D1 ──────────────────────────────────────────────────────────────
      type VerifyRow = {
        id: string;
        name: string;
        email_verification_token: string | null;
        email_verification_expires: number | null;
        email_verified: number;
      };
      let user: VerifyRow | null = null;

      try {
        user = await db
          .prepare(
            `SELECT id, name, email_verification_token, email_verification_expires, email_verified
             FROM users WHERE email = ? LIMIT 1`
          )
          .bind(email)
          .first<VerifyRow>();
      } catch {
        // Colonnes pas encore migrées → lien invalide
        return redirect('/connexion?verify_error=migration_en_cours');
      }

      if (!user) return redirect('/connexion?verify_error=utilisateur_introuvable');
      if (user.email_verified === 1) return redirect('/connexion?verified=deja');

      if (
        user.email_verification_token !== token ||
        !user.email_verification_expires ||
        Date.now() > user.email_verification_expires
      ) {
        return redirect('/connexion?verify_error=lien_expire');
      }

      await db
        .prepare(
          `UPDATE users
           SET email_verified = 1,
               email_verification_token = NULL,
               email_verification_expires = NULL,
               updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(user.id)
        .run();

    } else if (useNeon) {
      // ── Neon / PostgreSQL ────────────────────────────────────────────────
      const sql = await getNeonSqlClient();
      if (!sql) return redirect('/connexion?verify_error=db_indisponible');

      const rows = await sql<{
        id: string;
        name: string;
        email_verification_token: string | null;
        email_verification_expires: bigint | null;
        email_verified: boolean;
      }>`SELECT id, name, email_verification_token, email_verification_expires, email_verified
         FROM users WHERE email = ${email} LIMIT 1`;

      const user = rows[0] ?? null;
      if (!user) return redirect('/connexion?verify_error=utilisateur_introuvable');
      if (user.email_verified) return redirect('/connexion?verified=deja');

      if (
        user.email_verification_token !== token ||
        !user.email_verification_expires ||
        Date.now() > Number(user.email_verification_expires)
      ) {
        return redirect('/connexion?verify_error=lien_expire');
      }

      await sql`
        UPDATE users
        SET email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_expires = NULL,
            updated_at = now()
        WHERE id = ${user.id}
      `;

    } else {
      // Dev sans DB
      return redirect('/connexion?verified=1');
    }

    return redirect('/connexion?verified=1');

  } catch (e) {
    console.error('[verify-email] Erreur:', e);
    return redirect('/connexion?verify_error=erreur_serveur');
  }
};
