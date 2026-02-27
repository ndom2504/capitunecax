/**
 * GET /api/admin/clients — Liste paginée des clients avec leur projet + dernier message
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../../lib/db';

function mapDbError(err: unknown): { code: string; hint?: string } {
  const message = err instanceof Error ? err.message : String(err ?? '');

  // Postgres/Neon
  if (/relation\s+"?\w+"?\s+does\s+not\s+exist/i.test(message) || /\b42P01\b/.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init_postgres.sql dans Neon (SQL Editor).',
    };
  }

  // D1
  if (/no\s+such\s+table/i.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init.sql sur D1 (wrangler d1 execute).',
    };
  }

  if (/DATABASE_URL/i.test(message)) {
    return { code: 'MissingDatabaseUrl', hint: 'Vérifie DATABASE_URL dans Vercel.' };
  }

  return { code: 'AdminClientsError' };
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const url   = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = (url.searchParams.get('q') ?? '').trim();

    if (db) {
      const where  = search ? `WHERE u.role='client' AND (u.name LIKE ? OR u.email LIKE ?)` : `WHERE u.role='client'`;
      const params = search ? [`%${search}%`, `%${search}%`] : [];

    const countRow = await db
      .prepare(`SELECT COUNT(*) as n FROM users u ${where}`)
      .bind(...params)
      .first<{ n: number }>();

    const rows = await db
      .prepare(`
        SELECT
          u.id, u.name, u.email, u.phone, u.created_at,
          p.id        AS project_id,
          p.type      AS project_type,
          p.status    AS project_status,
          p.updated_at AS project_updated,
          (SELECT content FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg,
          (SELECT created_at FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg_at,
          (SELECT COUNT(*) FROM messages WHERE user_id=u.id AND sender='user') AS msg_count,
          (SELECT COUNT(*) FROM payments WHERE user_id=u.id AND status='paid') AS paid_count,
          (SELECT COALESCE(SUM(amount),0) FROM payments WHERE user_id=u.id AND status='paid') AS total_paid
        FROM users u
        LEFT JOIN projects p ON p.user_id = u.id AND p.status != 'annule'
        ${where}
        GROUP BY u.id
        ORDER BY COALESCE(p.updated_at, u.created_at) DESC
        LIMIT ? OFFSET ?
      `)
      .bind(...params, limit, offset)
      .all<Record<string, unknown>>();

      return json({
        clients: rows.results,
        total:   countRow?.n ?? 0,
        page,
        pages:   Math.ceil((countRow?.n ?? 0) / limit),
      });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const q = `%${search}%`;

    const countRows = search
      ? await sql<{ n: number }>
          `SELECT COUNT(*)::int as n FROM users u WHERE u.role='client' AND (u.name ILIKE ${q} OR u.email ILIKE ${q})`
      : await sql<{ n: number }>
          `SELECT COUNT(*)::int as n FROM users u WHERE u.role='client'`;

    const rows = search
      ? await sql<Record<string, unknown>>`
          SELECT
            u.id::text as id,
            u.name,
            u.email,
            u.phone,
            u.created_at::text as created_at,
            p.id::text AS project_id,
            p.type AS project_type,
            p.status AS project_status,
            p.updated_at::text AS project_updated,
            (SELECT content FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg,
            (SELECT created_at::text FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg_at,
            (SELECT COUNT(*)::int FROM messages WHERE user_id=u.id AND sender='user') AS msg_count,
            (SELECT COUNT(*)::int FROM payments WHERE user_id=u.id AND status='paid') AS paid_count,
            (SELECT COALESCE(SUM(amount),0)::float8 FROM payments WHERE user_id=u.id AND status='paid') AS total_paid
          FROM users u
          LEFT JOIN LATERAL (
            SELECT id, type, status, updated_at
            FROM projects
            WHERE user_id = u.id AND status != 'annule'
            ORDER BY updated_at DESC
            LIMIT 1
          ) p ON true
          WHERE u.role='client' AND (u.name ILIKE ${q} OR u.email ILIKE ${q})
          ORDER BY COALESCE(p.updated_at, u.created_at) DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql<Record<string, unknown>>`
          SELECT
            u.id::text as id,
            u.name,
            u.email,
            u.phone,
            u.created_at::text as created_at,
            p.id::text AS project_id,
            p.type AS project_type,
            p.status AS project_status,
            p.updated_at::text AS project_updated,
            (SELECT content FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg,
            (SELECT created_at::text FROM messages WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1) AS last_msg_at,
            (SELECT COUNT(*)::int FROM messages WHERE user_id=u.id AND sender='user') AS msg_count,
            (SELECT COUNT(*)::int FROM payments WHERE user_id=u.id AND status='paid') AS paid_count,
            (SELECT COALESCE(SUM(amount),0)::float8 FROM payments WHERE user_id=u.id AND status='paid') AS total_paid
          FROM users u
          LEFT JOIN LATERAL (
            SELECT id, type, status, updated_at
            FROM projects
            WHERE user_id = u.id AND status != 'annule'
            ORDER BY updated_at DESC
            LIMIT 1
          ) p ON true
          WHERE u.role='client'
          ORDER BY COALESCE(p.updated_at, u.created_at) DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

    const total = countRows[0]?.n ?? 0;
    return json({ clients: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    const mapped = mapDbError(err);
    console.error('[Admin clients] Error:', err);
    return json({ error: mapped.code, hint: mapped.hint }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
