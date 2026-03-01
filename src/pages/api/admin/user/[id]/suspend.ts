/**
 * PATCH /api/admin/user/[id]/suspend
 *   body: { suspend: true | false }
 *
 * DELETE /api/admin/user/[id]/suspend
 *   Supprime définitivement le compte (cascade)
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, hasNeonDatabase, getUserFromSessionAny } from '../../../../../lib/db';
import { isSuperAdminEmail } from '../../../../../lib/admin-emails';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getAdmin(locals: App.Locals, cookies: AstroCookies) {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return { me: null, db, error: json({ error: 'Non connecté' }, 401) };
  const me = await getUserFromSessionAny(db, token);
  if (!me || me.role !== 'admin') return { me: null, db, error: json({ error: 'Accès refusé' }, 403) };
  return { me, db, error: null };
}

/** PATCH — suspendre ou réactiver */
export const PATCH: APIRoute = async ({ params, locals, cookies, request }) => {
  const { me, db, error } = await getAdmin(locals, cookies);
  if (error) return error;

  const { id } = params;
  if (!id) return json({ error: 'ID manquant' }, 400);

  // Empêcher de se suspendre soi-même
  if (id === (me as any).id) return json({ error: 'Impossible de se suspendre soi-même' }, 400);

  let suspend = true;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.suspend === 'boolean') suspend = body.suspend;
  } catch {}

  const suspendedVal = suspend ? 1 : 0;
  const action = suspend ? 'suspendu' : 'réactivé';

  if (db) {
    // Vérifier que le compte cible n'est pas super-admin
    const target = await db.prepare(`SELECT email, role FROM users WHERE id=?`).bind(id).first<{ email: string; role: string }>();
    if (!target) return json({ error: 'Utilisateur introuvable' }, 404);
    if (isSuperAdminEmail(target.email)) return json({ error: 'Impossible de suspendre un super-admin' }, 403);

    await db.prepare(`UPDATE users SET suspended=?, updated_at=datetime('now') WHERE id=?`).bind(suspendedVal, id).run();
    return json({ ok: true, action });
  }

  // Neon / Postgres
  const sql = await getNeonSqlClient();
  if (!sql) return json({ error: 'DB non disponible' }, 503);

  await sql`UPDATE users SET suspended=${suspendedVal}, updated_at=NOW() WHERE id=${id}`;
  return json({ ok: true, action });
};

/** DELETE — supprimer définitivement */
export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  const { me, db, error } = await getAdmin(locals, cookies);
  if (error) return error;

  const { id } = params;
  if (!id) return json({ error: 'ID manquant' }, 400);
  if (id === (me as any).id) return json({ error: 'Impossible de supprimer son propre compte' }, 400);

  if (db) {
    const target = await db.prepare(`SELECT email FROM users WHERE id=?`).bind(id).first<{ email: string }>();
    if (!target) return json({ error: 'Utilisateur introuvable' }, 404);
    if (isSuperAdminEmail(target.email)) return json({ error: 'Impossible de supprimer un super-admin' }, 403);

    // Les FK ON DELETE CASCADE suppriment sessions, projects, messages, payments
    await db.prepare(`DELETE FROM users WHERE id=?`).bind(id).run();
    return json({ ok: true });
  }

  const sql = await getNeonSqlClient();
  if (!sql) return json({ error: 'DB non disponible' }, 503);

  await sql`DELETE FROM users WHERE id=${id}`;
  return json({ ok: true });
};
