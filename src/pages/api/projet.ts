/**
 * GET  /api/projet  — Lire le projet actif
 * POST /api/projet  — Créer / mettre à jour le projet
 * DELETE /api/projet — Annuler / supprimer le projet actif
 */
import type { APIRoute } from 'astro';
import {
  getActiveProjectAny,
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
    return json({ project: null, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProjectAny(db, user.id);
  return json({ project });
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({ ok: true, id: 'local', persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as Record<string, unknown>;

  // Chercher si un projet actif existe déjà
  let existing: { id: string } | null = null;
  if (db) {
    existing = await db
      .prepare(`SELECT id FROM projects WHERE user_id = ? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
      .bind(user.id)
      .first<{ id: string }>();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    const rows = await sql<{ id: string }>
      `SELECT id FROM projects WHERE user_id = ${user.id} AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`;
    existing = rows[0] ?? null;
  }

  const str = (v: unknown, max = 200) => String(v ?? '').slice(0, max);

  if (existing) {
    // Mise à jour
    if (db) {
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
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      await sql`
        UPDATE projects SET
          type = ${str(body.type)},
          province = ${str(body.province)},
          pays = ${str(body.pays)},
          diplome = ${str(body.diplome)},
          domaine = ${str(body.domaine)},
          experience = ${str(body.experience)},
          famille = ${str(body.famille)},
          enfants = ${str(body.enfants)},
          conjoint = ${str(body.conjoint)},
          delai = ${str(body.delai)},
          nbpersonnes = ${str(body.nbpersonnes)},
          notes = ${str(body.notes, 2000)},
          langues = ${JSON.stringify(body.langues ?? [])},
          status = ${str(body.status ?? 'en_cours')},
          updated_at = now()
        WHERE id = ${existing.id}
      `;
    }
    return json({ ok: true, id: existing.id });
  } else {
    // Création
    const id = uuid();
    if (db) {
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
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      await sql`
        INSERT INTO projects (
          id, user_id, type, province, pays, diplome, domaine, experience,
          famille, enfants, conjoint, delai, nbpersonnes, notes, langues, status
        ) VALUES (
          ${id}, ${user.id},
          ${str(body.type)}, ${str(body.province)}, ${str(body.pays)}, ${str(body.diplome)},
          ${str(body.domaine)}, ${str(body.experience)}, ${str(body.famille)}, ${str(body.enfants)},
          ${str(body.conjoint)}, ${str(body.delai)}, ${str(body.nbpersonnes)}, ${str(body.notes, 2000)},
          ${JSON.stringify(body.langues ?? [])}, ${str(body.status ?? 'en_cours')}
        )
      `;
    }
    return json({ ok: true, id });
  }
};

export const DELETE: APIRoute = async ({ cookies, locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({ ok: true, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  if (db) {
    await db.prepare(
      `UPDATE projects SET status='annule', updated_at=datetime('now')
       WHERE user_id=? AND status != 'annule'`
    ).bind(user.id).run();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    await sql`
      UPDATE projects
      SET status = 'annule', updated_at = now()
      WHERE user_id = ${user.id} AND status != 'annule'
    `;
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
