import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';
import { effectiveRoleForUser, isAdminEmail } from '../../../lib/admin-emails';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const role = effectiveRoleForUser(me);
  const isAdmin = role === 'admin' || isAdminEmail(me.email);
  const isPro = String((me as any)?.account_type ?? '') === 'pro';
  if (!isAdmin && !isPro) return json({ error: 'Accès refusé' }, 403);

  const meWithPro = me as unknown as {
    pro_services?: string;
    pro_pack_prices?: string;
  };
  const proServices = safeJsonParseArray(meWithPro.pro_services);
  const proPackPrices = safeJsonParseObject(meWithPro.pro_pack_prices);

  return json({
    me: {
      id: String(me.id ?? ''),
      name: String(me.name ?? ''),
      email: String(me.email ?? ''),
      location: String(me.location ?? ''),
      bio: String(me.bio ?? ''),
      avatar_key: String(me.avatar_key ?? ''),
      pro_services: proServices,
      pro_pack_prices: proPackPrices,
    },
  });
};

export const PATCH: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const role = effectiveRoleForUser(me);
  const isAdmin = role === 'admin' || isAdminEmail(me.email);
  const isPro = String((me as any)?.account_type ?? '') === 'pro';
  if (!isAdmin && !isPro) return json({ error: 'Accès refusé' }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  const proServices = Array.isArray(payload.pro_services)
    ? payload.pro_services.map((x) => String(x)).filter(Boolean).slice(0, 200)
    : undefined;

  const proPackPrices = isPlainObject(payload.pro_pack_prices)
    ? sanitizePackPrices(payload.pro_pack_prices as Record<string, unknown>)
    : undefined;

  const bio = typeof payload.bio === 'string' ? payload.bio.slice(0, 2000) : undefined;
  const location = typeof payload.location === 'string' ? payload.location.slice(0, 200) : undefined;

  // Rien à faire
  if (proServices === undefined && proPackPrices === undefined && bio === undefined && location === undefined) {
    return json({ ok: true });
  }

  const nextProServices = proServices !== undefined ? JSON.stringify(proServices) : undefined;
  const nextProPackPrices = proPackPrices !== undefined ? JSON.stringify(proPackPrices) : undefined;

  try {
    if (db) {
      // Construire un UPDATE minimal
      const sets: string[] = [];
      const binds: unknown[] = [];

      if (bio !== undefined) {
        sets.push('bio=?');
        binds.push(bio);
      }
      if (location !== undefined) {
        sets.push('location=?');
        binds.push(location);
      }
      if (nextProServices !== undefined) {
        sets.push('pro_services=?');
        binds.push(nextProServices);
      }
      if (nextProPackPrices !== undefined) {
        sets.push('pro_pack_prices=?');
        binds.push(nextProPackPrices);
      }

      sets.push("updated_at=datetime('now')");

      const sql = `UPDATE users SET ${sets.join(', ')} WHERE id=?`;
      binds.push(me.id);
      await db.prepare(sql).bind(...binds).run();

      return json({ ok: true });
    }

    if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'DB non disponible' }, 503);

      // Mise à jour colonne par colonne pour garder simple
      if (bio !== undefined) {
        await sql`UPDATE users SET bio=${bio}, updated_at=now() WHERE id=${me.id}`;
      }
      if (location !== undefined) {
        await sql`UPDATE users SET location=${location}, updated_at=now() WHERE id=${me.id}`;
      }
      if (nextProServices !== undefined) {
        await sql`UPDATE users SET pro_services=${nextProServices}, updated_at=now() WHERE id=${me.id}`;
      }
      if (nextProPackPrices !== undefined) {
        await sql`UPDATE users SET pro_pack_prices=${nextProPackPrices}, updated_at=now() WHERE id=${me.id}`;
      }

      return json({ ok: true });
    }

    return json({ error: 'DB non disponible' }, 503);
  } catch (err) {
    console.error('[/api/pro/profile] update error:', err);
    const msg = String((err as any)?.message ?? err ?? '');
    if (/no such column|column .* does not exist/i.test(msg)) {
      return json(
        {
          error:
            "Migration DB requise: appliquez la migration 0003 (colonnes users.pro_services / users.pro_pack_prices) puis réessayez.",
        },
        500
      );
    }
    return json({ error: 'Erreur serveur' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function safeJsonParseArray(input: unknown): string[] {
  if (typeof input !== 'string' || !input.trim()) return [];
  try {
    const parsed = JSON.parse(input);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    return [];
  }
}

function safeJsonParseObject(input: unknown): Record<string, number> {
  if (typeof input !== 'string' || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    if (!isPlainObject(parsed)) return {};
    return sanitizePackPrices(parsed as Record<string, unknown>);
  } catch {
    return {};
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}

function sanitizePackPrices(obj: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(obj)) {
    const id = String(key).slice(0, 64);
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n)) continue;
    if (n < 0) continue;
    out[id] = Math.round(n * 100) / 100;
  }
  return out;
}
