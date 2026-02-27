/**
 * GET  /api/projet  — Lire le projet actif
 * POST /api/projet  — Créer / mettre à jour le projet
 * DELETE /api/projet — Annuler / supprimer le projet actif
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
  return json({ project });
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as Record<string, unknown>;

  // Chercher si un projet actif existe déjà
  const existing = await db
    .prepare(`SELECT id FROM projects WHERE user_id = ? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
    .bind(user.id)
    .first<{ id: string }>();

  const str = (v: unknown, max = 200) => String(v ?? '').slice(0, max);

  if (existing) {
    // Mise à jour
    await db.prepare(
      `UPDATE projects SET
         type=?, province=?, pays=?, diplome=?, domaine=?, experience=?,
         famille=?, enfants=?, conjoint=?, delai=?, nbpersonnes=?, notes=?,
         langues=?, status=?, updated_at=datetime('now')
       WHERE id=?`
    ).bind(
      str(body.type), str(body.province), str(body.pays), str(body.diplome),
      str(body.domaine), str(body.experience), str(body.famille), str(body.enfants),
      str(body.conjoint), str(body.delai), str(body.nbpersonnes), str(body.notes, 2000),
      JSON.stringify(body.langues ?? []), str(body.status ?? 'en_cours'),
      existing.id
    ).run();
    return json({ ok: true, id: existing.id });
  } else {
    // Création
    const id = uuid();
    await db.prepare(
      `INSERT INTO projects (id, user_id, type, province, pays, diplome, domaine, experience, famille, enfants, conjoint, delai, nbpersonnes, notes, langues, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, user.id,
      str(body.type), str(body.province), str(body.pays), str(body.diplome),
      str(body.domaine), str(body.experience), str(body.famille), str(body.enfants),
      str(body.conjoint), str(body.delai), str(body.nbpersonnes), str(body.notes, 2000),
      JSON.stringify(body.langues ?? []), str(body.status ?? 'en_cours')
    ).run();
    return json({ ok: true, id });
  }
};

export const DELETE: APIRoute = async ({ cookies, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  await db.prepare(
    `UPDATE projects SET status='annule', updated_at=datetime('now')
     WHERE user_id=? AND status != 'annule'`
  ).bind(user.id).run();

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
