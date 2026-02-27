import type {MiddlewareHandler} from 'astro';

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
    if (db && /^[0-9a-f]{64}$/.test(token)) {
      const row = await db
        .prepare(`SELECT u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > datetime('now')`)
        .bind(token)
        .first<{ email: string; role: string }>();
      return row ?? null;
    }
    // Fallback ancien format base64
    try {
      const data = JSON.parse(decodeURIComponent(atob(token)));
      return { email: data.email as string, role: ADMIN_EMAILS.includes(data.email) ? 'admin' : 'client' };
    } catch { return null; }
  }

  // Protection dashboard
  if (url.pathname.startsWith('/dashboard')) {
    const token = ctx.cookies.get('capitune_session')?.value;
    if (!token) return ctx.redirect('/connexion');
    const db = (ctx.locals.runtime?.env as Env | undefined)?.DB ?? null;
    if (db && /^[0-9a-f]{64}$/.test(token)) {
      const row = await db.prepare(`SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`).bind(token).first();
      if (!row) return ctx.redirect('/connexion');
    }
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

