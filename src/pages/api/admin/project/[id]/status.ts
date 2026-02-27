/**
 * PATCH /api/admin/project/[id]/status — Changer le statut d'un projet
 * Body: { status: 'en_cours' | 'soumis' | 'annule' | 'termine' }
 */
import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  if (!db) return json({ error: 'DB non disponible' }, 503);

  const { id } = params;
  const body = await request.json() as { status?: string };
  const allowed = ['en_cours', 'soumis', 'annule', 'termine'];
  if (!id || !body.status || !allowed.includes(body.status)) return json({ error: 'Paramètres invalides' }, 400);

  await db.prepare(`UPDATE projects SET status=?, updated_at=datetime('now') WHERE id=?`).bind(body.status, id).run();
  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
