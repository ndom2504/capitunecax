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
    pro_pack_services?: string;
    pro_diploma?: string;
    pro_competences?: string;
    pro_experience_years?: number | string | null;
    location_lat?: number | string | null;
    location_lng?: number | string | null;
  };
  const proServices = safeJsonParseArray(meWithPro.pro_services);
  const proPackPrices = safeJsonParseObject(meWithPro.pro_pack_prices);
  const proPackServices = safeJsonParsePackServices(meWithPro.pro_pack_services);
  const proExperienceYears = safeNumberInt(meWithPro.pro_experience_years);
  const locationLat = safeNumberFloat(meWithPro.location_lat);
  const locationLng = safeNumberFloat(meWithPro.location_lng);

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
      pro_pack_services: proPackServices,
      pro_diploma: String(meWithPro.pro_diploma ?? ''),
      pro_competences: String(meWithPro.pro_competences ?? ''),
      pro_experience_years: proExperienceYears,
      location_lat: locationLat,
      location_lng: locationLng,
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

  const proPackServices = isPlainObject(payload.pro_pack_services)
    ? sanitizePackServices(payload.pro_pack_services as Record<string, unknown>)
    : undefined;

  const bio = typeof payload.bio === 'string' ? payload.bio.slice(0, 2000) : undefined;
  const location = typeof payload.location === 'string' ? payload.location.slice(0, 200) : undefined;

  const proDiploma = typeof payload.pro_diploma === 'string' ? payload.pro_diploma.slice(0, 200) : undefined;
  const proCompetences =
    typeof payload.pro_competences === 'string' ? payload.pro_competences.slice(0, 2000) : undefined;
  const proExperienceYearsRaw = payload.pro_experience_years;
  const proExperienceYears =
    proExperienceYearsRaw === null || proExperienceYearsRaw === undefined
      ? undefined
      : safeNumberInt(proExperienceYearsRaw);

  const latRaw = payload.location_lat;
  const lngRaw = payload.location_lng;
  const locationLat = latRaw === null || latRaw === undefined ? undefined : safeLatitude(latRaw);
  const locationLng = lngRaw === null || lngRaw === undefined ? undefined : safeLongitude(lngRaw);

  // Rien à faire
  if (
    proServices === undefined &&
    proPackPrices === undefined &&
    proPackServices === undefined &&
    bio === undefined &&
    location === undefined &&
    proDiploma === undefined &&
    proCompetences === undefined &&
    proExperienceYears === undefined &&
    locationLat === undefined &&
    locationLng === undefined
  ) {
    return json({ ok: true });
  }

  const nextProServices = proServices !== undefined ? JSON.stringify(proServices) : undefined;
  const nextProPackPrices = proPackPrices !== undefined ? JSON.stringify(proPackPrices) : undefined;
  const nextProPackServices = proPackServices !== undefined ? JSON.stringify(proPackServices) : undefined;

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
      if (nextProPackServices !== undefined) {
        sets.push('pro_pack_services=?');
        binds.push(nextProPackServices);
      }
      if (proDiploma !== undefined) {
        sets.push('pro_diploma=?');
        binds.push(proDiploma);
      }
      if (proCompetences !== undefined) {
        sets.push('pro_competences=?');
        binds.push(proCompetences);
      }
      if (proExperienceYears !== undefined) {
        sets.push('pro_experience_years=?');
        binds.push(proExperienceYears);
      }
      if (locationLat !== undefined) {
        sets.push('location_lat=?');
        binds.push(locationLat);
      }
      if (locationLng !== undefined) {
        sets.push('location_lng=?');
        binds.push(locationLng);
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
      if (nextProPackServices !== undefined) {
        await sql`UPDATE users SET pro_pack_services=${nextProPackServices}, updated_at=now() WHERE id=${me.id}`;
      }
      if (proDiploma !== undefined) {
        await sql`UPDATE users SET pro_diploma=${proDiploma}, updated_at=now() WHERE id=${me.id}`;
      }
      if (proCompetences !== undefined) {
        await sql`UPDATE users SET pro_competences=${proCompetences}, updated_at=now() WHERE id=${me.id}`;
      }
      if (proExperienceYears !== undefined) {
        await sql`UPDATE users SET pro_experience_years=${proExperienceYears}, updated_at=now() WHERE id=${me.id}`;
      }
      if (locationLat !== undefined) {
        await sql`UPDATE users SET location_lat=${locationLat}, updated_at=now() WHERE id=${me.id}`;
      }
      if (locationLng !== undefined) {
        await sql`UPDATE users SET location_lng=${locationLng}, updated_at=now() WHERE id=${me.id}`;
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
            'Migration DB requise: appliquez les migrations 0003 (profil pro) et 0005 (offre pro avancée) puis réessayez.',
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

function safeJsonParsePackServices(input: unknown): Record<string, string[]> {
  if (typeof input !== 'string' || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    if (!isPlainObject(parsed)) return {};
    return sanitizePackServices(parsed as Record<string, unknown>);
  } catch {
    return {};
  }
}

function sanitizePackServices(obj: Record<string, unknown>): Record<string, string[]> {
  const allowedPacks = new Set(['essentiel', 'standard', 'premium', 'tourisme']);
  const allowedServices = new Set(['consultation', 'orientation', 'dossier', 'suivi', 'recherche', 'integration']);
  const out: Record<string, string[]> = {};

  for (const [rawPackId, rawList] of Object.entries(obj)) {
    const packId = String(rawPackId).slice(0, 64);
    if (!allowedPacks.has(packId)) continue;
    const list = Array.isArray(rawList) ? rawList : [];
    const cleaned = list
      .map((x) => String(x))
      .filter((x) => allowedServices.has(x))
      .slice(0, 50);
    // Dédoublonnage
    out[packId] = Array.from(new Set(cleaned));
  }
  return out;
}

function safeNumberInt(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0 || i > 80) return null;
  return i;
}

function safeNumberFloat(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1e6) / 1e6;
}

function safeLatitude(value: unknown): number | null {
  const n = safeNumberFloat(value);
  if (n === null) return null;
  if (n < -90 || n > 90) return null;
  return n;
}

function safeLongitude(value: unknown): number | null {
  const n = safeNumberFloat(value);
  if (n === null) return null;
  if (n < -180 || n > 180) return null;
  return n;
}
