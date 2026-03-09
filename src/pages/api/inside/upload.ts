import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
  uuid,
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

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo

function normalizeMime(mime: string): string {
  const m = String(mime || '').toLowerCase().trim();
  if (!m) return 'application/octet-stream';
  return m;
}

function mediaTypeFromMime(mime: string): 'image' | 'video' | '' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return '';
}

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = getToken(request, cookies);
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    return json({ error: 'Upload indisponible (base manquante)' }, 503);
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  if (!isAdmin) return json({ error: 'Accès refusé' }, 403);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Formulaire invalide' }, 400);
  }

  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return json({ error: 'Fichier manquant' }, 400);
  }

  const mimeType = normalizeMime(file.type);
  const mt = mediaTypeFromMime(mimeType);
  if (!mt) return json({ error: 'Type de fichier non supporté (image/vidéo uniquement)' }, 400);

  const size = Number(file.size || 0);
  if (!Number.isFinite(size) || size <= 0) return json({ error: 'Fichier vide' }, 400);
  if (size > MAX_BYTES) return json({ error: `Fichier trop volumineux (max ${Math.floor(MAX_BYTES / 1024 / 1024)} Mo)` }, 400);

  const id = uuid();
  const createdAt = new Date().toISOString();
  const filename = String(file.name || '').slice(0, 180);

  const data = await file.arrayBuffer();

  try {
    if (db) {
      await db
        .prepare(
          `INSERT INTO inside_media (id, mime_type, filename, size, data, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(id, mimeType, filename, size, data, createdAt)
        .run();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);

      // Neon accepte Uint8Array (nodejs_compat)
      const bytes = new Uint8Array(data);
      await sql`
        INSERT INTO inside_media (id, mime_type, filename, size, data, created_at)
        VALUES (${id}, ${mimeType}, ${filename || null}, ${size}, ${bytes as any}, ${createdAt})
      `;
    }

    const origin = new URL(request.url).origin;
    const url = new URL(`/api/inside/media/${id}`, origin).toString();

    return json({
      ok: true,
      media: {
        id,
        mimeType,
        mediaType: mt,
        size,
        url,
      },
    });
  } catch (err) {
    console.error('Inside upload error:', err);
    return json({ error: 'Erreur serveur' }, 500);
  }
};
