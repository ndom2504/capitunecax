/**
 * GET /api/admin/stats — Statistiques globales du panneau admin
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  if (!db) return json({ error: 'DB non disponible' }, 503);

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
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
