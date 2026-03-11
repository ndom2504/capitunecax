import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase } from '../../../../lib/db';

function asId(params: Record<string, string | undefined>): string {
  return String(params.id || '').trim();
}

function toU8(data: unknown): Uint8Array | null {
  if (!data) return null;
  // En environnement Node/Neon, bytea arrive souvent en Buffer (hérite de Uint8Array)
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  // D1 peut renvoyer Uint8Array directement
  if (typeof data === 'object' && (data as any).constructor?.name === 'Uint8Array') return data as Uint8Array;
  // Postgres peut renvoyer bytea sous forme hex "\\x..." selon le driver
  if (typeof data === 'string' && data.startsWith('\\x')) {
    const hex = data.slice(2);
    if (hex.length % 2 !== 0) return null;
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      if (Number.isNaN(byte)) return null;
      out[i] = byte;
    }
    return out;
  }
  return null;
}

export const GET: APIRoute = async ({ locals, params, request }) => {
  const id = asId(params);
  if (!id) return new Response('Not found', { status: 404 });

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  try {
    let mimeType = 'application/octet-stream';
    let filename = '';
    let bytes: Uint8Array | null = null;

    if (db) {
      const row = await db
        .prepare('SELECT mime_type, filename, data FROM inside_media WHERE id = ?')
        .bind(id)
        .first<any>();
      if (!row) return new Response('Not found', { status: 404 });

      mimeType = String(row.mime_type || mimeType);
      filename = String(row.filename || '');
      bytes = toU8(row.data);
    } else if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return new Response('Not found', { status: 404 });

      const rows = await sql<any>`
        SELECT mime_type, filename, data
        FROM inside_media
        WHERE id = ${id}
        LIMIT 1
      `;
      const row = rows?.[0];
      if (!row) return new Response('Not found', { status: 404 });

      mimeType = String(row.mime_type || mimeType);
      filename = String(row.filename || '');

      bytes = toU8(row.data);
    } else {
      return new Response('Not found', { status: 404 });
    }

    if (!bytes || bytes.byteLength <= 0) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');
    if (filename) {
      headers.set('Content-Disposition', `inline; filename="${filename.replace(/\"/g, '')}"`);
    }

    // HEAD support (pratique pour certains clients)
    if (request.method === 'HEAD') return new Response(null, { status: 200, headers });

    // BodyInit TS n'accepte pas Uint8Array, ni SharedArrayBuffer : renvoyer un ArrayBuffer concret.
    let body: ArrayBuffer;
    if (bytes.buffer instanceof ArrayBuffer) {
      body =
        bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
          ? bytes.buffer
          : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    } else {
      // Copie dans un nouveau buffer (non-shared)
      body = bytes.slice().buffer;
    }

    return new Response(body, { status: 200, headers });
  } catch (err) {
    console.error('Inside media GET error:', err);
    return new Response('Not found', { status: 404 });
  }
};
