/**
 * POST /api/admin/reply — Admin envoie un message à un client
 * Body: { user_id, content }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, uuid, getUserFromSessionAny } from '../../../lib/db';
import { isSuperAdminEmail } from '../../../lib/admin-emails';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);
  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);
  const isSuper = isSuperAdminEmail(me.email);

  const body = await request.json() as { user_id?: string; content?: string };
  const userId  = String(body.user_id  ?? '').trim();
  const content = String(body.content  ?? '').trim();

  if (!userId || !content) return json({ error: 'Champs manquants' }, 400);

  if (db) {
    if (!isSuper) {
      const allowed = await db
        .prepare(`SELECT 1 as ok FROM client_assignments WHERE client_id=? AND pro_id=? LIMIT 1`)
        .bind(userId, me.id)
        .first<{ ok: number }>();
      if (!allowed) return json({ error: 'Client non assigné à votre compte' }, 403);
    }

    // Vérifier que l'utilisateur existe
    const user = await db.prepare(`SELECT id FROM users WHERE id=?`).bind(userId).first();
    if (!user) return json({ error: 'Client introuvable' }, 404);

    // Obtenir le projet actif du client
    const project = await db
      .prepare(`SELECT id FROM projects WHERE user_id=? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
      .bind(userId).first<{ id: string }>();

    await db.prepare(
      `INSERT INTO messages (id, project_id, user_id, sender, content) VALUES (?, ?, ?, 'admin', ?)`
    ).bind(uuid(), project?.id ?? null, userId, content).run();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    if (!isSuper) {
      const allowedRows = await sql<{ ok: number }>
        `SELECT 1 as ok FROM client_assignments WHERE client_id = ${userId}::uuid AND pro_id = ${me.id}::uuid LIMIT 1`;
      if (!allowedRows[0]) return json({ error: 'Client non assigné à votre compte' }, 403);
    }

    const userRows = await sql<{ id: string }>`SELECT id::text as id FROM users WHERE id = ${userId} LIMIT 1`;
    if (!userRows[0]) return json({ error: 'Client introuvable' }, 404);

    const projectRows = await sql<{ id: string }>
      `SELECT id::text as id FROM projects WHERE user_id = ${userId} AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`;
    const projectId = projectRows[0]?.id ?? null;
    await sql`
      INSERT INTO messages (id, project_id, user_id, sender, content)
      VALUES (${uuid()}, ${projectId}, ${userId}, 'admin', ${content})
    `;
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
