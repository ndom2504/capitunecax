/**
 * GET /api/admin/clients — Liste paginée des clients avec leur projet + dernier message
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  if (!db) return json({ error: 'DB non disponible' }, 503);

  const url   = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = (url.searchParams.get('q') ?? '').trim();

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
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
