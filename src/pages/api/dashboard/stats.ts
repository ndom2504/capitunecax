/**
 * GET /api/dashboard/stats
 * - Pro: stats services/utilisateurs/transactions + score opérationnel (traitement dossiers + réactivité)
 * - Client: indicateurs demandes + tendances destinations/domaines (via API)
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

type DashboardMode = 'pro' | 'client';

export const GET: APIRoute = async ({ cookies, locals, url }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  // Sans DB (ni D1 ni Neon): retour minimal (dashboard présent mais sans données)
  if (!db && !useNeon) {
    const me = await getUserFromSessionAny(null, token);
    if (!me) return json({ error: 'Session expirée' }, 401);
    const mode: DashboardMode = String(me.account_type ?? '') === 'pro' ? 'pro' : 'client';
    return json({
      ok: true,
      persisted: false,
      mode,
      pro: mode === 'pro' ? emptyProStats() : undefined,
      client: mode === 'client' ? emptyClientStats() : undefined,
    });
  }

  const meFull = await getUserFromSessionFullAny(db, token);
  if (!meFull) return json({ error: 'Session expirée' }, 401);

  // Admin: autoriser pro-preview si ?pro=1 (aligné sur /dashboard?pro=1)
  const wantProPreview = url.searchParams.get('pro') === '1';
  if (String(meFull.role ?? '') === 'admin' && !wantProPreview) {
    return json({ error: 'Accès refusé' }, 403);
  }

  const isPro = wantProPreview || String((meFull as any)?.account_type ?? '') === 'pro';
  const mode: DashboardMode = isPro ? 'pro' : 'client';

  try {
    if (db) {
      if (mode === 'pro') {
        const stats = await computeProStatsD1(db, String(meFull.id));
        return json({ ok: true, persisted: true, mode, pro: stats });
      }
      const stats = await computeClientStatsD1(db, String(meFull.id));
      return json({ ok: true, persisted: true, mode, client: stats });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    if (mode === 'pro') {
      const stats = await computeProStatsNeon(sql, String(meFull.id));
      return json({ ok: true, persisted: true, mode, pro: stats });
    }
    const stats = await computeClientStatsNeon(sql, String(meFull.id));
    return json({ ok: true, persisted: true, mode, client: stats });
  } catch (e: any) {
    console.error('[dashboard/stats] error', e);
    return json({ error: e?.message || 'Erreur serveur' }, 500);
  }
};

function emptyProStats() {
  return {
    services_catalog: 0,
    services_offered: 0,
    clients: 0,
    transactions_paid: 0,
    revenue_paid: 0,
    projects_total: 0,
    projects_completed: 0,
    pending_conversations: 0,
    operational_score: 0,
    processing_rate: 0,
    reactivity_rate: 0,
  };
}

function emptyClientStats() {
  return {
    my_requests_total: 0,
    my_requests_by_status: { en_cours: 0, soumis: 0, termine: 0, annule: 0 },
    my_transactions_paid: 0,
    my_revenue_paid: 0,
    trending_destinations: [] as Array<{ label: string; count: number }>,
    trending_domains: [] as Array<{ label: string; count: number }>,
    platform_requests_30d: 0,
  };
}

async function computeProStatsD1(db: D1Database, proId: string) {
  const [servicesCatalog, clients, paymentsPaid, projectsTotal, projectsCompleted, pending, clientsWithMessages] =
    await Promise.all([
      safeCountD1(db, `SELECT COUNT(*) as n FROM catalog_services`),
      safeCountD1(
        db,
        `SELECT COUNT(*) as n
         FROM users u
         JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ?
         WHERE u.role='client'`,
        [proId]
      ),
      safeCountD1(
        db,
        `SELECT COUNT(*) as n
         FROM payments pay
         JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ?
         WHERE pay.status='paid'`,
        [proId]
      ),
      safeCountD1(
        db,
        `SELECT COUNT(*) as n
         FROM projects p
         JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ?
         WHERE p.status != 'annule'`,
        [proId]
      ),
      safeCountD1(
        db,
        `SELECT COUNT(*) as n
         FROM projects p
         JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ?
         WHERE p.status = 'termine'`,
        [proId]
      ),
      safeCountD1(
        db,
        `SELECT COUNT(*) as n
         FROM (
           SELECT m.user_id, MAX(m.created_at) AS last_at
           FROM messages m
           JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ?
           GROUP BY m.user_id
         ) x
         JOIN messages m2 ON m2.user_id = x.user_id AND m2.created_at = x.last_at
         WHERE m2.sender='user'`,
        [proId]
      ),
      safeCountD1(
        db,
        `SELECT COUNT(DISTINCT m.user_id) as n
         FROM messages m
         JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ?`,
        [proId]
      ),
    ]);

  const revenueRow = await safeFirstD1<{ total: number }>(
    db,
    `SELECT COALESCE(SUM(pay.amount), 0) as total
     FROM payments pay
     JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ?
     WHERE pay.status='paid'`,
    [proId]
  );

  const servicesOffered = await inferServicesOfferedCountD1(db, proId);

  const processingRate = ratio(projectsCompleted, projectsTotal);
  const reactivityRate = 1 - ratio(pending, Math.max(1, clientsWithMessages));
  const operationalScore = clampInt(Math.round((processingRate * 0.6 + reactivityRate * 0.4) * 100), 0, 100);

  return {
    services_catalog: servicesCatalog,
    services_offered: servicesOffered,
    clients,
    transactions_paid: paymentsPaid,
    revenue_paid: Number(revenueRow?.total ?? 0),
    projects_total: projectsTotal,
    projects_completed: projectsCompleted,
    pending_conversations: pending,
    operational_score: operationalScore,
    processing_rate: processingRate,
    reactivity_rate: reactivityRate,
  };
}

async function computeClientStatsD1(db: D1Database, userId: string) {
  const rows = await db
    .prepare(
      `SELECT status, COUNT(*) as n
       FROM projects
       WHERE user_id = ?
       GROUP BY status`
    )
    .bind(userId)
    .all<{ status: string; n: number }>();

  const byStatus = { en_cours: 0, soumis: 0, termine: 0, annule: 0 };
  for (const r of rows.results ?? []) {
    const k = String(r.status ?? '');
    if (k in byStatus) (byStatus as any)[k] = Number(r.n ?? 0);
  }
  const myTotal = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const myPaidCount = await safeCountD1(
    db,
    `SELECT COUNT(*) as n FROM payments WHERE user_id = ? AND status='paid'`,
    [userId]
  );
  const myRevenueRow = await safeFirstD1<{ total: number }>(
    db,
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status='paid'`,
    [userId]
  );

  const platform30d = await safeCountD1(
    db,
    `SELECT COUNT(*) as n FROM projects WHERE created_at >= datetime('now','-30 days') AND status != 'annule'`
  );

  const trendingDest = await safeTopListD1(
    db,
    `SELECT pays as label, COUNT(*) as n
     FROM projects
     WHERE created_at >= datetime('now','-30 days') AND status != 'annule' AND pays IS NOT NULL AND TRIM(pays) != ''
     GROUP BY pays
     ORDER BY n DESC
     LIMIT 5`
  );

  const trendingDomains = await safeTopListD1(
    db,
    `SELECT domaine as label, COUNT(*) as n
     FROM projects
     WHERE created_at >= datetime('now','-30 days') AND status != 'annule' AND domaine IS NOT NULL AND TRIM(domaine) != ''
     GROUP BY domaine
     ORDER BY n DESC
     LIMIT 5`
  );

  return {
    my_requests_total: myTotal,
    my_requests_by_status: byStatus,
    my_transactions_paid: myPaidCount,
    my_revenue_paid: Number(myRevenueRow?.total ?? 0),
    trending_destinations: trendingDest,
    trending_domains: trendingDomains,
    platform_requests_30d: platform30d,
  };
}

async function computeProStatsNeon(
  sql: <T = unknown>(strings: TemplateStringsArray, ...values: any[]) => Promise<T[]>,
  proIdText: string
) {
  const proId = proIdText;
  const [servicesCatalog, clients, paymentsPaid, projectsTotal, projectsCompleted, pending, clientsWithMessages] =
    await Promise.all([
      safeCountNeon(sql`SELECT COUNT(*)::int as n FROM catalog_services`),
      safeCountNeon(
        sql`SELECT COUNT(*)::int as n
            FROM users u
            JOIN client_assignments ca ON ca.client_id = u.id AND ca.pro_id = ${proId}::uuid
            WHERE u.role='client'`
      ),
      safeCountNeon(
        sql`SELECT COUNT(*)::int as n
            FROM payments pay
            JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ${proId}::uuid
            WHERE pay.status='paid'`
      ),
      safeCountNeon(
        sql`SELECT COUNT(*)::int as n
            FROM projects p
            JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ${proId}::uuid
            WHERE p.status != 'annule'`
      ),
      safeCountNeon(
        sql`SELECT COUNT(*)::int as n
            FROM projects p
            JOIN client_assignments ca ON ca.client_id = p.user_id AND ca.pro_id = ${proId}::uuid
            WHERE p.status = 'termine'`
      ),
      safeCountNeon(
        sql`SELECT COUNT(*)::int as n
            FROM (
              SELECT DISTINCT ON (m.user_id) m.user_id, m.sender
              FROM messages m
              JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ${proId}::uuid
              ORDER BY m.user_id, m.created_at DESC
            ) last
            WHERE last.sender='user'`
      ),
      safeCountNeon(
        sql`SELECT COUNT(DISTINCT m.user_id)::int as n
            FROM messages m
            JOIN client_assignments ca ON ca.client_id = m.user_id AND ca.pro_id = ${proId}::uuid`
      ),
    ]);

  const revenue = await safeFirstNeon<{ total: number }>(
    sql,
    sql`SELECT COALESCE(SUM(pay.amount), 0)::float8 as total
        FROM payments pay
        JOIN client_assignments ca ON ca.client_id = pay.user_id AND ca.pro_id = ${proId}::uuid
        WHERE pay.status='paid'`
  );

  const servicesOffered = await inferServicesOfferedCountNeon(sql, proId);

  const processingRate = ratio(projectsCompleted, projectsTotal);
  const reactivityRate = 1 - ratio(pending, Math.max(1, clientsWithMessages));
  const operationalScore = clampInt(Math.round((processingRate * 0.6 + reactivityRate * 0.4) * 100), 0, 100);

  return {
    services_catalog: servicesCatalog,
    services_offered: servicesOffered,
    clients,
    transactions_paid: paymentsPaid,
    revenue_paid: Number(revenue?.total ?? 0),
    projects_total: projectsTotal,
    projects_completed: projectsCompleted,
    pending_conversations: pending,
    operational_score: operationalScore,
    processing_rate: processingRate,
    reactivity_rate: reactivityRate,
  };
}

async function computeClientStatsNeon(
  sql: <T = unknown>(strings: TemplateStringsArray, ...values: any[]) => Promise<T[]>,
  userIdText: string
) {
  const userId = userIdText;
  const statusRows = await sql<{ status: string; n: number }>`
    SELECT status, COUNT(*)::int as n
    FROM projects
    WHERE user_id = ${userId}::uuid
    GROUP BY status
  `;

  const byStatus = { en_cours: 0, soumis: 0, termine: 0, annule: 0 };
  for (const r of statusRows ?? []) {
    const k = String((r as any).status ?? '');
    if (k in byStatus) (byStatus as any)[k] = Number((r as any).n ?? 0);
  }
  const myTotal = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const myPaidCount = await safeCountNeon(
    sql`SELECT COUNT(*)::int as n FROM payments WHERE user_id = ${userId}::uuid AND status='paid'`
  );
  const myRevenue = await safeFirstNeon<{ total: number }>(
    sql,
    sql`SELECT COALESCE(SUM(amount),0)::float8 as total FROM payments WHERE user_id = ${userId}::uuid AND status='paid'`
  );

  const platform30d = await safeCountNeon(
    sql`SELECT COUNT(*)::int as n FROM projects WHERE created_at >= (now() - interval '30 days') AND status != 'annule'`
  );

  const trendingDest = await safeTopListNeon(
    sql,
    sql`SELECT pays as label, COUNT(*)::int as n
        FROM projects
        WHERE created_at >= (now() - interval '30 days') AND status != 'annule' AND COALESCE(TRIM(pays),'') != ''
        GROUP BY pays
        ORDER BY n DESC
        LIMIT 5`
  );

  const trendingDomains = await safeTopListNeon(
    sql,
    sql`SELECT domaine as label, COUNT(*)::int as n
        FROM projects
        WHERE created_at >= (now() - interval '30 days') AND status != 'annule' AND COALESCE(TRIM(domaine),'') != ''
        GROUP BY domaine
        ORDER BY n DESC
        LIMIT 5`
  );

  return {
    my_requests_total: myTotal,
    my_requests_by_status: byStatus,
    my_transactions_paid: myPaidCount,
    my_revenue_paid: Number(myRevenue?.total ?? 0),
    trending_destinations: trendingDest,
    trending_domains: trendingDomains,
    platform_requests_30d: platform30d,
  };
}

async function inferServicesOfferedCountD1(db: D1Database, proId: string): Promise<number> {
  try {
    const row = await db
      .prepare(`SELECT pro_pack_services as v FROM users WHERE id = ? LIMIT 1`)
      .bind(proId)
      .first<{ v: string }>();
    const raw = String((row as any)?.v ?? '');
    if (!raw) return 0;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return 0;
    const set = new Set<string>();
    Object.values(obj).forEach((arr: any) => {
      if (Array.isArray(arr)) arr.forEach((x) => set.add(String(x)));
    });
    return set.size;
  } catch {
    return 0;
  }
}

async function inferServicesOfferedCountNeon(
  sql: <T = unknown>(strings: TemplateStringsArray, ...values: any[]) => Promise<T[]>,
  proIdText: string
): Promise<number> {
  try {
    const rows = await sql<{ v: string }>`SELECT pro_pack_services as v FROM users WHERE id = ${proIdText}::uuid LIMIT 1`;
    const raw = String((rows[0] as any)?.v ?? '');
    if (!raw) return 0;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return 0;
    const set = new Set<string>();
    Object.values(obj).forEach((arr: any) => {
      if (Array.isArray(arr)) arr.forEach((x) => set.add(String(x)));
    });
    return set.size;
  } catch {
    return 0;
  }
}

async function safeCountD1(db: D1Database, query: string, binds: any[] = []): Promise<number> {
  try {
    const stmt = db.prepare(query);
    const res = binds.length ? await stmt.bind(...binds).first<{ n: number }>() : await stmt.first<{ n: number }>();
    return Number((res as any)?.n ?? 0) || 0;
  } catch {
    return 0;
  }
}

async function safeFirstD1<T>(db: D1Database, query: string, binds: any[] = []): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    const res = binds.length ? await stmt.bind(...binds).first<T>() : await stmt.first<T>();
    return (res as any) ?? null;
  } catch {
    return null;
  }
}

async function safeTopListD1(
  db: D1Database,
  query: string,
  binds: any[] = []
): Promise<Array<{ label: string; count: number }>> {
  try {
    const stmt = db.prepare(query);
    const res = binds.length
      ? await stmt.bind(...binds).all<{ label: string; n: number }>()
      : await stmt.all<{ label: string; n: number }>();
    return (res.results ?? []).map((r) => ({ label: String((r as any).label ?? ''), count: Number((r as any).n ?? 0) }));
  } catch {
    return [];
  }
}

async function safeCountNeon<T extends { n: number }>(q: Promise<T[]>): Promise<number> {
  try {
    const rows = await q;
    return Number((rows[0] as any)?.n ?? 0) || 0;
  } catch {
    return 0;
  }
}

async function safeFirstNeon<T>(
  sql: <U = unknown>(strings: TemplateStringsArray, ...values: any[]) => Promise<U[]>,
  q: Promise<T[]>
): Promise<T | null> {
  try {
    const rows = await q;
    return (rows[0] as any) ?? null;
  } catch {
    return null;
  }
}

async function safeTopListNeon(
  sql: <U = unknown>(strings: TemplateStringsArray, ...values: any[]) => Promise<U[]>,
  q: Promise<Array<{ label: string; n: number }>>
): Promise<Array<{ label: string; count: number }>> {
  try {
    const rows = await q;
    return (rows ?? []).map((r: any) => ({ label: String(r.label ?? ''), count: Number(r.n ?? 0) }));
  } catch {
    return [];
  }
}

function ratio(n: number, d: number): number {
  const nn = Number(n) || 0;
  const dd = Number(d) || 0;
  if (dd <= 0) return 0;
  return Math.max(0, Math.min(1, nn / dd));
}

function clampInt(value: number, min: number, max: number): number {
  const v = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, v));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
