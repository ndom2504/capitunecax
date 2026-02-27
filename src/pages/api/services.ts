/**
 * GET  /api/services  — Lire les services sélectionnés
 * POST /api/services  — Sauvegarder pack + carte de services
 */
import type { APIRoute } from 'astro';
import { getUserFromSession, getActiveProject, uuid } from '../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProject(db, user.id);
  if (!project || !project.services) return json({ services: null });

  const s = project.services;
  return json({
    services: {
      pack_id: s.pack_id,
      pack_price: s.pack_price,
      carte: JSON.parse(s.carte || '{}'),
    }
  });
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProject(db, user.id);
  if (!project) return json({ error: 'Aucun projet actif' }, 400);

  const body = await request.json() as { pack_id?: string; pack_price?: number; carte?: Record<string, unknown> };

  const existing = await db
    .prepare(`SELECT id FROM project_services WHERE project_id = ? LIMIT 1`)
    .bind(project.id)
    .first<{ id: string }>();

  if (existing) {
    await db.prepare(
      `UPDATE project_services SET pack_id=?, pack_price=?, carte=?, updated_at=datetime('now') WHERE id=?`
    ).bind(
      body.pack_id ?? '',
      body.pack_price ?? 0,
      JSON.stringify(body.carte ?? {}),
      existing.id
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO project_services (id, project_id, pack_id, pack_price, carte) VALUES (?, ?, ?, ?, ?)`
    ).bind(
      uuid(), project.id,
      body.pack_id ?? '',
      body.pack_price ?? 0,
      JSON.stringify(body.carte ?? {})
    ).run();
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
