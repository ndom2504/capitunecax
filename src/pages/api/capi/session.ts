/**
 * GET  /api/capi/session  — Récupère la session CAPI en cours
 * POST /api/capi/session  — Sauvegarde / met à jour la session CAPI
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  // Support header Bearer token (mobile) + cookie (web)
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    await getUserFromSessionAny(null, token);
    return json({ session: null, persisted: false });
  }

  try {
    const user = await getUserFromSessionFullAny(db, token);
    if (!user) return json({ error: 'Session expirée' }, 401);

    let sessionData: string | null = null;
    if (db) {
      const row = await db
        .prepare('SELECT session_data FROM capi_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
        .bind(user.id)
        .first<{ session_data: string }>();
      sessionData = row?.session_data ?? null;
    } else {
      const sql = await getNeonSqlClient();
      const rows = await sql`
        SELECT session_data FROM capi_sessions
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC LIMIT 1
      `;
      sessionData = rows[0]?.session_data ?? null;
    }

    return json({ session: sessionData ? JSON.parse(sessionData) : null });
  } catch (err) {
    console.error('CAPI session GET error:', err);
    return json({ session: null });
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    await getUserFromSessionAny(null, token);
    return json({ ok: true, persisted: false });
  }

  try {
    const user = await getUserFromSessionFullAny(db, token);
    if (!user) return json({ error: 'Session expirée' }, 401);

    const body = await request.json() as { session: unknown };
    const sessionJson = JSON.stringify(body.session ?? body);
    const now = new Date().toISOString();

    if (db) {
      const existing = await db
        .prepare('SELECT id FROM capi_sessions WHERE user_id = ?')
        .bind(user.id)
        .first<{ id: string }>();
      if (existing) {
        await db
          .prepare('UPDATE capi_sessions SET session_data = ?, updated_at = ? WHERE user_id = ?')
          .bind(sessionJson, now, user.id)
          .run();
      } else {
        await db
          .prepare('INSERT INTO capi_sessions (user_id, session_data, created_at, updated_at) VALUES (?, ?, ?, ?)')
          .bind(user.id, sessionJson, now, now)
          .run();
      }
    } else {
      const sql = await getNeonSqlClient();
      await sql`
        INSERT INTO capi_sessions (user_id, session_data, created_at, updated_at)
        VALUES (${user.id}, ${sessionJson}, ${now}, ${now})
        ON CONFLICT (user_id) DO UPDATE
        SET session_data = ${sessionJson}, updated_at = ${now}
      `;
    }

    return json({ ok: true });
  } catch (err) {
    console.error('CAPI session POST error:', err);
    // Retourner OK même en cas d'erreur DB (graceful degradation)
    return json({ ok: true, persisted: false });
  }
};
