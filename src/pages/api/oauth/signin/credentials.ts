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

type DbUserRow = {
  id: string;
  name: string;
  password_hash: string | null;
  role: string;
  account_type?: string | null;
  email_verified?: number | null;
};

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
      let users: DbUserRow[] = [];
      try {
        const allRes = await db
          .prepare(`SELECT id, name, password_hash, role, account_type, email_verified FROM users WHERE email = ?`)
          .bind(emailStr)
          .all<DbUserRow>();
        users = (allRes as any)?.results ?? [];
      } catch {
        hasAccountTypeColumn = false;
        const allRes = await db
          .prepare(`SELECT id, name, password_hash, role, email_verified FROM users WHERE email = ?`)
          .bind(emailStr)
          .all<DbUserRow>();
        users = (allRes as any)?.results ?? [];
      }

      const matching = hasAccountTypeColumn
        ? users.filter((u) => (u.account_type === 'pro' ? 'pro' : 'client') === requestedAccountType)
        : users;

      const user = matching[0] ?? null;
      const fallbackUser = !user && users.length === 1 ? users[0] : null;
      const chosen = user ?? fallbackUser;

      if (!chosen && users.length > 1) {
        return json({ message: 'Plusieurs profils existent pour cet email. Sélectionnez Client ou Pro.', account_type_mismatch: true }, 409);
      }

      if (!chosen) {
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
        userIdForResponse = chosen.id;
        // Vérification mot de passe si hash présent
        if (chosen.password_hash) {
          const valid = await verifyPassword(chosen.password_hash, String(password));
          if (!valid) return json({ message: 'Mot de passe incorrect.' }, 401);
        }
        // Bloquer si email non vérifié
        if ((chosen.email_verified ?? 1) === 0) {
          return json({ message: 'Veuillez vérifier votre adresse courriel avant de vous connecter.', email_not_verified: true, email: emailStr }, 403);
        }
        displayName = chosen.name || nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : chosen.role;
        account_type = hasAccountTypeColumn ? (chosen.account_type === 'pro' ? 'pro' : 'client') : requestedAccountType;
        if (role === 'admin' && chosen.role !== 'admin') {
          await db.prepare(`UPDATE users SET role='admin', updated_at=datetime('now') WHERE id=?`).bind(chosen.id).run();
        }
        sessionToken = await createSessionAny(db, chosen.id);
      }
    } else if (useNeon) {
      // Neon peut échouer (table inexistante, timeout, connexion refusée).
      // Dans ce cas on tombe sur le fallback base64 pour ne jamais bloquer le login.
      let neonSuccess = false;
      try {
        const sql = await getNeonSqlClient();
        if (sql) {
          let hasAccountTypeColumn = true;
          let users: Array<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null; email_verified?: boolean | null }> = [];
          try {
            users = await sql<{ id: string; name: string; password_hash: string | null; role: string; account_type?: string | null; email_verified?: boolean | null }>
              `SELECT id, name, password_hash, role, account_type, email_verified FROM users WHERE email = ${emailStr}`;
          } catch {
            hasAccountTypeColumn = false;
            users = await sql<{ id: string; name: string; password_hash: string | null; role: string; email_verified?: boolean | null }>
              `SELECT id, name, password_hash, role, email_verified FROM users WHERE email = ${emailStr}`;
          }

          const matching = hasAccountTypeColumn
            ? users.filter((u) => (u.account_type === 'pro' ? 'pro' : 'client') === requestedAccountType)
            : users;
          const chosen = matching[0] ?? (users.length === 1 ? users[0] : null);

          if (!chosen && users.length > 1) {
            return json({ message: 'Plusieurs profils existent pour cet email. Sélectionnez Client ou Pro.', account_type_mismatch: true }, 409);
          }

          if (!chosen) {
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
            userIdForResponse = chosen.id;
            if (chosen.password_hash) {
              const valid = await verifyPassword(chosen.password_hash, String(password));
              if (!valid) return json({ message: 'Mot de passe incorrect.' }, 401);
            }
            if (chosen.email_verified === false) {
              return json({ message: 'Veuillez vérifier votre adresse courriel avant de vous connecter.', email_not_verified: true, email: emailStr }, 403);
            }
            displayName = chosen.name || nameFromEmail(emailStr);
            role = isAdminEmail(emailStr) ? 'admin' : chosen.role;
            account_type = hasAccountTypeColumn ? (chosen.account_type === 'pro' ? 'pro' : 'client') : requestedAccountType;
            if (role === 'admin' && chosen.role !== 'admin') {
              await sql`UPDATE users SET role = 'admin', updated_at = now() WHERE id = ${chosen.id}`;
            }
            sessionToken = await createSessionAny(null, chosen.id);
          }
          neonSuccess = true;
        }
      } catch (neonErr) {
        console.warn('[credentials] Neon unavailable, falling back to base64 session:', neonErr);
        neonSuccess = false;
      }

      if (!neonSuccess) {
        // Fallback base64 quand Neon est indisponible
        displayName = nameFromEmail(emailStr);
        role = isAdminEmail(emailStr) ? 'admin' : 'client';
        account_type = requestedAccountType;
        const sessionData = JSON.stringify({ email: emailStr, name: displayName, role, account_type, expires: Date.now() + 7 * 86400000 });
        sessionToken = btoa(encodeURIComponent(sessionData));
        userIdForResponse = '';
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
