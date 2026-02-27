import type { APIRoute } from 'astro';
import { createSession, uuid } from '../../../lib/db';

/**
 * Génère un hash de mot de passe (SHA-256 + salt simple).
 * Production → utiliser bcrypt via Workers AI ou adapter.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(salt + password);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];
function getRole(email: string): 'admin' | 'client' {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim()) ? 'admin' : 'client';
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const data = await request.json();

    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return json({ message: 'Tous les champs obligatoires doivent être remplis.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
      return json({ message: 'Adresse email invalide.' }, 400);
    }
    if (String(data.password).length < 8) {
      return json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' }, 400);
    }

    const emailStr  = String(data.email).toLowerCase().trim();
    const name      = `${String(data.firstName).trim()} ${String(data.lastName).trim()}`;
    const phone     = String(data.phone ?? '').slice(0, 30);
    const role      = getRole(emailStr);
    const isHttps   = import.meta.env.PROD || new URL(request.url).protocol === 'https:';

    // ── Persistance D1 ────────────────────────────────────────────────────
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    let sessionToken: string;

    if (db) {
      // Vérifier si l'email existe déjà
      const existing = await db
        .prepare(`SELECT id FROM users WHERE email = ?`)
        .bind(emailStr)
        .first<{ id: string }>();

      if (existing) {
        return json({ message: 'Un compte avec cet email existe déjà.' }, 409);
      }

      const userId  = uuid();
      const salt    = crypto.randomUUID();
      const hash    = await hashPassword(String(data.password), salt);
      const pwHash  = salt + ':' + hash;

      await db.prepare(
        `INSERT INTO users (id, email, password_hash, name, phone, role)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(userId, emailStr, pwHash, name, phone, role).run();

      sessionToken = await createSession(db, userId);
    } else {
      // Fallback sans DB (dev sans wrangler)
      const sessionData = JSON.stringify({ email: emailStr, name, role, expires: Date.now() + 7 * 86400000 });
      sessionToken = btoa(encodeURIComponent(sessionData));
    }

    cookies.set('capitune_session', sessionToken, {
      path: '/', httpOnly: true, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });
    cookies.set('capitune_user', JSON.stringify({ name, email: emailStr, role }), {
      path: '/', httpOnly: false, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });

    return json({ success: true, message: 'Compte créé avec succès !', user: { email: emailStr, name } });

  } catch (error) {
    console.error('Signup error:', error);
    return json({ message: 'Erreur serveur. Veuillez réessayer.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
