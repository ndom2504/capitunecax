/**
 * GET /api/admin/pros — Liste des comptes pro/admin (pour assignations)
 *
 * IMPORTANT: côté mobile, les conseillers visibles utilisent la logique:
 *   role='admin' OR account_type='pro'
 * On aligne donc la liste d'assignation admin sur cette même règle.
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../lib/db';

export const GET: APIRoute = async ({ locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

  try {
    if (db) {
      const rows = await db
        .prepare(
          `SELECT id, name, email, avatar_key, role, account_type, suspended, created_at
           FROM users
           WHERE role='admin' OR account_type='pro'
           ORDER BY created_at ASC`
        )
        .all<Record<string, unknown>>();
      return json({ pros: rows.results });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const pros = await sql<Record<string, unknown>>`
      SELECT
        id::text as id,
        name,
        email,
        avatar_key,
        role,
        account_type,
        suspended,
        created_at::text as created_at
      FROM users
      WHERE role='admin' OR account_type='pro'
      ORDER BY created_at ASC
    `;

    return json({ pros });
  } catch (err) {
    console.error('[Admin pros] Error:', err);
    return json({ error: 'AdminProsError' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
