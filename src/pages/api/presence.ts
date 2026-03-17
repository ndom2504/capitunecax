/**
 * Presence (simple) — "personnes connectées" + statut en ligne.
 *
 * Stratégie:
 * - En prod Cloudflare: on réutilise le KV binding `SESSION` (déjà requis par l'adapter)
 *   pour stocker des clés `presence:<userId>` avec un TTL court.
 * - En environnement sans KV: fallback best-effort.
 *
 * POST /api/presence  -> ping (auth requis)
 * GET  /api/presence  -> { connected, meOnline }
 */
import type { APIRoute } from 'astro';
import { getUserFromSessionAny } from '../../lib/db';

const PRESENCE_PREFIX = 'presence:';
const PRESENCE_TTL_SECONDS = 90;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSessionToken(cookies: Parameters<APIRoute>[0]['cookies'], request: Request): string {
  // Essayer les cookies d'abord (web)
  const cookieToken = String(cookies.get('capitune_session')?.value ?? '').trim();
  if (cookieToken) return cookieToken;
  
  // Fallback: header Authorization (mobile)
  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return '';
}

function getPresenceKv(locals: Parameters<APIRoute>[0]['locals']): any | null {
  const env = (locals.runtime?.env as any) ?? null;
  const kv = env?.SESSION ?? null;
  // KVNamespace a au moins get/put/list
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function' || typeof kv.list !== 'function') return null;
  return kv;
}

export const POST: APIRoute = async ({ cookies, locals }) => {
  const token = getSessionToken(cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSessionAny(((locals.runtime?.env as any)?.DB ?? null), token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const kv = getPresenceKv(locals);
  if (!kv) {
    // Pas de KV dispo: on ne peut pas réellement stocker une présence.
    return json({ ok: true, persisted: false });
  }

  const key = `${PRESENCE_PREFIX}${user.id}`;
  await kv.put(key, String(Date.now()), { expirationTtl: PRESENCE_TTL_SECONDS });
  return json({ ok: true, persisted: true, ttl: PRESENCE_TTL_SECONDS });
};

export const GET: APIRoute = async ({ cookies, locals }) => {
  const token = getSessionToken(cookies);
  if (!token) return json({ connected: 0, meOnline: false, persisted: false });

  const user = await getUserFromSessionAny(((locals.runtime?.env as any)?.DB ?? null), token);
  if (!user) return json({ connected: 0, meOnline: false, persisted: false });

  const kv = getPresenceKv(locals);
  if (!kv) {
    // Fallback: on sait juste que l'utilisateur est connecté (session valide).
    return json({ connected: 1, meOnline: true, persisted: false });
  }

  const meKey = `${PRESENCE_PREFIX}${user.id}`;
  const meVal = await kv.get(meKey);
  const meOnline = !!meVal;

  const listed = await kv.list({ prefix: PRESENCE_PREFIX });
  const connected = Array.isArray(listed?.keys) ? listed.keys.length : 0;

  return json({ connected, meOnline, persisted: true });
};
