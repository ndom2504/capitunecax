/**
 * POST /api/admin/reply — Admin envoie un message à un client
 * Body: { user_id, content }
 */
import type { APIRoute } from 'astro';
import { uuid } from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  if (!db) return json({ error: 'DB non disponible' }, 503);

  const body = await request.json() as { user_id?: string; content?: string };
  const userId  = String(body.user_id  ?? '').trim();
  const content = String(body.content  ?? '').trim();

  if (!userId || !content) return json({ error: 'Champs manquants' }, 400);

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

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
