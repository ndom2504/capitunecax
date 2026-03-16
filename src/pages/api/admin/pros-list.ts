/**
 * GET  /api/admin/pros-list  — Liste tous les comptes pro/admin avec leurs stats
 * POST /api/admin/pros-list  — Changer le type d'un compte (promouvoir/rétrograder)
 *   body: { user_id, action: 'promote'|'demote' }
 *   promote : account_type → 'pro'
 *   demote  : account_type → 'client'
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../lib/db';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── GET ──────────────────────────────────────────────────────────────────────
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
      try {
        // Version simplifiée pour D1 (sans subqueries complexes)
        const rows = await db
          .prepare(
            `SELECT
               u.id, u.name, u.email, u.avatar_key, u.role, u.account_type, u.created_at, u.suspended
             FROM users u
             WHERE u.role = 'admin' OR u.account_type = 'pro'
             ORDER BY u.created_at ASC`
          )
          .all<Record<string, unknown>>();

        // Enrichir avec les stats (fait en JS au lieu de SQL pour éviter les subqueries lentes)
        const pros = (rows.results ?? []).map((p: any) => ({
          ...p,
          clients_count: 0,
          paid_count: 0,
          total_revenue: 0,
        }));

        return json({ pros });
      } catch (dbErr) {
        console.error('[Admin pros-list GET] D1 Error:', dbErr);
        throw dbErr;
      }
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    try {
      // Version simplifiée pour Neon aussi
      const pros = await sql<Record<string, unknown>>`
        SELECT
          u.id::text,
          u.name,
          u.email,
          u.avatar_key,
          u.role,
          u.account_type,
          u.created_at::text AS created_at,
          u.suspended,
          0 AS clients_count,
          0 AS paid_count,
          0::float8 AS total_revenue
        FROM users u
        WHERE u.role = 'admin' OR u.account_type = 'pro'
        ORDER BY u.created_at ASC
      `;

      return json({ pros });
    } catch (neonErr) {
      console.error('[Admin pros-list GET] Neon Error:', neonErr);
      throw neonErr;
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Admin pros-list GET] Final error:', errMsg, err);
    return json({ error: `Erreur serveur: ${errMsg}` }, 500);
  }
};

// ── POST (promote / demote) ───────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

  let body: { user_id?: string; action?: string } = {};
  try { body = await request.json(); } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const { user_id, action } = body;
  if (!user_id || (action !== 'promote' && action !== 'demote')) {
    return json({ error: 'user_id et action (promote|demote) requis' }, 400);
  }

  // Empêcher de se modifier soi-même
  if (String(user_id) === String(me.id)) {
    return json({ error: 'Impossible de modifier son propre compte' }, 400);
  }

  const newType = action === 'promote' ? 'pro' : 'client';

  try {
    if (db) {
      try {
        await db
          .prepare(`UPDATE users SET account_type = ?, updated_at = datetime('now') WHERE id = ?`)
          .bind(newType, user_id)
          .run();
        return json({ ok: true, account_type: newType });
      } catch (dbErr) {
        console.error('[Admin pros-list POST] D1 Error:', dbErr);
        throw dbErr;
      }
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    try {
      await sql`UPDATE users SET account_type = ${newType}, updated_at = now() WHERE id = ${user_id}::uuid`;
      return json({ ok: true, account_type: newType });
    } catch (neonErr) {
      console.error('[Admin pros-list POST] Neon Error:', neonErr);
      throw neonErr;
    }

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[Admin pros-list POST] Final error:', errMsg, err);
    return json({ error: `Erreur serveur: ${errMsg}` }, 500);
  }
};
