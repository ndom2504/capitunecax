/**
 * POST /api/pro/add-step — Ajouter une étape au projet (metadata.timeline)
 * Body: { client_id, titre, description? }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase } from '../../../lib/db';
import { isSuperAdminEmail } from '../../../lib/admin-emails';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asString(v: unknown, max = 4000) {
  return String(v ?? '').trim().slice(0, max);
}

function isProAccount(me: any): boolean {
  return me?.role === 'admin' || String(me?.account_type ?? '') === 'pro';
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);
  if (!isProAccount(me)) return json({ error: 'Accès refusé' }, 403);

  const isSuper = me.role === 'admin' && isSuperAdminEmail(me.email);

  const body = (await request.json().catch(() => null)) as any;
  const clientId = asString(body?.client_id, 200);
  const titre = asString(body?.titre, 160);
  const description = asString(body?.description, 800);

  if (!clientId || !titre) return json({ error: 'Champs manquants' }, 400);

  try {
    if (db) {
      if (!isSuper) {
        const allowed = await db
          .prepare(`SELECT 1 as ok FROM client_assignments WHERE client_id=? AND pro_id=? LIMIT 1`)
          .bind(clientId, me.id)
          .first<{ ok: number }>();
        if (!allowed) return json({ error: 'Client non assigné à votre compte' }, 403);
      }

      const project = await db
        .prepare(`SELECT id, metadata FROM projects WHERE user_id=? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
        .bind(clientId)
        .first<{ id: string; metadata?: string }>();
      if (!project?.id) return json({ error: 'Projet introuvable' }, 404);

      let md: any = {};
      try { md = project.metadata ? JSON.parse(project.metadata) : {}; } catch { md = {}; }
      const timeline = Array.isArray(md.timeline) ? md.timeline : [];
      const step = {
        id: 'p' + Date.now(),
        titre,
        description: description || undefined,
        responsable: 'conseiller',
        dureeEstimee: '',
        documents: [],
        statut: 'a_faire',
      };
      timeline.push(step);
      md.timeline = timeline;

      await db
        .prepare(`UPDATE projects SET metadata=?, updated_at=datetime('now') WHERE id=?`)
        .bind(JSON.stringify(md), project.id)
        .run();

      return json({ ok: true, step });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    if (!isSuper) {
      const allowedRows = await sql<{ ok: number }>
        `SELECT 1 as ok FROM client_assignments WHERE client_id = ${clientId}::uuid AND pro_id = ${me.id}::uuid LIMIT 1`;
      if (!allowedRows[0]) return json({ error: 'Client non assigné à votre compte' }, 403);
    }

    const projectRows = await sql<{ id: string; metadata: string | null }>`
      SELECT id::text as id, metadata
      FROM projects
      WHERE user_id = ${clientId}::uuid AND status != 'annule'
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const project = projectRows?.[0] ?? null;
    if (!project?.id) return json({ error: 'Projet introuvable' }, 404);

    let md: any = {};
    try { md = project.metadata ? JSON.parse(project.metadata) : {}; } catch { md = {}; }
    const timeline = Array.isArray(md.timeline) ? md.timeline : [];
    const step = {
      id: 'p' + Date.now(),
      titre,
      description: description || undefined,
      responsable: 'conseiller',
      dureeEstimee: '',
      documents: [],
      statut: 'a_faire',
    };
    timeline.push(step);
    md.timeline = timeline;

    await sql`
      UPDATE projects
      SET metadata = ${JSON.stringify(md)}, updated_at = now()
      WHERE id = ${project.id}::uuid
    `;

    return json({ ok: true, step });
  } catch (err) {
    console.error('[pro add-step] error', err);
    return json({ error: 'Erreur' }, 500);
  }
};
