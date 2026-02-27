/**
 * PATCH /api/admin/project/[id]/status — Changer le statut d'un projet
 * Body: { status: 'en_cours' | 'soumis' | 'annule' | 'termine' }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../../../../lib/db';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const { id } = params;
  const body = await request.json() as { status?: string };
  const allowed = ['en_cours', 'soumis', 'annule', 'termine'];
  if (!id || !body.status || !allowed.includes(body.status)) return json({ error: 'Paramètres invalides' }, 400);

  if (db) {
    await db.prepare(`UPDATE projects SET status=?, updated_at=datetime('now') WHERE id=?`).bind(body.status, id).run();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);
    await sql`UPDATE projects SET status = ${body.status}, updated_at = now() WHERE id = ${id}`;
  }
  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
