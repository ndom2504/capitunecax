/**
 * GET  /api/inside — Charger les publications Inside
 * POST /api/inside — Publier (admin uniquement)
 *
 * Supporte:
 * - Cookie `capitune_session` (web)
 * - Header `Authorization: Bearer <token>` (mobile)
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
  uuid,
} from '../../lib/db';

type InsidePostApi = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarKey?: string;
  mediaType?: string;
  mediaUrl?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function getToken(request: Request, cookies: any): string | null {
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value ?? null;
  return bearerToken ?? cookieToken;
}

function asPost(row: any): InsidePostApi {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    authorName: String(row.author_name ?? row.authorName ?? ''),
    authorAvatarKey: String(row.author_avatar_key ?? row.authorAvatarKey ?? ''),
    mediaType: String(row.media_type ?? row.mediaType ?? ''),
    mediaUrl: String(row.media_url ?? row.mediaUrl ?? ''),
  };
}

export const GET: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  // Mode sans DB
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({ posts: [], persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  try {
    if (db) {
      const { results } = await db
        .prepare(
          `SELECT id, author_name, author_avatar_key, title, content, media_type, media_url, created_at
           FROM inside_posts
           ORDER BY created_at DESC
           LIMIT 50`
        )
        .all<any>();

      return json({ posts: (results ?? []).map(asPost) });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ posts: [], persisted: false });

    const rows = await sql<any>`
      SELECT id, author_name, author_avatar_key, title, content, media_type, media_url,
             (created_at::timestamptz) AS created_at
      FROM inside_posts
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return json({ posts: (rows ?? []).map(asPost) });
  } catch (err) {
    console.error('Inside GET error:', err);
    return json({ posts: [] }, 200);
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  // Mode sans DB: on accepte si admin, mais on ne persiste pas.
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    const isAdmin = String((user as any)?.role ?? '') === 'admin';
    if (!isAdmin) return json({ error: 'Accès refusé' }, 403);
    return json({ ok: true, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  if (!isAdmin) return json({ error: 'Accès refusé' }, 403);

  const body = (await request.json()) as {
    title?: string;
    content?: string;
    mediaType?: string;
    mediaUrl?: string;
  };

  const title = String(body.title ?? '').trim().slice(0, 120);
  const content = String(body.content ?? '').trim().slice(0, 5000);
  const mediaType = String(body.mediaType ?? '').trim().slice(0, 40);
  const mediaUrl = String(body.mediaUrl ?? '').trim().slice(0, 500);

  if (title.length < 3) return json({ error: 'Titre trop court' }, 400);
  if (content.length < 10) return json({ error: 'Contenu trop court' }, 400);

  const id = uuid();
  const nowIso = new Date().toISOString();
  const authorName = String((user as any)?.name ?? 'Admin');
  const authorAvatarKey = String((user as any)?.avatar_key ?? (user as any)?.avatar ?? '');

  try {
    if (db) {
      await db
        .prepare(
          `INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, user.id, authorName, authorAvatarKey, title, content, mediaType, mediaUrl, nowIso)
        .run();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      await sql`
        INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, created_at)
        VALUES (${id}, ${user.id}, ${authorName}, ${authorAvatarKey}, ${title}, ${content}, ${mediaType}, ${mediaUrl}, ${nowIso})
      `;
    }

    const post: InsidePostApi = {
      id,
      title,
      content,
      createdAt: nowIso,
      authorName,
      authorAvatarKey,
      mediaType,
      mediaUrl,
    };
    return json({ ok: true, post });
  } catch (err) {
    console.error('Inside POST error:', err);
    return json({ error: 'Erreur serveur' }, 500);
  }
};
