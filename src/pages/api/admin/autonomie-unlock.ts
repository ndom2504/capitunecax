/**
 * POST /api/admin/autonomie-unlock — Débloquer / rebloquer l'accès Autonomie (étapes) pour un utilisateur
 * Body: { user_id: string, unlocked: boolean }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

  const body = (await request.json().catch(() => ({}))) as { user_id?: string; unlocked?: boolean };
  const userId = String(body.user_id ?? '').trim();
  if (!userId) return json({ error: 'user_id manquant' }, 400);
  const unlocked = Boolean(body.unlocked);

  try {
    if (db) {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS autonomie_unlocks (
            user_id TEXT PRIMARY KEY,
            unlocked INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT,
            updated_by TEXT
          )`
        )
        .run();

      await db
        .prepare(
          `INSERT INTO autonomie_unlocks (user_id, unlocked, updated_at, updated_by)
           VALUES (?, ?, datetime('now'), ?)
           ON CONFLICT(user_id) DO UPDATE SET
             unlocked=excluded.unlocked,
             updated_at=excluded.updated_at,
             updated_by=excluded.updated_by`
        )
        .bind(userId, unlocked ? 1 : 0, String(me.id))
        .run();

      return json({ ok: true, unlocked });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    await sql`
      CREATE TABLE IF NOT EXISTS autonomie_unlocks (
        user_id TEXT PRIMARY KEY,
        unlocked BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TEXT,
        updated_by TEXT
      )
    `;

    await sql`
      INSERT INTO autonomie_unlocks (user_id, unlocked, updated_at, updated_by)
      VALUES (${userId}, ${unlocked}, now()::text, ${String(me.id)})
      ON CONFLICT (user_id) DO UPDATE SET
        unlocked = EXCLUDED.unlocked,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by
    `;

    return json({ ok: true, unlocked });
  } catch (err) {
    console.error('[autonomie-unlock] Error:', err);
    return json({ error: 'AutonomieUnlockError' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
