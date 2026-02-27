/**
 * GET /api/team
 * Retourne les profils des conseillers/pros (role='admin') visibles aux clients connectés.
 * Champs exposés : nom, localisation, bio, spécialité — PAS l'email.
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  // Authentification requise (client ou admin)
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  // Vérification session
  const sessionUser = await getUserFromSessionAny(db, token);
  if (!sessionUser) return json({ error: 'Session expirée' }, 401);

  try {
    if (db) {
      const rows = await db
        .prepare(`
          SELECT
            id,
            name,
            COALESCE(location, '') AS location,
            COALESCE(bio, '') AS bio,
            COALESCE(avatar_key, '') AS avatar_key,
            created_at
          FROM users
          WHERE role = 'admin'
          ORDER BY created_at ASC
        `)
        .all();
      return json({ team: rows.results ?? [] });
    }

    if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'DB non disponible' }, 503);

      const rows = await sql<Record<string, unknown>>`
        SELECT
          id::text AS id,
          name,
          COALESCE(location, '') AS location,
          COALESCE(bio, '') AS bio,
          COALESCE(avatar_key, '') AS avatar_key,
          created_at::text AS created_at
        FROM users
        WHERE role = 'admin'
        ORDER BY created_at ASC
      `;
      return json({ team: rows });
    }

    // Fallback sans DB : retourner des infos statiques minimales
    return json({
      team: [
        {
          id: 'static-1',
          name: 'Équipe CAPITUNE',
          location: 'Canada',
          bio: 'Conseillers en immigration certifiés, nous accompagnons vos projets de A à Z.',
          avatar_key: '',
          created_at: null,
        },
      ],
    });
  } catch (err) {
    console.error('[/api/team] Error:', err);
    return json({ error: 'Erreur serveur', team: [] }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
