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
    (msg.includes('user_presence') && (msg.includes('no such table') || msg.includes('does not exist') || msg.includes('relation')))
  );
}

function getToken(request: Request, cookies: any): string | null {
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value ?? null;
  return bearerToken ?? cookieToken;
}

function isOnlineEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
    if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  }
  // par défaut: en ligne
  return true;
}

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    return json({ error: 'Présence indisponible (base manquante)' }, 503);
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const enabled = isOnlineEnabled((user as any).online_status_enabled);
  if (!enabled) {
    return json({ ok: true, online: false });
  }

  try {
    if (db) {
      await db
        .prepare(
          `INSERT INTO user_presence (user_id, last_seen_at)
           VALUES (?, datetime('now'))
           ON CONFLICT(user_id) DO UPDATE SET last_seen_at=datetime('now')`
        )
        .bind(String((user as any).id))
        .run();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);

      await sql`
        INSERT INTO user_presence (user_id, last_seen_at)
        VALUES (${String((user as any).id)}::uuid, now())
        ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now()
      `;
    }
  } catch (e) {
    if (isMissingPresenceSchema(e)) {
      return json({ error: 'Présence indisponible (migration manquante)' }, 503);
    }
    return json({ error: `Heartbeat impossible (${asErrorMessage(e)})` }, 500);
  }

  return json({ ok: true, online: true });
};
