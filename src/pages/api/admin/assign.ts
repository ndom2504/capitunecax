/**
 * POST /api/admin/assign — Assigner (ou réassigner) un client à un pro/admin
 * Body: { client_id, pro_id? }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../lib/db';
import { isSuperAdminEmail } from '../../../lib/admin-emails';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return json({ error: 'Accès refusé' }, 403);

  const body = (await request.json().catch(() => ({}))) as { client_id?: string; pro_id?: string };
  const clientId = String(body.client_id ?? '').trim();
  if (!clientId) return json({ error: 'client_id manquant' }, 400);

  const targetProId = String(body.pro_id ?? '').trim() || me.id;
  const isSuper = isSuperAdminEmail(me.email);
  if (targetProId !== me.id && !isSuper) {
    return json({ error: 'Réservé au super-admin' }, 403);
  }

  try {
    if (db) {
      const client = await db
        .prepare(`SELECT id FROM users WHERE id=? AND role='client'`)
        .bind(clientId)
        .first();
      if (!client) return json({ error: 'Client introuvable' }, 404);

      const pro = await db
        .prepare(`SELECT id FROM users WHERE id=? AND role='admin'`)
        .bind(targetProId)
        .first();
      if (!pro) return json({ error: 'Pro introuvable' }, 404);

      const existing = await db
        .prepare(`SELECT client_id, pro_id FROM client_assignments WHERE client_id=?`)
        .bind(clientId)
        .first<{ client_id: string; pro_id: string }>();
      if (existing) {
        if (existing.pro_id === targetProId) return json({ ok: true, already: true });
        if (!isSuper && existing.pro_id !== me.id) return json({ error: 'Déjà assigné' }, 409);

        await db
          .prepare(`UPDATE client_assignments SET pro_id=?, updated_at=datetime('now') WHERE client_id=?`)
          .bind(targetProId, clientId)
          .run();
        return json({ ok: true, reassigned: true });
      }

      await db
        .prepare(
          `INSERT INTO client_assignments (client_id, pro_id, created_at, updated_at)
           VALUES (?, ?, datetime('now'), datetime('now'))`
        )
        .bind(clientId, targetProId)
        .run();

      return json({ ok: true });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const clientRows = await sql<{ id: string }>
      `SELECT id::text as id FROM users WHERE id = ${clientId} AND role='client' LIMIT 1`;
    if (!clientRows[0]) return json({ error: 'Client introuvable' }, 404);

    const proRows = await sql<{ id: string }>
      `SELECT id::text as id FROM users WHERE id = ${targetProId} AND role='admin' LIMIT 1`;
    if (!proRows[0]) return json({ error: 'Pro introuvable' }, 404);

    const existingRows = await sql<{ pro_id: string }>
      `SELECT pro_id::text as pro_id FROM client_assignments WHERE client_id = ${clientId}::uuid LIMIT 1`;
    const existingProId = existingRows[0]?.pro_id ?? '';

    if (existingProId) {
      if (existingProId === targetProId) return json({ ok: true, already: true });
      if (!isSuper) return json({ error: 'Déjà assigné' }, 409);
      await sql`
        UPDATE client_assignments
        SET pro_id = ${targetProId}::uuid,
            updated_at = now()
        WHERE client_id = ${clientId}::uuid
      `;
      return json({ ok: true, reassigned: true });
    }

    await sql`
      INSERT INTO client_assignments (client_id, pro_id)
      VALUES (${clientId}::uuid, ${targetProId}::uuid)
    `;

    return json({ ok: true });
  } catch (err) {
    console.error('[Assign] Error:', err);
    return json({ error: 'AssignError' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
