import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function asErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err) return String((err as any).message || '');
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function isMissingPresenceSchema(err: unknown): boolean {
  const msg = asErrorMessage(err).toLowerCase();
  return (
    (msg.includes('user_presence') && (msg.includes('no such table') || msg.includes('does not exist') || msg.includes('relation'))) ||
    (msg.includes('online_status_enabled') && msg.includes('does not exist'))
  );
}

function getToken(request: Request, cookies: any): string | null {
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value ?? null;
  return bearerToken ?? cookieToken;
}

function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export const GET: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    return json({ error: 'Présence indisponible (base manquante)' }, 503);
  }

  // Auth obligatoire (évite d'exposer un signal public inutile)
  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const url = new URL(request.url);
  const windowSeconds = clampInt(url.searchParams.get('windowSeconds'), 60, 10, 600);

  try {
    if (db) {
      const row = await db
        .prepare(
          `SELECT COUNT(*) as count
           FROM user_presence p
           JOIN users u ON u.id = p.user_id
           WHERE u.online_status_enabled = 1
             AND p.last_seen_at >= datetime('now', '-' || ? || ' seconds')`
        )
        .bind(windowSeconds)
        .first<{ count: number }>();

      const count = Number((row as any)?.count ?? 0);
      return json({ count: Number.isFinite(count) ? count : 0, windowSeconds });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);

    const rows = await sql<{ count: number }>`
      SELECT COUNT(*)::int as count
      FROM user_presence p
      JOIN users u ON u.id = p.user_id
      WHERE u.online_status_enabled = true
        AND p.last_seen_at >= now() - (${windowSeconds} * interval '1 second')
    `;

    return json({ count: rows?.[0]?.count ?? 0, windowSeconds });
  } catch (e) {
    if (isMissingPresenceSchema(e)) {
      return json({ error: 'Présence indisponible (migration manquante)' }, 503);
    }
    return json({ error: `Comptage impossible (${asErrorMessage(e)})` }, 500);
  }
};
