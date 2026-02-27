/**
 * GET /api/admin/client/[id] — Fiche complète d'un client
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  if (!db) return json({ error: 'DB non disponible' }, 503);

  const { id } = params;
  if (!id) return json({ error: 'ID manquant' }, 400);

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
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
