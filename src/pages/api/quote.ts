/**
 * GET /api/quote — Dernière proposition tarifaire du projet actif (côté client)
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase } from '../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ quote: null, persisted: false });

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  try {
    if (db) {
      const project = await db
        .prepare(`SELECT id FROM projects WHERE user_id=? AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`)
        .bind(me.id)
        .first<{ id: string }>();

      if (!project?.id) return json({ quote: null });

      const quote = await db
        .prepare(
          `SELECT * FROM project_quotes
           WHERE project_id=?
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(project.id)
        .first<Record<string, unknown>>();

      return json({ quote: quote ?? null });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ quote: null, persisted: false });

    const projectRows = await sql<{ id: string }>
      `SELECT id::text as id FROM projects WHERE user_id = ${me.id}::uuid AND status != 'annule' ORDER BY updated_at DESC LIMIT 1`;
    const projectId = projectRows?.[0]?.id ?? null;
    if (!projectId) return json({ quote: null });

    const quoteRows = await sql<Record<string, unknown>>`
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
      WHERE project_id = ${projectId}::uuid
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return json({ quote: quoteRows?.[0] ?? null });
  } catch (err) {
    console.error('[quote GET] error', err);
    return json({ quote: null }, 200);
  }
};
