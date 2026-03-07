/**
 * GET /api/admin/client/[id] — Fiche complète d'un client
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../../lib/db';
import { isSuperAdminEmail } from '../../../../lib/admin-emails';

function mapDbError(err: unknown): { code: string; hint?: string } {
  const message = err instanceof Error ? err.message : String(err ?? '');

  // Postgres/Neon
  if (/relation\s+"?\w+"?\s+does\s+not\s+exist/i.test(message) || /\b42P01\b/.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init_postgres.sql puis migrations/0002_assignments_postgres.sql dans Neon (SQL Editor).',
    };
  }

  // D1
  if (/no\s+such\s+table/i.test(message)) {
    return {
      code: 'DatabaseNotInitialized',
      hint: 'Exécute migrations/0001_init.sql puis migrations/0002_assignments.sql sur D1 (wrangler d1 execute).',
    };
  }

  if (/DATABASE_URL/i.test(message)) {
    return { code: 'MissingDatabaseUrl', hint: 'Vérifie DATABASE_URL dans Vercel.' };
  }

  return { code: 'AdminClientError' };
}

export const GET: APIRoute = async ({ params, locals, cookies }) => {
  try {
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

    const token = cookies.get('capitune_session')?.value ?? '';
    if (!token) return json({ error: 'Non connecté' }, 401);
    const me = await getUserFromSessionAny(db, token);
    if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);
    // Tous les admins peuvent consulter la fiche de n'importe quel client
    void isSuperAdminEmail(me.email);

    const { id } = params;
    if (!id) return json({ error: 'ID manquant' }, 400);

    if (db) {
      const user = await db
        .prepare(`SELECT id, name, email, phone, location, bio, role, created_at FROM users WHERE id=?`)
        .bind(id)
        .first<Record<string, unknown>>();

      if (!user) return json({ error: 'Client introuvable' }, 404);

      const projects = await db
        .prepare(
          `SELECT p.*, ps.pack_id, ps.pack_price, ps.carte
           FROM projects p
           LEFT JOIN project_services ps ON ps.project_id=p.id
           WHERE p.user_id=?
           ORDER BY p.updated_at DESC`
        )
        .bind(id)
        .all<Record<string, unknown>>()
        .catch(() => ({ results: [] } as any));

      const messages = await db
        .prepare(`SELECT * FROM messages WHERE user_id=? ORDER BY created_at ASC LIMIT 200`)
        .bind(id)
        .all<Record<string, unknown>>()
        .catch(() => ({ results: [] } as any));

      const payments = await db
        .prepare(`SELECT * FROM payments WHERE user_id=? ORDER BY created_at DESC`)
        .bind(id)
        .all<Record<string, unknown>>()
        .catch(() => ({ results: [] } as any));

      let unlockRow: { unlocked?: number | boolean | null } | null = null;
      try {
        unlockRow = await db
          .prepare(`SELECT unlocked FROM autonomie_unlocks WHERE user_id=? LIMIT 1`)
          .bind(id)
          .first<{ unlocked?: number | boolean | null }>();
      } catch {
        unlockRow = null;
      }

      (user as any).autonomie_unlocked = Boolean((unlockRow as any)?.unlocked);

      return json({
        user,
        projects: projects.results ?? [],
        messages: messages.results ?? [],
        payments: payments.results ?? [],
      });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const userRows = await sql<Record<string, unknown>>`
      SELECT id::text as id, name, email, phone, location, bio, role, created_at::text as created_at
      FROM users WHERE id = ${id} LIMIT 1
    `;
    const user = userRows[0] ?? null;
    if (!user) return json({ error: 'Client introuvable' }, 404);

    const projects = await sql<Record<string, unknown>>`
      SELECT p.*, ps.pack_id, (ps.pack_price::float8) as pack_price, ps.carte
      FROM projects p
      LEFT JOIN project_services ps ON ps.project_id = p.id
      WHERE p.user_id = ${id}
      ORDER BY p.updated_at DESC
    `.catch(() => [] as Record<string, unknown>[]);

    const messages = await sql<Record<string, unknown>>`
      SELECT *, created_at::text as created_at
      FROM messages WHERE user_id = ${id}
      ORDER BY created_at ASC
      LIMIT 200
    `.catch(() => [] as Record<string, unknown>[]);

    const payments = await sql<Record<string, unknown>>`
      SELECT *, created_at::text as created_at
      FROM payments WHERE user_id = ${id}
      ORDER BY created_at DESC
    `.catch(() => [] as Record<string, unknown>[]);

    let unlockRows: Array<{ unlocked: boolean | null }> = [];
    try {
      unlockRows = await sql<{ unlocked: boolean | null }>`
        SELECT unlocked FROM autonomie_unlocks WHERE user_id = ${String(id)} LIMIT 1
      `;
    } catch {
      unlockRows = [];
    }

    (user as any).autonomie_unlocked = Boolean(unlockRows?.[0]?.unlocked);
    return json({ user, projects, messages, payments });
  } catch (err) {
    const mapped = mapDbError(err);
    console.error('[Admin client] Error:', err);
    return json({ error: mapped.code, hint: mapped.hint }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
