import type { APIRoute } from 'astro';
import { createSessionAny, getNeonSqlClient, hasNeonDatabase, uuid } from '../../../../lib/db';
import { isAdminEmail } from '../../../../lib/admin-emails';

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

function normalizeAccountType(input: unknown): 'client' | 'pro' {
  return String(input ?? '').toLowerCase().trim() === 'pro' ? 'pro' : 'client';
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = body.email;
    const password = body.password;
    const requestedAccountType = normalizeAccountType(body.accountType);
    const isMobile = body.mobile === true || String(body.mobile ?? '').toLowerCase().trim() === 'true';

    if (!email || !password) return json({ message: 'Email et mot de passe requis.' }, 400);
    const emailStr = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) return json({ message: 'Email invalide.' }, 400);

    const isHttps = import.meta.env.PROD || new URL(request.url).protocol === 'https:';

    // ── Authentification D1 ───────────────────────────────────────────────
    const db = (locals.runtime?.env as Env)?.DB ?? null;
    const useNeon = !db && hasNeonDatabase();
    let sessionToken: string;
    let displayName: string;
    let role: string;
    let account_type: 'client' | 'pro' = requestedAccountType;
    let userIdForResponse = '';

    if (db) {
      let hasAccountTypeColumn = true;
      let user:
        | { id: string; name: string; password_hash: string | null; role: string; account_type?: string | null }
        | null
        | undefined;
      try {
        user = await db
          .prepare(`SELECT * FROM users WHERE email = ? AND account_type = ?`)
          .bind(emailStr, requestedAccountType)
          .first<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null; email_verified?: number | null }>();
      } catch {
        hasAccountTypeColumn = false;
        user = await db
          .prepare(`SELECT * FROM users WHERE email = ?`)
          .bind(emailStr)
          .first<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null; email_verified?: number | null }>();
      }

      if (!user) {
        // Auto-inscription si le compte n'existe pas (comportement MVP)
        const userId = uuid();
        userIdForResponse = userId;
        displayName = nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : 'client';
        try {
          await db.prepare(
            `INSERT INTO users (id, email, name, role, account_type) VALUES (?, ?, ?, ?, ?)`
          ).bind(userId, emailStr, displayName, role, requestedAccountType).run();
        } catch (e: any) {
          const msg = String(e?.message ?? e ?? '');
          if (/no\s+such\s+column|account_type/i.test(msg)) {
            await db.prepare(
              `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)`
            ).bind(userId, emailStr, displayName, role).run();
          } else {
            throw e;
          }
        }
        sessionToken = await createSessionAny(db, userId);
      } else {
        userIdForResponse = user.id;
        // Vérification mot de passe si hash présent
        if (user.password_hash) {
          const valid = await verifyPassword(user.password_hash, String(password));
          if (!valid) return json({ message: 'Mot de passe incorrect.' }, 401);
        }
        // Bloquer si email non vérifié
        if ((user.email_verified ?? 1) === 0) {
          return json({ message: 'Veuillez vérifier votre adresse courriel avant de vous connecter.', email_not_verified: true, email: emailStr }, 403);
        }
        displayName = user.name || nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : user.role;
        account_type = hasAccountTypeColumn ? (user.account_type === 'pro' ? 'pro' : 'client') : requestedAccountType;
        if (role === 'admin' && user.role !== 'admin') {
          await db.prepare(`UPDATE users SET role='admin', updated_at=datetime('now') WHERE id=?`).bind(user.id).run();
        }
        sessionToken = await createSessionAny(db, user.id);
      }
    } else if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ message: 'Configuration base de données manquante.' }, 500);

      let hasAccountTypeColumn = true;
      let user: { id: string; name: string; password_hash: string | null; role: string; account_type?: string | null; email_verified?: boolean | null } | null;
      try {
        const rows = await sql<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null }>
          `SELECT id, name, password_hash, role, account_type FROM users WHERE email = ${emailStr} AND account_type = ${requestedAccountType} LIMIT 1`;
        user = rows[0] ?? null;
      } catch {
        hasAccountTypeColumn = false;
        const rows = await sql<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null }>
          `SELECT id, name, password_hash, role, account_type FROM users WHERE email = ${emailStr} LIMIT 1`;
        user = rows[0] ?? null;
      }

      if (!user) {
        const userId = uuid();
        userIdForResponse = userId;
        displayName = nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : 'client';
        try {
          await sql`INSERT INTO users (id, email, name, role, account_type) VALUES (${userId}, ${emailStr}, ${displayName}, ${role}, ${requestedAccountType})`;
        } catch {
          await sql`INSERT INTO users (id, email, name, role) VALUES (${userId}, ${emailStr}, ${displayName}, ${role})`;
        }
        sessionToken = await createSessionAny(null, userId);
      } else {
        userIdForResponse = user.id;
        if (user.password_hash) {
          const valid = await verifyPassword(user.password_hash, String(password));
          if (!valid) return json({ message: 'Mot de passe incorrect.' }, 401);
        }
        // Bloquer si email non vérifié
        if (user.email_verified === false) {
          return json({ message: 'Veuillez vérifier votre adresse courriel avant de vous connecter.', email_not_verified: true, email: emailStr }, 403);
        }
        displayName = user.name || nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : user.role;
        account_type = hasAccountTypeColumn ? (user.account_type === 'pro' ? 'pro' : 'client') : requestedAccountType;
        if (role === 'admin' && user.role !== 'admin') {
          await sql`UPDATE users SET role = 'admin', updated_at = now() WHERE id = ${user.id}`;
        }
        sessionToken = await createSessionAny(null, user.id);
      }
    } else {
      // Fallback sans DB
      displayName = nameFromEmail(emailStr);
      role = isAdminEmail(emailStr) ? 'admin' : 'client';
      account_type = requestedAccountType;
      const sessionData = JSON.stringify({ email: emailStr, name: displayName, role, account_type, expires: Date.now() + 7 * 86400000 });
      sessionToken = btoa(encodeURIComponent(sessionData));
      userIdForResponse = '';
    }

    cookies.set('capitune_session', sessionToken, {
      path: '/', httpOnly: true, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });
    cookies.set('capitune_user', JSON.stringify({ name: displayName, email: emailStr, role, account_type }), {
      path: '/', httpOnly: false, secure: isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
    });

    return json({
      success: true,
      token: isMobile ? sessionToken : undefined,
      user: {
        id: userIdForResponse,
        email: emailStr,
        name: displayName,
        role,
        account_type,
      },
    });

  } catch (error) {
    console.error('Signin error:', error);
    return json({ message: 'Erreur serveur. Veuillez réessayer.' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
