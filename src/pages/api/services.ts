/**
 * GET  /api/services  — Lire les services sélectionnés
 * POST /api/services  — Sauvegarder pack + carte de services
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
    return json({ services: null, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProjectAny(db, user.id);
  if (!project || !project.services) return json({ services: null });

  const s = project.services;
  return json({
    services: {
      pack_id: s.pack_id,
      pack_price: Number(s.pack_price ?? 0),
      carte: JSON.parse(s.carte || '{}'),
    }
  });
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
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

  const project = await getActiveProjectAny(db, user.id);
  if (!project) return json({ error: 'Aucun projet actif' }, 400);

  const body = await request.json() as { pack_id?: string; pack_price?: number; carte?: Record<string, unknown> };

  let existing: { id: string } | null = null;
  if (db) {
    existing = await db
      .prepare(`SELECT id FROM project_services WHERE project_id = ? LIMIT 1`)
      .bind(project.id)
      .first<{ id: string }>();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    const rows = await sql<{ id: string }>
      `SELECT id FROM project_services WHERE project_id = ${project.id} LIMIT 1`;
    existing = rows[0] ?? null;
  }

  if (existing) {
    if (db) {
      await db.prepare(
        `UPDATE project_services SET pack_id=?, pack_price=?, carte=?, updated_at=datetime('now') WHERE id=?`
      ).bind(
        body.pack_id ?? '',
        body.pack_price ?? 0,
        JSON.stringify(body.carte ?? {}),
        existing.id
      ).run();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      await sql`
        UPDATE project_services
        SET pack_id = ${body.pack_id ?? ''},
            pack_price = ${body.pack_price ?? 0},
            carte = ${JSON.stringify(body.carte ?? {})},
            updated_at = now()
        WHERE id = ${existing.id}
      `;
    }
  } else {
    const id = uuid();
    if (db) {
      await db.prepare(
        `INSERT INTO project_services (id, project_id, pack_id, pack_price, carte) VALUES (?, ?, ?, ?, ?)`
      ).bind(
        id, project.id,
        body.pack_id ?? '',
        body.pack_price ?? 0,
        JSON.stringify(body.carte ?? {})
      ).run();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      await sql`
        INSERT INTO project_services (id, project_id, pack_id, pack_price, carte)
        VALUES (${id}, ${project.id}, ${body.pack_id ?? ''}, ${body.pack_price ?? 0}, ${JSON.stringify(body.carte ?? {})})
      `;
    }
  }

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
