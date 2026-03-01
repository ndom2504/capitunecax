/**
 * GET  /api/reviews?pro_id=xxx  — Récupère les avis + note moyenne d'un pro
 *                                  + l'avis de l'utilisateur courant (si existant)
 * POST /api/reviews              — Soumet ou met à jour son avis sur un pro
 *    body: { pro_id, rating (1-5), comment? }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny, uuid } from '../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies, locals, url }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const proId = url.searchParams.get('pro_id');
  if (!proId) return json({ error: 'pro_id requis' }, 400);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const sessionUser = await getUserFromSessionAny(db, token);
  if (!sessionUser) return json({ error: 'Session expirée' }, 401);

  try {
    if (db) {
      // Récupère tous les avis du pro
      const rows = await db
        .prepare(`
          SELECT r.id, r.client_id, r.rating, r.comment, r.created_at,
                 u.name AS client_name, u.avatar_key AS client_avatar
          FROM pro_reviews r
          JOIN users u ON u.id = r.client_id
          WHERE r.pro_id = ?
          ORDER BY r.created_at DESC
        `)
        .bind(proId)
        .all();

      const reviews = rows.results ?? [];
      const avg = reviews.length
        ? (reviews as any[]).reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
        : 0;
      // Avis de l'utilisateur courant
      const mine = (reviews as any[]).find((r: any) => r.client_id === sessionUser.id) ?? null;

      return json({ reviews, avg: Math.round(avg * 10) / 10, count: reviews.length, mine });
    }

    if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ reviews: [], avg: 0, count: 0, mine: null });

      const rows = await sql`
        SELECT r.id, r.client_id, r.rating, r.comment, r.created_at,
               u.name AS client_name, u.avatar_key AS client_avatar
        FROM pro_reviews r
        JOIN users u ON u.id = r.client_id
        WHERE r.pro_id = ${proId}
        ORDER BY r.created_at DESC
      `;

      const reviews = rows ?? [];
      const avg = reviews.length
        ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
        : 0;
      const mine = reviews.find((r: any) => r.client_id === sessionUser.id) ?? null;

      return json({ reviews, avg: Math.round(avg * 10) / 10, count: reviews.length, mine });
    }

    return json({ reviews: [], avg: 0, count: 0, mine: null });
  } catch (e) {
    return json({ reviews: [], avg: 0, count: 0, mine: null });
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const sessionUser = await getUserFromSessionAny(db, token);
  if (!sessionUser) return json({ error: 'Session expirée' }, 401);

  // Pro ne peut pas se noter soi-même
  const isPro = String((sessionUser as any)?.account_type ?? '') === 'pro';
  if (isPro) return json({ error: 'Les professionnels ne peuvent pas noter d\'autres pros' }, 403);

  const body = await request.json() as { pro_id?: string; rating?: number; comment?: string };
  const proId = String(body.pro_id ?? '').trim();
  const rating = parseInt(String(body.rating ?? ''), 10);
  const comment = String(body.comment ?? '').slice(0, 1000).trim();

  if (!proId) return json({ error: 'pro_id requis' }, 400);
  if (!rating || rating < 1 || rating > 5) return json({ error: 'Note invalide (1-5)' }, 400);
  if (proId === sessionUser.id) return json({ error: 'Vous ne pouvez pas vous noter vous-même' }, 403);

  try {
    if (db) {
      // Upsert : si l'avis existe déjà, on le met à jour
      const existing = await db
        .prepare(`SELECT id FROM pro_reviews WHERE client_id = ? AND pro_id = ?`)
        .bind(sessionUser.id, proId)
        .first();

      if (existing) {
        await db
          .prepare(`UPDATE pro_reviews SET rating = ?, comment = ?, updated_at = datetime('now') WHERE client_id = ? AND pro_id = ?`)
          .bind(rating, comment, sessionUser.id, proId)
          .run();
        return json({ ok: true, updated: true });
      } else {
        const id = uuid();
        await db
          .prepare(`INSERT INTO pro_reviews (id, client_id, pro_id, rating, comment) VALUES (?, ?, ?, ?, ?)`)
          .bind(id, sessionUser.id, proId, rating, comment)
          .run();
        return json({ ok: true, created: true, id });
      }
    }

    if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Base de données non disponible' }, 500);

      // Upsert Postgres
      const id = uuid();
      await sql`
        INSERT INTO pro_reviews (id, client_id, pro_id, rating, comment)
        VALUES (${id}, ${sessionUser.id}, ${proId}, ${rating}, ${comment})
        ON CONFLICT (client_id, pro_id)
        DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()
      `;
      return json({ ok: true });
    }

    return json({ ok: true, persisted: false });
  } catch (e: any) {
    return json({ error: 'Erreur serveur: ' + (e?.message ?? '') }, 500);
  }
};
