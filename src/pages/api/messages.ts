/**
 * GET  /api/messages  — Charger l'historique de messages
 * POST /api/messages  — Envoyer un message
 */
import type { APIRoute } from 'astro';
import { getUserFromSession, getActiveProject, getMessages, uuid } from '../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProject(db, user.id);
  if (!project) return json({ messages: [] });

  const messages = await getMessages(db, project.id);
  return json({ messages: messages.map(m => ({
    ...m,
    attachments: JSON.parse(m.attachments || '[]'),
  }))});
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as { content?: string; sender?: string; attachments?: string[] };
  const content = String(body.content ?? '').slice(0, 5000).trim();
  if (!content) return json({ error: 'Message vide' }, 400);

  const sender = body.sender === 'bot' || body.sender === 'admin' ? body.sender : 'user';

  // Obtenir le projet actif (ou null)
  const project = await getActiveProject(db, user.id);

  const id = uuid();
  await db.prepare(
    `INSERT INTO messages (id, project_id, user_id, sender, content, attachments)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    project?.id ?? null,
    user.id,
    sender,
    content,
    JSON.stringify(body.attachments ?? [])
  ).run();

  return json({ ok: true, id });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
