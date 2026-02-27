import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/db';

async function logout(cookies: Parameters<APIRoute>[0]['cookies'], locals: Parameters<APIRoute>[0]['locals']) {
  const token = cookies.get('capitune_session')?.value;
  const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
  if (db && token && /^[0-9a-f]{64}$/.test(token)) {
    await deleteSession(db, token);
  }
  cookies.delete('capitune_session', { path: '/' });
  cookies.delete('capitune_user',    { path: '/' });
}

export const POST: APIRoute = async ({ cookies, locals }) => {
  await logout(cookies, locals);
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ cookies, locals, redirect }) => {
  await logout(cookies, locals);
  return redirect('/connexion');
};

