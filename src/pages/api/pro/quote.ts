/**
 * GET  /api/pro/quote?client_id=... — Dernières propositions pour un client (mode pro)
 * POST /api/pro/quote              — Créer une proposition tarifaire (mode pro)
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  hasNeonDatabase,
  uuid,
} from '../../../lib/db';
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

async function assertClientAssignedToMe(db: D1Database | null, me: any, clientId: string, isSuper: boolean) {
  if (isSuper) return;
  if (!db) throw new Error('DB_REQUIRED_FOR_ASSIGNMENT_CHECK');
  const allowed = await db
    .prepare(`SELECT 1 as ok FROM client_assignments WHERE client_id=? AND pro_id=? LIMIT 1`)
    .bind(clientId, me.id)
    .first<{ ok: number }>();
  if (!allowed) {
    const err: any = new Error('FORBIDDEN');
    err.status = 403;
    err.payload = { error: 'Client non assigné à votre compte' };
    throw err;
  }
}

async function assertClientAssignedToMeNeon(sql: any, me: any, clientId: string, isSuper: boolean) {
  if (isSuper) return;
  const allowedRows = await sql<{ ok: number }>
    `SELECT 1 as ok FROM client_assignments WHERE client_id = ${clientId}::uuid AND pro_id = ${me.id}::uuid LIMIT 1`;
  if (!allowedRows[0]) {
    const err: any = new Error('FORBIDDEN');
    err.status = 403;
    err.payload = { error: 'Client non assigné à votre compte' };
    throw err;
  }
}

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);
  if (!isProAccount(me)) return json({ error: 'Accès refusé' }, 403);

  const isSuper = me.role === 'admin' && isSuperAdminEmail(me.email);

  const url = new URL(request.url);
  const clientId = asString(url.searchParams.get('client_id'), 200);
  if (!clientId) return json({ error: 'client_id manquant' }, 400);

  try {
    if (db) {
      await assertClientAssignedToMe(db, me, clientId, isSuper);

      const { results } = await db
        .prepare(
          `SELECT * FROM project_quotes
           WHERE client_id=?
           ORDER BY created_at DESC
           LIMIT 20`
        )
        .bind(clientId)
        .all<Record<string, unknown>>();

      return json({ quotes: results ?? [] });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    await assertClientAssignedToMeNeon(sql, me, clientId, isSuper);

    const rows = await sql<Record<string, unknown>>`
      SELECT
        id::text as id,
        project_id::text as project_id,
        client_id::text as client_id,
        pro_id::text as pro_id,
        currency,
        (total::float8) as total,
        breakdown,
        estimated_delay,
        note,
        status,
        created_at::text as created_at,
        updated_at::text as updated_at
      FROM project_quotes
      WHERE client_id = ${clientId}::uuid
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return json({ quotes: rows ?? [] });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const payload = err?.payload ?? { error: 'Erreur' };
    return json(payload, status);
  }
};

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
  const projectIdFromBody = asString(body?.project_id, 200);
  const currency = (asString(body?.currency, 8) || 'CAD').toUpperCase();
  const total = Number(body?.total ?? 0);
  const estimatedDelay = asString(body?.estimated_delay, 200);
  const note = asString(body?.note, 4000);
  const breakdown = Array.isArray(body?.breakdown) ? body.breakdown : null;

  if (!clientId) return json({ error: 'client_id manquant' }, 400);
  if (!Number.isFinite(total) || total <= 0) return json({ error: 'total invalide' }, 400);

  try {
    if (db) {
      await assertClientAssignedToMe(db, me, clientId, isSuper);

      const projectRow = projectIdFromBody
        ? await db
            .prepare(`SELECT id FROM projects WHERE id=? AND user_id=? AND status != 'annule' LIMIT 1`)
            .bind(projectIdFromBody, clientId)
            .first<{ id: string }>()
        : await db
            .prepare(`SELECT id FROM projects WHERE user_id=? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
            .bind(clientId)
            .first<{ id: string }>();

      if (!projectRow?.id) return json({ error: 'Projet introuvable' }, 404);

      const quoteId = uuid();
      await db
        .prepare(
          `INSERT INTO project_quotes (id, project_id, client_id, pro_id, currency, total, breakdown, estimated_delay, note, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')`
        )
        .bind(
          quoteId,
          projectRow.id,
          clientId,
          me.id,
          currency,
          total,
          JSON.stringify(breakdown ?? []),
          estimatedDelay,
          note
        )
        .run();

      await db
        .prepare(`UPDATE projects SET status='proposition', updated_at=datetime('now') WHERE id=?`)
        .bind(projectRow.id)
        .run()
        .catch(() => {});

      const msg = `💼 Proposition tarifaire: ${total.toLocaleString('fr-CA')} ${currency}`
        + (estimatedDelay ? ` • Délai estimé: ${estimatedDelay}` : '')
        + (note ? `\n\n${note}` : '');

      await db
        .prepare(`INSERT INTO messages (id, project_id, user_id, sender, content) VALUES (?, ?, ?, 'admin', ?)`)
        .bind(uuid(), projectRow.id, clientId, msg)
        .run()
        .catch(() => {});

      return json({ ok: true, quote: { id: quoteId, project_id: projectRow.id, client_id: clientId, total, currency, status: 'sent' } });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    await assertClientAssignedToMeNeon(sql, me, clientId, isSuper);

    const projectRows = projectIdFromBody
      ? await sql<{ id: string }>
          `SELECT id::text as id FROM projects WHERE id = ${projectIdFromBody}::uuid AND user_id = ${clientId}::uuid AND status != 'annule' LIMIT 1`
      : await sql<{ id: string }>
          `SELECT id::text as id FROM projects WHERE user_id = ${clientId}::uuid AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`;

    const projectId = projectRows?.[0]?.id ?? null;
    if (!projectId) return json({ error: 'Projet introuvable' }, 404);

    const quoteId = uuid();
    await sql`
      INSERT INTO project_quotes (id, project_id, client_id, pro_id, currency, total, breakdown, estimated_delay, note, status)
      VALUES (${quoteId}::uuid, ${projectId}::uuid, ${clientId}::uuid, ${me.id}::uuid, ${currency}, ${total}, ${JSON.stringify(breakdown ?? [])}, ${estimatedDelay}, ${note}, 'sent')
    `;

    await sql`
      UPDATE projects SET status = 'proposition', updated_at = now()
      WHERE id = ${projectId}::uuid
    `.catch(() => {});

    const msg = `💼 Proposition tarifaire: ${total.toLocaleString('fr-CA')} ${currency}`
      + (estimatedDelay ? ` • Délai estimé: ${estimatedDelay}` : '')
      + (note ? `\n\n${note}` : '');

    await sql`
      INSERT INTO messages (id, project_id, user_id, sender, content)
      VALUES (${uuid()}::uuid, ${projectId}::uuid, ${clientId}::uuid, 'admin', ${msg})
    `.catch(() => {});

    return json({ ok: true, quote: { id: quoteId, project_id: projectId, client_id: clientId, total, currency, status: 'sent' } });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const payload = err?.payload ?? { error: 'Erreur' };
    return json(payload, status);
  }
};
