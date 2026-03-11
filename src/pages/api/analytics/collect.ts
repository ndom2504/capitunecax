import type { APIRoute } from 'astro';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase, uuid } from '../../../lib/db';

export const prerender = false;

const ALLOWED_EVENTS = new Set(['pageview', 'click']);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeString(value: unknown, max = 255) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizePath(value: unknown) {
  const raw = normalizeString(value, 500);
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('/api/') || raw.startsWith('/admin')) return '';
  return raw;
}

function isBot(ua: string) {
  return /(bot|spider|crawler|preview|headless|slurp|curl|wget)/i.test(ua);
}

function detectCountryCode(request: Request) {
  const code =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country-code') ||
    '';
  const normalized = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return '';
  if (normalized === 'XX' || normalized === 'T1') return '';
  return normalized;
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();

  try {
    const ua = request.headers.get('user-agent') || '';
    if (!db && !useNeon) return new Response(null, { status: 204 });
    if (isBot(ua)) return new Response(null, { status: 204 });

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return new Response(null, { status: 204 });

    const eventType = normalizeString(body.eventType || body.event_type, 32).toLowerCase();
    if (!ALLOWED_EVENTS.has(eventType)) return new Response(null, { status: 204 });

    const path = normalizePath(body.path);
    if (!path) return new Response(null, { status: 204 });

    const token = cookies.get('capitune_session')?.value ?? '';
    const me = token ? await getUserFromSessionAny(db, token) : null;
    const countryCode = detectCountryCode(request);

    const pageTitle = normalizeString(body.pageTitle || body.page_title, 180);
    const zone = normalizeString(body.zone, 180);
    const label = normalizeString(body.label, 180);
    const elementTag = normalizeString(body.elementTag || body.element_tag, 40).toLowerCase();
    const href = normalizeString(body.href, 500);
    const referrer = normalizeString(body.referrer, 500);
    const sessionId = normalizeString(body.sessionId || body.session_id, 120);
    const viewportW = Math.max(0, Math.min(10000, Number(body.viewportW || body.viewport_w || 0) || 0));
    const viewportH = Math.max(0, Math.min(10000, Number(body.viewportH || body.viewport_h || 0) || 0));
    const clickX = Math.max(0, Math.min(1, Number(body.clickX || body.click_x || 0) || 0));
    const clickY = Math.max(0, Math.min(1, Number(body.clickY || body.click_y || 0) || 0));
    const metadata = {
      host: normalizeString(body.host, 120),
      lang: normalizeString(body.lang, 32),
      screen: normalizeString(body.screen, 32),
    };

    if (db) {
      await db
        .prepare(
          `INSERT INTO web_analytics_events (
            id, event_type, path, page_title, zone, label, element_tag, href, referrer,
            session_id, user_id, country_code, viewport_w, viewport_h, click_x, click_y, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(
          uuid(),
          eventType,
          path,
          pageTitle,
          zone,
          label,
          elementTag,
          href,
          referrer,
          sessionId,
          me ? String(me.id) : '',
          countryCode,
          viewportW,
          viewportH,
          clickX,
          clickY,
          JSON.stringify(metadata),
        )
        .run()
        .catch(() => {});
      return new Response(null, { status: 204 });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return new Response(null, { status: 204 });
    const userUuid = me ? String(me.id) : null;

    await sql`
      INSERT INTO web_analytics_events (
        id, event_type, path, page_title, zone, label, element_tag, href, referrer,
        session_id, user_id, country_code, viewport_w, viewport_h, click_x, click_y, metadata, created_at
      ) VALUES (
        ${uuid()}::uuid, ${eventType}, ${path}, ${pageTitle}, ${zone}, ${label}, ${elementTag}, ${href}, ${referrer},
        ${sessionId}, ${userUuid}::uuid, ${countryCode}, ${viewportW}, ${viewportH}, ${clickX}, ${clickY}, ${JSON.stringify(metadata)}::jsonb, now()
      )
    `.catch(() => {});

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
};

export const GET: APIRoute = () => json({ ok: true });
