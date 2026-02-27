/**
 * GET /api/team
 * Retourne les profils des conseillers/pros (role='admin' OU account_type='pro') visibles aux clients connectés.
 * Champs exposés : nom, localisation, bio, avatar, services/tarifs — PAS l'email.
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  // Authentification requise (client ou admin)
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  // Vérification session
  const sessionUser = await getUserFromSessionAny(db, token);
  if (!sessionUser) return json({ error: 'Session expirée' }, 401);

  try {
    if (db) {
      let rows: { results?: unknown[] };
      try {
        rows = await db
          .prepare(`
            SELECT
              id,
              name,
              COALESCE(location, '') AS location,
              COALESCE(bio, '') AS bio,
              COALESCE(avatar_key, '') AS avatar_key,
              COALESCE(pro_services, '[]') AS pro_services,
              COALESCE(pro_pack_prices, '{}') AS pro_pack_prices,
              created_at
            FROM users
            WHERE role = 'admin' OR account_type = 'pro'
            ORDER BY created_at ASC
          `)
          .all();
      } catch {
        // Migration pas encore appliquée → fallback sans référencer les colonnes
        rows = await db
          .prepare(`
            SELECT
              id,
              name,
              COALESCE(location, '') AS location,
              COALESCE(bio, '') AS bio,
              COALESCE(avatar_key, '') AS avatar_key,
              '[]' AS pro_services,
              '{}' AS pro_pack_prices,
              created_at
            FROM users
            WHERE role = 'admin'
            ORDER BY created_at ASC
          `)
          .all();
      }
      const team = (rows.results ?? []).map((m: any) => ({
        ...m,
        pro_services: safeJsonParseArray(m?.pro_services),
        pro_pack_prices: safeJsonParseObject(m?.pro_pack_prices),
      }));
      return json({ team });
    }

    if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'DB non disponible' }, 503);

      let rows: Array<Record<string, unknown>>;
      try {
        rows = await sql<Record<string, unknown>>`
          SELECT
            id::text AS id,
            name,
            COALESCE(location, '') AS location,
            COALESCE(bio, '') AS bio,
            COALESCE(avatar_key, '') AS avatar_key,
            COALESCE(pro_services, '[]') AS pro_services,
            COALESCE(pro_pack_prices, '{}') AS pro_pack_prices,
            created_at::text AS created_at
          FROM users
          WHERE role = 'admin' OR account_type = 'pro'
          ORDER BY created_at ASC
        `;
      } catch {
        // Migration pas encore appliquée → fallback sans référencer les colonnes
        rows = await sql<Record<string, unknown>>`
          SELECT
            id::text AS id,
            name,
            COALESCE(location, '') AS location,
            COALESCE(bio, '') AS bio,
            COALESCE(avatar_key, '') AS avatar_key,
            '[]'::text AS pro_services,
            '{}'::text AS pro_pack_prices,
            created_at::text AS created_at
          FROM users
          WHERE role = 'admin'
          ORDER BY created_at ASC
        `;
      }
      const team = (rows ?? []).map((m: any) => ({
        ...m,
        pro_services: safeJsonParseArray(m?.pro_services),
        pro_pack_prices: safeJsonParseObject(m?.pro_pack_prices),
      }));
      return json({ team });
    }

    // Fallback sans DB : retourner des infos statiques minimales
    return json({
      team: [
        {
          id: 'static-1',
          name: 'Équipe CAPITUNE',
          location: 'Canada',
          bio: 'Conseillers en immigration certifiés, nous accompagnons vos projets de A à Z.',
          avatar_key: '',
          pro_services: [],
          pro_pack_prices: {},
          created_at: null,
        },
      ],
    });
  } catch (err) {
    console.error('[/api/team] Error:', err);
    return json({ error: 'Erreur serveur', team: [] }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function safeJsonParseArray(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((x) => String(x)).filter(Boolean);
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
  if (input && typeof input === 'object' && Object.getPrototypeOf(input) === Object.prototype) {
    return sanitizePackPrices(input as Record<string, unknown>);
  }
  if (typeof input !== 'string' || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== 'object' || Object.getPrototypeOf(parsed) !== Object.prototype) return {};
    return sanitizePackPrices(parsed as Record<string, unknown>);
  } catch {
    return {};
  }
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
