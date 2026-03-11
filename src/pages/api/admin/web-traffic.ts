import type { APIRoute } from 'astro';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase } from '../../../lib/db';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function daysParam(url: URL) {
  const raw = Number(url.searchParams.get('days') || 7);
  const n = Math.round(raw);
  return Math.min(90, Math.max(1, Number.isFinite(n) ? n : 7));
}

function sinceDate(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export const GET: APIRoute = async ({ locals, cookies, url }) => {
  const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

  const days = daysParam(url);
  const sinceIso = sinceDate(days);

  try {
    if (db) {
      const [totalsRow, topPagesRow, topZonesRow, topLinksRow, dailyRow, recentClicksRow, topCountriesRow] = await Promise.all([
        db.prepare(
          `SELECT
             SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END) AS pageviews,
             SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks,
             COUNT(DISTINCT CASE WHEN session_id != '' THEN session_id END) AS visitors,
             COUNT(DISTINCT path) AS tracked_pages,
             COUNT(DISTINCT CASE WHEN zone != '' THEN zone END) AS tracked_zones
           FROM web_analytics_events
           WHERE created_at >= ?`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).first<Record<string, unknown>>(),
        db.prepare(
          `SELECT
             path,
             SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END) AS pageviews,
             SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks
           FROM web_analytics_events
           WHERE created_at >= ?
           GROUP BY path
           ORDER BY clicks DESC, pageviews DESC
           LIMIT 10`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
        db.prepare(
          `SELECT zone,
                  SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks,
                  COUNT(*) AS events
           FROM web_analytics_events
           WHERE created_at >= ? AND zone != ''
           GROUP BY zone
           ORDER BY clicks DESC, events DESC
           LIMIT 10`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
        db.prepare(
          `SELECT label, href, COUNT(*) AS clicks
           FROM web_analytics_events
           WHERE created_at >= ? AND event_type='click' AND (label != '' OR href != '')
           GROUP BY label, href
           ORDER BY clicks DESC
           LIMIT 10`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
        db.prepare(
          `SELECT substr(created_at, 1, 10) AS day,
                  SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END) AS pageviews,
                  SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks
           FROM web_analytics_events
           WHERE created_at >= ?
           GROUP BY substr(created_at, 1, 10)
           ORDER BY day ASC`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
        db.prepare(
          `SELECT created_at, path, zone, label, href
           FROM web_analytics_events
           WHERE created_at >= ? AND event_type='click'
           ORDER BY created_at DESC
           LIMIT 20`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
        db.prepare(
          `SELECT country_code,
                  SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END) AS pageviews,
                  SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END) AS clicks,
                  COUNT(DISTINCT CASE WHEN session_id != '' THEN session_id END) AS visitors
           FROM web_analytics_events
           WHERE created_at >= ? AND country_code != ''
           GROUP BY country_code
           ORDER BY visitors DESC, clicks DESC, pageviews DESC
           LIMIT 12`,
        ).bind(sinceIso.slice(0, 19).replace('T', ' ')).all<Record<string, unknown>>(),
      ]);

      const topPages = (topPagesRow.results ?? []).map((r) => ({
        path: String(r.path ?? '/'),
        pageviews: toNumber(r.pageviews),
        clicks: toNumber(r.clicks),
        ctr: toNumber(r.pageviews) > 0 ? Math.round((toNumber(r.clicks) / toNumber(r.pageviews)) * 1000) / 10 : 0,
      }));

      return json({
        days,
        totals: {
          pageviews: toNumber(totalsRow?.pageviews),
          clicks: toNumber(totalsRow?.clicks),
          visitors: toNumber(totalsRow?.visitors),
          tracked_pages: toNumber(totalsRow?.tracked_pages),
          tracked_zones: toNumber(totalsRow?.tracked_zones),
        },
        topPages,
        topZones: (topZonesRow.results ?? []).map((r) => ({ zone: String(r.zone ?? '—'), clicks: toNumber(r.clicks), events: toNumber(r.events) })),
        topLinks: (topLinksRow.results ?? []).map((r) => ({ label: String(r.label ?? ''), href: String(r.href ?? ''), clicks: toNumber(r.clicks) })),
        topCountries: (topCountriesRow.results ?? []).map((r) => ({ code: String(r.country_code ?? ''), pageviews: toNumber(r.pageviews), clicks: toNumber(r.clicks), visitors: toNumber(r.visitors) })),
        daily: (dailyRow.results ?? []).map((r) => ({ day: String(r.day ?? ''), pageviews: toNumber(r.pageviews), clicks: toNumber(r.clicks) })),
        recentClicks: (recentClicksRow.results ?? []).map((r) => ({ created_at: String(r.created_at ?? ''), path: String(r.path ?? '/'), zone: String(r.zone ?? ''), label: String(r.label ?? ''), href: String(r.href ?? '') })),
      });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const [totalsRows, topPagesRows, topZonesRows, topLinksRows, dailyRows, recentClicksRows, topCountriesRows] = await Promise.all([
      sql<Record<string, unknown>>`
        SELECT
          SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END)::int AS pageviews,
          SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END)::int AS clicks,
          COUNT(DISTINCT NULLIF(session_id, ''))::int AS visitors,
          COUNT(DISTINCT path)::int AS tracked_pages,
          COUNT(DISTINCT NULLIF(zone, ''))::int AS tracked_zones
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz
      `,
      sql<Record<string, unknown>>`
        SELECT
          path,
          SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END)::int AS pageviews,
          SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END)::int AS clicks
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz
        GROUP BY path
        ORDER BY clicks DESC, pageviews DESC
        LIMIT 10
      `,
      sql<Record<string, unknown>>`
        SELECT zone, SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END)::int AS clicks, COUNT(*)::int AS events
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz AND zone != ''
        GROUP BY zone
        ORDER BY clicks DESC, events DESC
        LIMIT 10
      `,
      sql<Record<string, unknown>>`
        SELECT label, href, COUNT(*)::int AS clicks
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz AND event_type='click' AND (label != '' OR href != '')
        GROUP BY label, href
        ORDER BY clicks DESC
        LIMIT 10
      `,
      sql<Record<string, unknown>>`
        SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
               SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END)::int AS pageviews,
               SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END)::int AS clicks
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz
        GROUP BY created_at::date
        ORDER BY day ASC
      `,
      sql<Record<string, unknown>>`
        SELECT created_at::text AS created_at, path, zone, label, href
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz AND event_type='click'
        ORDER BY created_at DESC
        LIMIT 20
      `,
      sql<Record<string, unknown>>`
        SELECT country_code,
               SUM(CASE WHEN event_type='pageview' THEN 1 ELSE 0 END)::int AS pageviews,
               SUM(CASE WHEN event_type='click' THEN 1 ELSE 0 END)::int AS clicks,
               COUNT(DISTINCT NULLIF(session_id, ''))::int AS visitors
        FROM web_analytics_events
        WHERE created_at >= ${sinceIso}::timestamptz AND country_code != ''
        GROUP BY country_code
        ORDER BY visitors DESC, clicks DESC, pageviews DESC
        LIMIT 12
      `,
    ]);

    const totals = totalsRows?.[0] ?? {};
    const topPages = (topPagesRows ?? []).map((r) => ({
      path: String(r.path ?? '/'),
      pageviews: toNumber(r.pageviews),
      clicks: toNumber(r.clicks),
      ctr: toNumber(r.pageviews) > 0 ? Math.round((toNumber(r.clicks) / toNumber(r.pageviews)) * 1000) / 10 : 0,
    }));

    return json({
      days,
      totals: {
        pageviews: toNumber(totals.pageviews),
        clicks: toNumber(totals.clicks),
        visitors: toNumber(totals.visitors),
        tracked_pages: toNumber(totals.tracked_pages),
        tracked_zones: toNumber(totals.tracked_zones),
      },
      topPages,
      topZones: (topZonesRows ?? []).map((r) => ({ zone: String(r.zone ?? '—'), clicks: toNumber(r.clicks), events: toNumber(r.events) })),
      topLinks: (topLinksRows ?? []).map((r) => ({ label: String(r.label ?? ''), href: String(r.href ?? ''), clicks: toNumber(r.clicks) })),
      topCountries: (topCountriesRows ?? []).map((r) => ({ code: String(r.country_code ?? ''), pageviews: toNumber(r.pageviews), clicks: toNumber(r.clicks), visitors: toNumber(r.visitors) })),
      daily: (dailyRows ?? []).map((r) => ({ day: String(r.day ?? ''), pageviews: toNumber(r.pageviews), clicks: toNumber(r.clicks) })),
      recentClicks: (recentClicksRows ?? []).map((r) => ({ created_at: String(r.created_at ?? ''), path: String(r.path ?? '/'), zone: String(r.zone ?? ''), label: String(r.label ?? ''), href: String(r.href ?? '') })),
    });
  } catch (err) {
    console.error('[Admin web-traffic] Error:', err);
    return json({ error: 'Erreur serveur analytics' }, 500);
  }
};
