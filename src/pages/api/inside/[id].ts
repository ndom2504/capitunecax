import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

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

function asId(params: Record<string, string | undefined>): string {
  return String(params.id || '').trim();
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

export const PATCH: APIRoute = async ({ cookies, locals, params, request }) => {
  const id = asId(params);
  if (!id) return json({ error: 'ID manquant' }, 400);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  if (!isAdmin) return json({ error: 'Accès refusé' }, 403);

  const body = (await request.json().catch(() => null)) as null | {
    title?: string;
    content?: string;
    mediaType?: string;
    mediaUrl?: string;
    linkUrl?: string;
    linkLabel?: string;
    hidden?: boolean;
  };
  if (!body) return json({ error: 'Payload invalide' }, 400);

  try {
    const nowIso = new Date().toISOString();

    if (db) {
      const current = await db
        .prepare(
          `SELECT id, title, content, media_type, media_url, link_url, link_label, is_hidden
           FROM inside_posts
           WHERE id = ?
           LIMIT 1`
        )
        .bind(id)
        .first<any>()
        .catch(() => null);
        
      if (!current) return json({ error: 'Post introuvable' }, 404);

      const title = body.title !== undefined ? String(body.title ?? '').trim().slice(0, 120) : String(current.title ?? '');
      const content = body.content !== undefined ? String(body.content ?? '').trim().slice(0, 5000) : String(current.content ?? '');
      const mediaType = body.mediaType !== undefined ? String(body.mediaType ?? '').trim().slice(0, 40) : String(current.media_type ?? '');
      const mediaUrl = body.mediaUrl !== undefined ? String(body.mediaUrl ?? '').trim().slice(0, 500) : String(current.media_url ?? '');
      const linkUrl = body.linkUrl !== undefined ? String(body.linkUrl ?? '').trim().slice(0, 500) : String(current.link_url ?? '');
      const linkLabel = body.linkLabel !== undefined ? String(body.linkLabel ?? '').trim().slice(0, 80) : String(current.link_label ?? '');
      const hidden = body.hidden !== undefined ? (body.hidden ? 1 : 0) : (toBool(current.is_hidden) ? 1 : 0);

      if (title.length < 3) return json({ error: 'Titre trop court' }, 400);
      if (content.length < 10) return json({ error: 'Contenu trop court' }, 400);

      // Essayer avec link_label d'abord (après migration)
      try {
        await db
          .prepare(
            `UPDATE inside_posts
             SET title = ?, content = ?, media_type = ?, media_url = ?, link_url = ?, link_label = ?, is_hidden = ?, updated_at = ?
             WHERE id = ?`
          )
          .bind(title, content, mediaType, mediaUrl, linkUrl, linkLabel, hidden, nowIso, id)
          .run();
      } catch (altErr: any) {
        // Si la colonne link_label n'existe pas encore, fallback sans elle
        if (String(altErr).includes('link_label') || String(altErr).includes('no such column')) {
          await db
            .prepare(
              `UPDATE inside_posts
               SET title = ?, content = ?, media_type = ?, media_url = ?, link_url = ?, is_hidden = ?, updated_at = ?
               WHERE id = ?`
            )
            .bind(title, content, mediaType, mediaUrl, linkUrl, hidden, nowIso, id)
            .run();
        } else {
          throw altErr;
        }
      }

      return json({ ok: true });
    }

    if (!useNeon) return json({ error: 'Base manquante' }, 503);

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);

    const rows = await sql<any>`
      SELECT id, title, content, media_type, media_url, link_url, link_label, is_hidden
      FROM inside_posts
      WHERE id = ${id}
      LIMIT 1
    `.catch(() => []);
    
    const current = rows?.[0];
    if (!current) return json({ error: 'Post introuvable' }, 404);

    const title = body.title !== undefined ? String(body.title ?? '').trim().slice(0, 120) : String(current.title ?? '');
    const content = body.content !== undefined ? String(body.content ?? '').trim().slice(0, 5000) : String(current.content ?? '');
    const mediaType = body.mediaType !== undefined ? String(body.mediaType ?? '').trim().slice(0, 40) : String(current.media_type ?? '');
    const mediaUrl = body.mediaUrl !== undefined ? String(body.mediaUrl ?? '').trim().slice(0, 500) : String(current.media_url ?? '');
    const linkUrl = body.linkUrl !== undefined ? String(body.linkUrl ?? '').trim().slice(0, 500) : String(current.link_url ?? '');
    const linkLabel = body.linkLabel !== undefined ? String(body.linkLabel ?? '').trim().slice(0, 80) : String(current.link_label ?? '');
    const hidden = body.hidden !== undefined ? !!body.hidden : !!current.is_hidden;

    if (title.length < 3) return json({ error: 'Titre trop court' }, 400);
    if (content.length < 10) return json({ error: 'Contenu trop court' }, 400);

    // Essayer avec link_label d'abord (après migration)
    try {
      await sql`
        UPDATE inside_posts
        SET title = ${title}, content = ${content}, media_type = ${mediaType}, media_url = ${mediaUrl},
            link_url = ${linkUrl}, link_label = ${linkLabel}, is_hidden = ${hidden}, updated_at = ${nowIso}::timestamptz
        WHERE id = ${id}
      `;
    } catch (altErr: any) {
      // Si la colonne link_label n'existe pas encore, fallback sans elle
      if (String(altErr).includes('link_label') || String(altErr).includes('column')) {
        await sql`
          UPDATE inside_posts
          SET title = ${title}, content = ${content}, media_type = ${mediaType}, media_url = ${mediaUrl},
              link_url = ${linkUrl}, is_hidden = ${hidden}, updated_at = ${nowIso}::timestamptz
          WHERE id = ${id}
        `;
      } else {
        throw altErr;
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Inside PATCH error:', err);
    return json({ error: 'Erreur serveur' }, 500);
  }
};

export const DELETE: APIRoute = async ({ cookies, locals, params, request }) => {
  const id = asId(params);
  if (!id) return json({ error: 'ID manquant' }, 400);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  if (!isAdmin) return json({ error: 'Accès refusé' }, 403);

  try {
    if (db) {
      await db.prepare('DELETE FROM inside_posts WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    if (!useNeon) return json({ error: 'Base manquante' }, 503);

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    await sql`DELETE FROM inside_posts WHERE id = ${id}`;

    return json({ ok: true });
  } catch (err) {
    console.error('Inside DELETE error:', err);
    return json({ error: 'Erreur serveur' }, 500);
  }
};
