/**
 * GET /api/admin/client/[id] — Fiche complète d'un client
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../../lib/db';
import { isSuperAdminEmail } from '../../../../lib/admin-emails';

export const GET: APIRoute = async ({ params, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);
  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);
  const isSuper = isSuperAdminEmail(me.email);

  const { id } = params;
  if (!id) return json({ error: 'ID manquant' }, 400);

  // Garde-fou: un pro ne voit que les clients qui lui sont assignés
  if (db && !isSuper) {
    const allowed = await db
      .prepare(`SELECT 1 as ok FROM client_assignments WHERE client_id=? AND pro_id=? LIMIT 1`)
      .bind(id, me.id)
      .first<{ ok: number }>();
    if (!allowed) return json({ error: 'Non assigné à votre compte' }, 403);
  }

  if (db) {
    const [user, projects, messages, payments] = await Promise.all([
      db.prepare(`SELECT id, name, email, phone, location, bio, role, created_at FROM users WHERE id=?`)
        .bind(id).first<Record<string, unknown>>(),

      db.prepare(`SELECT p.*, ps.pack_id, ps.pack_price, ps.carte FROM projects p LEFT JOIN project_services ps ON ps.project_id=p.id WHERE p.user_id=? ORDER BY p.updated_at DESC`)
        .bind(id).all<Record<string, unknown>>(),

      db.prepare(`SELECT * FROM messages WHERE user_id=? ORDER BY created_at ASC LIMIT 200`)
        .bind(id).all<Record<string, unknown>>(),

      db.prepare(`SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC`)
        .bind(id).all<Record<string, unknown>>(),
    ]);

    if (!user) return json({ error: 'Client introuvable' }, 404);

    return json({
      user,
      projects:  projects.results,
      messages:  messages.results,
      payments:  payments.results,
    });
  }

  const sql = await getNeonSqlClient();
  if (!sql) return json({ error: 'DB non disponible' }, 503);

  if (!isSuper) {
    const allowedRows = await sql<{ ok: number }>
      `SELECT 1 as ok FROM client_assignments WHERE client_id = ${id}::uuid AND pro_id = ${me.id}::uuid LIMIT 1`;
    if (!allowedRows[0]) return json({ error: 'Non assigné à votre compte' }, 403);
  }

  const [userRows, projects, messages, payments] = await Promise.all([
    sql<Record<string, unknown>>`
      SELECT id::text as id, name, email, phone, location, bio, role, created_at::text as created_at
      FROM users WHERE id = ${id} LIMIT 1
    `,
    sql<Record<string, unknown>>`
      SELECT p.*, ps.pack_id, (ps.pack_price::float8) as pack_price, ps.carte
      FROM projects p
      LEFT JOIN project_services ps ON ps.project_id = p.id
      WHERE p.user_id = ${id}
      ORDER BY p.updated_at DESC
    `,
    sql<Record<string, unknown>>`
      SELECT *, created_at::text as created_at
      FROM messages WHERE user_id = ${id}
      ORDER BY created_at ASC
      LIMIT 200
    `,
    sql<Record<string, unknown>>`
      SELECT *, created_at::text as created_at
      FROM payments WHERE user_id = ${id}
      ORDER BY created_at DESC
    `,
  ]);

  const user = userRows[0] ?? null;
  if (!user) return json({ error: 'Client introuvable' }, 404);
  return json({ user, projects, messages, payments });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
