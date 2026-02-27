/**
 * GET /api/user/profile  — Lire le profil utilisateur
 * PUT /api/user/profile  — Mettre à jour nom, téléphone, ville, bio, notifs
 */
import type { APIRoute } from 'astro';
import { getUserFromSession } from '../../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    avatar_key: user.avatar_key,
    role: user.role,
    notif_email: !!user.notif_email,
    notif_rdv: !!user.notif_rdv,
    notif_msg: !!user.notif_msg,
  });
};

export const PUT: APIRoute = async ({ cookies, locals, request }) => {
  const db = (locals.runtime?.env as Env)?.DB;
  const token = cookies.get('capitune_session')?.value;
  if (!db || !token) return json({ error: 'Non connecté' }, 401);

  const user = await getUserFromSession(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as Record<string, unknown>;

  const name     = String(body.name     ?? user.name).slice(0, 100);
  const phone    = String(body.phone    ?? user.phone).slice(0, 30);
  const location = String(body.location ?? user.location).slice(0, 100);
  const bio      = String(body.bio      ?? user.bio).slice(0, 500);
  const notif_email = body.notif_email !== undefined ? (body.notif_email ? 1 : 0) : user.notif_email;
  const notif_rdv   = body.notif_rdv   !== undefined ? (body.notif_rdv   ? 1 : 0) : user.notif_rdv;
  const notif_msg   = body.notif_msg   !== undefined ? (body.notif_msg   ? 1 : 0) : user.notif_msg;

  await db.prepare(
    `UPDATE users SET name=?, phone=?, location=?, bio=?, notif_email=?, notif_rdv=?, notif_msg=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(name, phone, location, bio, notif_email, notif_rdv, notif_msg, user.id).run();

  return json({ ok: true });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
