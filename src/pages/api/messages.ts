/**
 * GET  /api/messages  — Charger l'historique de messages
 * POST /api/messages  — Envoyer un message
 */
import type { APIRoute } from 'astro';
import {
  getActiveProjectAny,
  getMessagesAny,
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
  uuid,
} from '../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({ messages: [], persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProjectAny(db, user.id);
  if (!project) return json({ messages: [] });

  const messages = await getMessagesAny(db, project.id);
  return json({ messages: messages.map(m => ({
    ...m,
    attachments: JSON.parse(m.attachments || '[]'),
  }))});
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    // Sans DB: accepter mais ne persiste pas
    return json({ ok: true, id: 'local', persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as { content?: string; sender?: string; attachments?: string[] };
  const content = String(body.content ?? '').slice(0, 5000).trim();
  if (!content) return json({ error: 'Message vide' }, 400);

  const sender = body.sender === 'bot' || body.sender === 'admin' ? body.sender : 'user';

  // Obtenir le projet actif (ou null)
  const project = await getActiveProjectAny(db, user.id);

  const id = uuid();
  if (db) {
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
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    await sql`
      INSERT INTO messages (id, project_id, user_id, sender, content, attachments)
      VALUES (${id}, ${project?.id ?? null}, ${user.id}, ${sender}, ${content}, ${JSON.stringify(body.attachments ?? [])})
    `;
  }

  return json({ ok: true, id });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
