import type { APIRoute } from 'astro';
import { getUserFromSessionAny } from '../../lib/db';
import { effectiveRoleForUser } from '../../lib/admin-emails';

/**
 * GET /api/me — Debug léger pour vérifier la session + rôle.
 * (Ne renvoie rien de sensible: pas de token, pas de secrets.)
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
  const user = await getUserFromSessionAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: effectiveRoleForUser(user),
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
