import type { APIRoute } from 'astro';
import { createSessionAny, getNeonSqlClient, hasNeonDatabase, uuid } from '../../../../lib/db';
import { isAdminEmail } from '../../../../lib/admin-emails';

function mapCallbackError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err ?? '');

  // Neon / Postgres (ex: relation "users" does not exist)
  if (/relation\s+"?\w+"?\s+does\s+not\s+exist/i.test(message) || /42P01/.test(message)) {
    return 'DatabaseNotInitialized';
  }

  // D1 (ex: no such table: users)
  if (/no\s+such\s+table/i.test(message)) {
    return 'DatabaseNotInitialized';
  }

  if (/DATABASE_URL/i.test(message)) {
    return 'MissingDatabaseUrl';
  }

  return 'CallbackErrorGoogle';
}

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Gestion des erreurs OAuth (ex: accès refusé)
  if (error) {
    return redirect(`/connexion?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return redirect('/connexion?error=MissingCode');
  }

  // Vérification du state CSRF
  const savedState = cookies.get('oauth_state_google')?.value;
  cookies.delete('oauth_state_google', { path: '/' });

  const accountType = cookies.get('oauth_account_type')?.value === 'pro' ? 'pro' : 'client';
  cookies.delete('oauth_account_type', { path: '/' });

  if (!savedState || savedState !== state) {
    return redirect('/connexion?error=InvalidState');
  }

  // state peut contenir le suffixe :mobile (ajouté par signin/google.ts) pour signaler l'app mobile
  const isMobile = !!(state && state.endsWith(':mobile'));
  // Lire et supprimer le cookie redirect URI mobile (exp://... en Expo Go, capitune://oauth en prod)
  const mobileRedirectUri = cookies.get('oauth_mobile_redirect')?.value ?? 'capitune://oauth';
  if (isMobile) cookies.delete('oauth_mobile_redirect', { path: '/' });

  try {
    const clientId = import.meta.env.AUTH_GOOGLE_ID;
    const clientSecret = import.meta.env.AUTH_GOOGLE_SECRET;
    const requestOrigin = new URL(request.url).origin;
    const siteOrigin = import.meta.env.SITE_URL
      ? new URL(String(import.meta.env.SITE_URL).trim()).origin
      : null;
    const origin = import.meta.env.DEV ? 'http://localhost:3000' : (siteOrigin ?? requestOrigin);
    const redirectUri = `${origin}/api/oauth/callback/google`;

    if (!clientId || !clientSecret) {
      return redirect('/connexion?error=MissingGoogleCredentials');
    }

    // Échange du code contre un token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[Google OAuth] Token exchange failed:', errText);
      return redirect('/connexion?error=TokenExchangeFailed');
    }

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      return redirect('/connexion?error=NoAccessToken');
    }

    // Récupération du profil utilisateur
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return redirect('/connexion?error=ProfileFetchFailed');
    }

    const profile = await profileRes.json() as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    const email = (profile.email ?? '').toLowerCase().trim();
    const name = (profile.name ?? email).trim();
    const picture = String(profile.picture ?? '').trim();

    if (!email) {
      return redirect('/connexion?error=MissingEmail');
    }

    const isHttps = origin.startsWith('https');

    const role = isAdminEmail(email) ? 'admin' : 'client';

    // ── Session D1 si DB disponible (prod Cloudflare) ───────────────────
    const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
    if (db) {
      try {
        let existing:
          | { id: string; name: string | null; role: string | null; account_type?: string | null }
          | null
          | undefined;
        try {
          existing = await db
            .prepare(`SELECT id, name, role, account_type FROM users WHERE email = ? AND account_type = ?`)
            .bind(email, accountType)
            .first<{ id: string; name: string | null; role: string | null; account_type?: string | null }>();
        } catch {
          existing = await db
            .prepare(`SELECT id, name, role FROM users WHERE email = ?`)
            .bind(email)
            .first<{ id: string; name: string | null; role: string | null }>();
        }

        const userId = existing?.id ?? uuid();
        if (!existing) {
          try {
            await db
              .prepare(
                `INSERT INTO users (id, email, name, avatar_key, role, account_type, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?, 'google', ?)`
              )
              .bind(userId, email, name, picture, role, accountType, profile.id ?? '')
              .run();
          } catch (e: any) {
            const msg = String(e?.message ?? e ?? '');
            if (/no\s+such\s+column|account_type/i.test(msg)) {
              await db
                .prepare(
                  `INSERT INTO users (id, email, name, avatar_key, role, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, 'google', ?)`
                )
                .bind(userId, email, name, picture, role, profile.id ?? '')
                .run();
            } else {
              throw e;
            }
          }
        } else {
          // Update minimal + tenter de mettre à jour account_type si dispo
          try {
            await db
              .prepare(
                `UPDATE users
                 SET
                   name = COALESCE(NULLIF(?, ''), name),
                   avatar_key = COALESCE(NULLIF(?, ''), avatar_key),
                   oauth_provider='google',
                   oauth_id=?,
                   role = CASE WHEN ? = 'admin' THEN 'admin' ELSE COALESCE(role, ?) END,
                   updated_at=datetime('now')
                 WHERE id=?`
              )
              .bind(name, picture, profile.id ?? '', role, role, userId)
              .run();
          } catch (e: any) {
            const msg = String(e?.message ?? e ?? '');
            if (/no\s+such\s+column|account_type/i.test(msg)) {
              await db
                .prepare(
                  `UPDATE users
                   SET
                     name = COALESCE(NULLIF(?, ''), name),
                     avatar_key = COALESCE(NULLIF(?, ''), avatar_key),
                     oauth_provider='google',
                     oauth_id=?,
                     role = CASE WHEN ? = 'admin' THEN 'admin' ELSE COALESCE(role, ?) END,
                     updated_at=datetime('now')
                   WHERE id=?`
                )
                .bind(name, picture, profile.id ?? '', role, role, userId)
                .run();
            } else {
              throw e;
            }
          }
        }

        const sessionToken = await createSessionAny(db, userId);
        cookies.set('capitune_session', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: isHttps,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
        });

        cookies.set(
          'capitune_user',
          JSON.stringify({ name, email, picture, provider: 'google', role, account_type: accountType }),
          {
            path: '/',
            httpOnly: false,
            secure: isHttps,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
          }
        );

        if (isMobile) {
          return redirect(`${mobileRedirectUri}?token=${encodeURIComponent(sessionToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}&account_type=${encodeURIComponent(accountType)}`);
        }
        return redirect('/dashboard');
      } catch (dbErr) {
        console.error('[Google OAuth] D1 session/store failed, falling back:', dbErr);
      }
    }

    // ── Session Neon si DATABASE_URL dispo (prod Vercel) ─────────────────
    if (!db && hasNeonDatabase()) {
      try {
        const sql = await getNeonSqlClient();
        if (!sql) return redirect('/connexion?error=MissingDatabaseUrl');

        let existing: Array<{ id: string; name: string; role: string; account_type?: string | null }>;
        try {
          existing = await sql<{ id: string; name: string; role: string; account_type?: string | null }>
            `SELECT id, name, role, account_type FROM users WHERE email = ${email} AND account_type = ${accountType} LIMIT 1`;
        } catch {
          const rows = await sql<{ id: string; name: string; role: string }>
            `SELECT id, name, role FROM users WHERE email = ${email} LIMIT 1`;
          existing = rows as unknown as Array<{ id: string; name: string; role: string; account_type?: string | null }>;
        }

        const userId = existing[0]?.id ?? uuid();
        if (!existing[0]) {
          try {
            await sql`
              INSERT INTO users (id, email, name, avatar_key, role, account_type, oauth_provider, oauth_id)
              VALUES (${userId}, ${email}, ${name}, ${picture}, ${role}, ${accountType}, 'google', ${profile.id ?? ''})
            `;
          } catch {
            await sql`
              INSERT INTO users (id, email, name, avatar_key, role, oauth_provider, oauth_id)
              VALUES (${userId}, ${email}, ${name}, ${picture}, ${role}, 'google', ${profile.id ?? ''})
            `;
          }
        } else {
          try {
            await sql`
              UPDATE users
              SET
                name = CASE WHEN ${name} <> '' THEN ${name} ELSE name END,
                avatar_key = CASE WHEN ${picture} <> '' THEN ${picture} ELSE avatar_key END,
                oauth_provider = 'google',
                oauth_id = ${profile.id ?? ''},
                role = CASE WHEN ${role} = 'admin' THEN 'admin' ELSE role END,
                updated_at = now()
              WHERE id = ${userId}
            `;
          } catch {
            await sql`
              UPDATE users
              SET
                name = CASE WHEN ${name} <> '' THEN ${name} ELSE name END,
                avatar_key = CASE WHEN ${picture} <> '' THEN ${picture} ELSE avatar_key END,
                oauth_provider = 'google',
                oauth_id = ${profile.id ?? ''},
                role = CASE WHEN ${role} = 'admin' THEN 'admin' ELSE role END,
                updated_at = now()
              WHERE id = ${userId}
            `;
          }
        }

        const sessionToken = await createSessionAny(null, userId);
        cookies.set('capitune_session', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: isHttps,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
        });
        cookies.set(
          'capitune_user',
          JSON.stringify({ name, email, picture, provider: 'google', role, account_type: accountType }),
          {
            path: '/',
            httpOnly: false,
            secure: isHttps,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
          }
        );
        if (isMobile) {
          return redirect(`${mobileRedirectUri}?token=${encodeURIComponent(sessionToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}&account_type=${encodeURIComponent(accountType)}`);
        }
        return redirect('/dashboard');
      } catch (dbErr) {
        console.error('[Google OAuth] Neon session/store failed, falling back:', dbErr);
      }
    }

    // ── Fallback sans DB (ex: vercel/serverless) ────────────────────────
    const sessionData = JSON.stringify({
      provider: 'google',
      id: profile.id,
      email,
      name,
      picture: profile.picture,
      role,
      account_type: accountType,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    // btoa() est compatible Cloudflare Workers (pas de Buffer Node.js)
    const sessionToken = btoa(encodeURIComponent(sessionData));

    cookies.set('capitune_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Cookie lisible côté client pour afficher le nom/avatar
    cookies.set('capitune_user', JSON.stringify({ name, email, picture: profile.picture, provider: 'google', role, account_type: accountType }), {
      path: '/',
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    if (isMobile) {
      return redirect(`${mobileRedirectUri}?token=${encodeURIComponent(sessionToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(role)}&account_type=${encodeURIComponent(accountType)}`);
    }
    return redirect('/dashboard');
  } catch (err) {
    console.error('[Google OAuth] Callback error:', err);
    return redirect(`/connexion?error=${mapCallbackError(err)}`);
  }
};
