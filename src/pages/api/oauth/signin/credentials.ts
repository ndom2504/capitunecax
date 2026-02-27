import type { APIRoute } from 'astro';
import { createSession, uuid } from '../../../../lib/db';

async function verifyPassword(stored: string, input: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const encoded = new TextEncoder().encode(salt + input);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  const computed = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === hash;
}

function nameFromEmail(email: string): string {
  return email.split('@')[0]!.replace(/[._+-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
}

const ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) return json({ message: 'Email et mot de passe requis.' }, 400);
    const emailStr = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) return json({ message: 'Email invalide.' }, 400);

    const isHttps = import.meta.env.PROD || new URL(request.url).protocol === 'https:';

    // ── Authentification D1 ───────────────────────────────────────────────
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    let sessionToken: string;
    let displayName: string;
    let role: string;

    if (db) {
      const user = await db
        .prepare(`SELECT * FROM users WHERE email = ?`)
        .bind(emailStr)
        .first<{ id: string; name: string; password_hash: string | null; role: string }>();

      if (!user) {
        // Auto-inscription si le compte n'existe pas (comportement MVP)
        const userId = uuid();
        displayName = nameFromEmail(emailStr);
        role = ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client';
        await db.prepare(
          `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)`
        ).bind(userId, emailStr, displayName, role).run();
        sessionToken = await createSession(db, userId);
      } else {
        // Vérification mot de passe si hash présent
        if (user.password_hash) {
          const valid = await verifyPassword(user.password_hash, String(password));
          if (!valid) return json({ message: 'Mot de passe incorrect.' }, 401);
        }
        displayName = user.name || nameFromEmail(emailStr);
        role = user.role;
        sessionToken = await createSession(db, user.id);
      }
    } else {
      // Fallback sans DB
      displayName = nameFromEmail(emailStr);
      role = ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client';
      const sessionData = JSON.stringify({ email: emailStr, name: displayName, role, expires: Date.now() + 7 * 86400000 });
      sessionToken = btoa(encodeURIComponent(sessionData));
    }

    cookies.set('capitune_session', sessionToken, {
      path: '/', httpOnly: true, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });
    cookies.set('capitune_user', JSON.stringify({ name: displayName, email: emailStr, role }), {
      path: '/', httpOnly: false, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });

    return json({ success: true, user: { email: emailStr, name: displayName } });

  } catch (error) {
    console.error('Signin error:', error);
    return json({ message: 'Erreur serveur. Veuillez réessayer.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
