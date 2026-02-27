/**
 * GET /api/admin/stats — Statistiques globales du panneau admin
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../../lib/db';

function mapDbError(err: unknown): { code: string; hint?: string } {
  const message = err instanceof Error ? err.message : String(err ?? '');

  if (/relation\s+"?\w+"?\s+does\s+not\s+exist/i.test(message) || /\b42P01\b/.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init_postgres.sql dans Neon (SQL Editor).',
    };
  }

  if (/no\s+such\s+table/i.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init.sql sur D1 (wrangler d1 execute).',
    };
  }

  if (/DATABASE_URL/i.test(message)) {
    return { code: 'MissingDatabaseUrl', hint: 'Vérifie DATABASE_URL dans Vercel.' };
  }

  return { code: 'AdminStatsError' };
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

    if (db) {
    const [users, projects, messages, payments, pending] = await Promise.all([
      db.prepare(`SELECT COUNT(*) as n FROM users WHERE role='client'`).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) as n FROM projects WHERE status != 'annule'`).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) as n FROM messages WHERE sender='user'`).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) as n FROM payments WHERE status='paid'`).first<{ n: number }>(),
      db.prepare(`SELECT COUNT(*) as n FROM messages WHERE sender='user' AND id NOT IN (SELECT DISTINCT m2.id FROM messages m2 WHERE m2.sender='admin')`).first<{ n: number }>(),
    ]);

    // Revenus total
    const revenue = await db
      .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status='paid'`)
      .first<{ total: number }>();

    // 5 derniers clients inscrits
    const recent = await db
      .prepare(`SELECT id, name, email, created_at FROM users WHERE role='client' ORDER BY created_at DESC LIMIT 5`)
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
    sql<{ n: number }>`SELECT COUNT(*)::int as n FROM users WHERE role='client'`,
    sql<{ n: number }>`SELECT COUNT(*)::int as n FROM projects WHERE status != 'annule'`,
    sql<{ n: number }>`SELECT COUNT(*)::int as n FROM messages WHERE sender='user'`,
    sql<{ n: number }>`SELECT COUNT(*)::int as n FROM payments WHERE status='paid'`,
    sql<{ n: number }>`SELECT COUNT(*)::int as n FROM messages WHERE sender='user' AND id NOT IN (SELECT DISTINCT m2.id FROM messages m2 WHERE m2.sender='admin')`,
  ]);

  const revenue = await sql<{ total: number }>`SELECT COALESCE(SUM(amount), 0)::float8 as total FROM payments WHERE status='paid'`;
  const recent = await sql<{ id: string; name: string; email: string; created_at: string }>
    `SELECT id::text as id, name, email, created_at::text as created_at FROM users WHERE role='client' ORDER BY created_at DESC LIMIT 5`;

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
