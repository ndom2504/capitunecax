import type {MiddlewareHandler} from 'astro';
import { getUserFromSessionAny } from './lib/db';

const ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const {request} = ctx;
  const url = new URL(request.url);

  // Webflow dev endpoint
  if (import.meta.env.DEV && url.pathname === '/-wf/ready') {
    return new Response(JSON.stringify({ready: true}), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Helper : résoudre l'utilisateur depuis le cookie session
  async function resolveUser() {
    const token = ctx.cookies.get('capitune_session')?.value;
    if (!token) return null;
    const db = (ctx.locals.runtime?.env as Env | undefined)?.DB ?? null;
    const user = await getUserFromSessionAny(db, token);
    if (!user) return null;

    // Garde-fou: si la session vient d'un vieux token base64 sans role,
    // on applique la whitelist pour préserver l'accès admin.
    const role = user.role === 'admin' || ADMIN_EMAILS.includes(user.email) ? 'admin' : 'client';
    return { email: user.email, role };
  }

  // Protection dashboard
  if (url.pathname.startsWith('/dashboard')) {
    const token = ctx.cookies.get('capitune_session')?.value;
    if (!token) return ctx.redirect('/connexion');
    const db = (ctx.locals.runtime?.env as Env | undefined)?.DB ?? null;
    const user = await getUserFromSessionAny(db, token);
    if (!user) return ctx.redirect('/connexion');
  }

  // Protection admin (/admin/* et /api/admin/*)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    const user = await resolveUser();
    if (!user) return ctx.redirect('/connexion?redirect=' + encodeURIComponent(url.pathname));
    const isAdmin = user.role === 'admin' || ADMIN_EMAILS.includes(user.email);
    if (!isAdmin) {
      return new Response('<h1>403 — Accès refusé</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
    }
  }

  return next();
};

