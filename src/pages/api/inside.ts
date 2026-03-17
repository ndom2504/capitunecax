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
  updatedAt?: string;
  authorName: string;
  authorAvatarKey?: string;
  authorId?: string;
  authorAccountType?: string;
  mediaType?: string;
  mediaUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  isHidden?: boolean;
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
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
    authorName: String(row.author_name ?? row.authorName ?? ''),
    authorAvatarKey: String(row.author_avatar_key ?? row.authorAvatarKey ?? ''),
    authorId: String(row.author_user_id ?? row.authorId ?? ''),
    authorAccountType: String(row.account_type ?? ''),
    mediaType: String(row.media_type ?? row.mediaType ?? ''),
    mediaUrl: String(row.media_url ?? row.mediaUrl ?? ''),
    linkUrl: String(row.link_url ?? row.linkUrl ?? ''),
    linkLabel: String(row.link_label ?? row.linkLabel ?? 'Ouvrir le lien'),
    isHidden: Boolean(
      (row.is_hidden ?? row.isHidden ?? 0) === true ||
        String(row.is_hidden ?? row.isHidden ?? '0') === '1' ||
        String(row.is_hidden ?? row.isHidden ?? '').toLowerCase() === 'true'
    ),
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
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  const isPro = String((user as any)?.account_type ?? '') === 'pro';
  const canManage = isAdmin || isPro;
  const url = new URL(request.url);
  const includeHidden = url.searchParams.get('includeHidden') === '1' && canManage;

  try {
    if (db) {
      const { results } = await db
        .prepare(
          `SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url, p.link_label, p.created_at, p.updated_at, p.is_hidden, u.account_type
           FROM inside_posts p
           LEFT JOIN users u ON p.author_user_id = u.id
           ${includeHidden ? '' : 'WHERE (p.is_hidden IS NULL OR p.is_hidden = 0)'}
           ORDER BY p.created_at DESC
           LIMIT 50`
        )
        .all<any>()
        .catch(async (err: any) => {
          // Fallback sans link_label si la colonne n'existe pas
          if (String(err).includes('link_label') || String(err).includes('no such column')) {
            const fallback = await db
              .prepare(
                `SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url, p.created_at, p.updated_at, p.is_hidden, u.account_type
                 FROM inside_posts p
                 LEFT JOIN users u ON p.author_user_id = u.id
                 ${includeHidden ? '' : 'WHERE (p.is_hidden IS NULL OR p.is_hidden = 0)'}
                 ORDER BY p.created_at DESC
                 LIMIT 50`
              )
              .all<any>();
            return fallback;
          }
          throw err;
        });

      return json({ posts: (results ?? []).map(asPost) });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ posts: [], persisted: false });

    let rows: any[];
    try {
      rows = includeHidden
        ? await sql<any>`
            SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url, p.link_label,
                   (p.created_at::timestamptz) AS created_at, (p.updated_at::timestamptz) AS updated_at,
                   p.is_hidden, u.account_type
            FROM inside_posts p
            LEFT JOIN users u ON p.author_user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 50
          `
        : await sql<any>`
            SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url, p.link_label,
                   (p.created_at::timestamptz) AS created_at, (p.updated_at::timestamptz) AS updated_at,
                   p.is_hidden, u.account_type
            FROM inside_posts p
            LEFT JOIN users u ON p.author_user_id = u.id
            WHERE p.is_hidden IS NOT TRUE
            ORDER BY p.created_at DESC
            LIMIT 50
          `;
    } catch (err: any) {
      // Fallback sans link_label si la colonne n'existe pas
      if (String(err).includes('link_label') || String(err).includes('column')) {
        rows = includeHidden
          ? await sql<any>`
              SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url,
                     (p.created_at::timestamptz) AS created_at, (p.updated_at::timestamptz) AS updated_at,
                     p.is_hidden, u.account_type
              FROM inside_posts p
              LEFT JOIN users u ON p.author_user_id = u.id
              ORDER BY p.created_at DESC
              LIMIT 50
            `
          : await sql<any>`
              SELECT p.id, p.author_name, p.author_avatar_key, p.author_user_id, p.title, p.content, p.media_type, p.media_url, p.link_url,
                     (p.created_at::timestamptz) AS created_at, (p.updated_at::timestamptz) AS updated_at,
                     p.is_hidden, u.account_type
              FROM inside_posts p
              LEFT JOIN users u ON p.author_user_id = u.id
              WHERE p.is_hidden IS NOT TRUE
              ORDER BY p.created_at DESC
              LIMIT 50
            `;
      } else {
        throw err;
      }
    }
    
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

  // Mode sans DB: on accepte si admin ou pro, mais on ne persiste pas.
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    const isAdmin = String((user as any)?.role ?? '') === 'admin';
    const isPro = String((user as any)?.account_type ?? '') === 'pro';
    const canPublish = isAdmin || isPro;
    if (!canPublish) return json({ error: 'Accès refusé' }, 403);
    return json({ ok: true, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  const isPro = String((user as any)?.account_type ?? '') === 'pro';
  const canPublish = isAdmin || isPro;
  if (!canPublish) return json({ error: 'Accès refusé' }, 403);

  const body = (await request.json()) as {
    title?: string;
    content?: string;
    mediaType?: string;
    mediaUrl?: string;
    linkUrl?: string;
    linkLabel?: string;
  };

  const title = String(body.title ?? '').trim().slice(0, 120);
  const content = String(body.content ?? '').trim().slice(0, 5000);
  const mediaType = String(body.mediaType ?? '').trim().slice(0, 40);
  const mediaUrl = String(body.mediaUrl ?? '').trim().slice(0, 500);
  const linkUrl = String(body.linkUrl ?? '').trim().slice(0, 500);
  const linkLabel = String(body.linkLabel ?? 'Ouvrir le lien').trim().slice(0, 80);

  if (title.length < 3) return json({ error: 'Titre trop court' }, 400);
  if (content.length < 10) return json({ error: 'Contenu trop court' }, 400);

  const id = uuid();
  const nowIso = new Date().toISOString();
  const authorName = String((user as any)?.name ?? 'Admin');
  const authorAvatarKey = String((user as any)?.avatar_key ?? (user as any)?.avatar ?? '');

  try {
    if (db) {
      // Essayer avec link_label d'abord (après migration)
      try {
        await db
          .prepare(
            `INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, link_url, link_label, created_at, updated_at, is_hidden)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(id, user.id, authorName, authorAvatarKey, title, content, mediaType, mediaUrl, linkUrl, linkLabel, nowIso, nowIso, 0)
          .run();
      } catch (altErr: any) {
        // Si la colonne link_label n'existe pas encore, fallback sans elle
        if (String(altErr).includes('link_label') || String(altErr).includes('no such column')) {
          await db
            .prepare(
              `INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, link_url, created_at, updated_at, is_hidden)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(id, user.id, authorName, authorAvatarKey, title, content, mediaType, mediaUrl, linkUrl, nowIso, nowIso, 0)
            .run();
        } else {
          throw altErr;
        }
      }
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
      
      // Essayer avec link_label d'abord (après migration)
      try {
        await sql`
          INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, link_url, link_label, created_at, updated_at, is_hidden)
          VALUES (${id}, ${user.id}, ${authorName}, ${authorAvatarKey}, ${title}, ${content}, ${mediaType}, ${mediaUrl}, ${linkUrl}, ${linkLabel}, ${nowIso}, ${nowIso}, false)
        `;
      } catch (altErr: any) {
        // Si la colonne link_label n'existe pas encore, fallback sans elle
        if (String(altErr).includes('link_label') || String(altErr).includes('column')) {
          await sql`
            INSERT INTO inside_posts (id, author_user_id, author_name, author_avatar_key, title, content, media_type, media_url, link_url, created_at, updated_at, is_hidden)
            VALUES (${id}, ${user.id}, ${authorName}, ${authorAvatarKey}, ${title}, ${content}, ${mediaType}, ${mediaUrl}, ${linkUrl}, ${nowIso}, ${nowIso}, false)
          `;
        } else {
          throw altErr;
        }
      }
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
      linkUrl,
      linkLabel,
    };
    return json({ ok: true, post });
  } catch (err) {
    console.error('Inside POST error:', err);
    return json({ error: 'Erreur serveur' }, 500);
  }
};
