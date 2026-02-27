/**
 * GET /api/admin/stats — Statistiques globales du panneau admin
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../lib/db';

function mapDbError(err: unknown): { code: string; hint?: string } {
  const message = err instanceof Error ? err.message : String(err ?? '');

  if (/relation\s+"?\w+"?\s+does\s+not\s+exist/i.test(message) || /\b42P01\b/.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init_postgres.sql puis migrations/0002_assignments_postgres.sql dans Neon (SQL Editor).',
    };
  }

  if (/no\s+such\s+table/i.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init.sql puis migrations/0002_assignments.sql sur D1 (wrangler d1 execute).',
    };
  }

  if (/DATABASE_URL/i.test(message)) {
    return { code: 'MissingDatabaseUrl', hint: 'Vérifie DATABASE_URL dans Vercel.' };
  }

  return { code: 'AdminStatsError' };
}

export const GET: APIRoute = async ({ locals, cookies }) => {
  try {
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

    const token = cookies.get('capitune_session')?.value;
    if (!token) return json({ error: 'Non connecté' }, 401);
    const me = await getUserFromSessionAny(db, token);
    if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

    if (db) {
    const [users, projects, messages, payments, pending] = await Promise.all([
      db.prepare(
        `SELECT COUNT(*) as n
         FROM users u
         JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ?
         WHERE u.role='client'`
      ).bind(me.id).first<{ n: number }>(),
      db.prepare(
        `SELECT COUNT(*) as n
         FROM projects p
         JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ?
         WHERE p.status != 'annule'`
      ).bind(me.id).first<{ n: number }>(),
      db.prepare(
        `SELECT COUNT(*) as n
         FROM messages m
         JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ?
         WHERE m.sender='user'`
      ).bind(me.id).first<{ n: number }>(),
      db.prepare(
        `SELECT COUNT(*) as n
         FROM payments pay
         JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ?
         WHERE pay.status='paid'`
      ).bind(me.id).first<{ n: number }>(),
      db.prepare(
        `SELECT COUNT(*) as n
         FROM (
           SELECT m.user_id, MAX(m.created_at) AS last_at
           FROM messages m
           JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ?
           GROUP BY m.user_id
         ) x
         JOIN messages m2 ON m2.user_id = x.user_id AND m2.created_at = x.last_at
         WHERE m2.sender='user'`
      ).bind(me.id).first<{ n: number }>(),
    ]);

    // Revenus total
    const revenue = await db
      .prepare(
        `SELECT COALESCE(SUM(pay.amount), 0) as total
         FROM payments pay
         JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ?
         WHERE pay.status='paid'`
      )
      .bind(me.id)
      .first<{ total: number }>();

    // 5 derniers clients inscrits
    const recent = await db
      .prepare(
        `SELECT u.id, u.name, u.email, u.created_at
         FROM users u
         JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ?
         WHERE u.role='client'
         ORDER BY u.created_at DESC
         LIMIT 5`
      )
      .bind(me.id)
      .all<{ id: string; name: string; email: string; created_at: string }>();

      return json({
      users:    users?.n    ?? 0,
      projects: projects?.n ?? 0,
      messages: messages?.n ?? 0,
      paid:     payments?.n ?? 0,
      pending:  pending?.n  ?? 0,
      revenue:  revenue?.total ?? 0,
      recentUsers: recent.results,
    });
  }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

  const [users, projects, messages, payments, pending] = await Promise.all([
    sql<{ n: number }>
      `SELECT COUNT(*)::int as n
       FROM users u
       JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ${me.id}::uuid
       WHERE u.role='client'`,
    sql<{ n: number }>
      `SELECT COUNT(*)::int as n
       FROM projects p
       JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ${me.id}::uuid
       WHERE p.status != 'annule'`,
    sql<{ n: number }>
      `SELECT COUNT(*)::int as n
       FROM messages m
       JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ${me.id}::uuid
       WHERE m.sender='user'`,
    sql<{ n: number }>
      `SELECT COUNT(*)::int as n
       FROM payments pay
       JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ${me.id}::uuid
       WHERE pay.status='paid'`,
    sql<{ n: number }>
      `SELECT COUNT(*)::int as n
       FROM (
         SELECT DISTINCT ON (m.user_id) m.user_id, m.sender
         FROM messages m
         JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ${me.id}::uuid
         ORDER BY m.user_id, m.created_at DESC
       ) last
       WHERE last.sender='user'`,
  ]);

  const revenue = await sql<{ total: number }>
    `SELECT COALESCE(SUM(pay.amount), 0)::float8 as total
     FROM payments pay
     JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ${me.id}::uuid
     WHERE pay.status='paid'`;
  const recent = await sql<{ id: string; name: string; email: string; created_at: string }>
    `SELECT u.id::text as id, u.name, u.email, u.created_at::text as created_at
     FROM users u
     JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ${me.id}::uuid
     WHERE u.role='client'
     ORDER BY u.created_at DESC
     LIMIT 5`;

    return json({
      users:    users[0]?.n    ?? 0,
      projects: projects[0]?.n ?? 0,
      messages: messages[0]?.n ?? 0,
      paid:     payments[0]?.n ?? 0,
      pending:  pending[0]?.n  ?? 0,
      revenue:  revenue[0]?.total ?? 0,
      recentUsers: recent,
    });
  } catch (err) {
    const mapped = mapDbError(err);
    console.error('[Admin stats] Error:', err);
    return json({ error: mapped.code, hint: mapped.hint }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
