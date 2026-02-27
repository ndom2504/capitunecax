import type { APIRoute } from 'astro';
import { createSessionAny, getNeonSqlClient, hasNeonDatabase, uuid } from '../../../../lib/db';

const ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Gestion des erreurs OAuth
  if (error) {
    const msg = errorDescription ? `${error}: ${errorDescription}` : error;
    return redirect(`/connexion?error=${encodeURIComponent(msg)}`);
  }

  if (!code) {
    return redirect('/connexion?error=MissingCode');
  }

  // Vérification du state CSRF
  const savedState = cookies.get('oauth_state_microsoft')?.value;
  cookies.delete('oauth_state_microsoft', { path: '/' });

  if (!savedState || savedState !== state) {
    return redirect('/connexion?error=InvalidState');
  }

  try {
    const clientId = import.meta.env.AUTH_MICROSOFT_ENTRA_ID ?? import.meta.env.AUTH_MICROSOFT_ID;
    const clientSecret = import.meta.env.AUTH_MICROSOFT_ENTRA_SECRET ?? import.meta.env.AUTH_MICROSOFT_SECRET;
    const tenantId = import.meta.env.AUTH_MICROSOFT_ENTRA_TENANT_ID ?? 'common';
    const origin = import.meta.env.DEV
      ? 'http://localhost:3000'
      : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
    const redirectUri = `${origin}/api/oauth/callback/microsoft-entra-id`;

    if (!clientId || !clientSecret) {
      return redirect('/connexion?error=MissingMicrosoftCredentials');
    }

    // Échange du code contre un token
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid email profile',
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[Microsoft OAuth] Token exchange failed:', errText);
      return redirect('/connexion?error=TokenExchangeFailed');
    }

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      return redirect('/connexion?error=NoAccessToken');
    }

    // Récupération du profil via Microsoft Graph API
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,photo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return redirect('/connexion?error=ProfileFetchFailed');
    }

    const profile = await profileRes.json() as {
      id?: string;
      displayName?: string;
      mail?: string;
      userPrincipalName?: string;
    };

    const email = profile.mail ?? profile.userPrincipalName ?? '';
    const emailStr = String(email ?? '').toLowerCase().trim();
    const name = String(profile.displayName ?? emailStr).trim();

    const isHttps = origin.startsWith('https');

    // ── Session D1 si DB disponible (prod Cloudflare) ───────────────────
    const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
    if (db && emailStr) {
      const role = ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client';
      const existing = await db
        .prepare(`SELECT id FROM users WHERE email = ?`)
        .bind(emailStr)
        .first<{ id: string }>();

      const userId = existing?.id ?? uuid();
      if (!existing) {
        await db
          .prepare(`INSERT INTO users (id, email, name, role, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, 'microsoft', ?)`)
          .bind(userId, emailStr, name, role, profile.id ?? '')
          .run();
      } else {
        await db
          .prepare(`UPDATE users SET name = COALESCE(NULLIF(?, ''), name), oauth_provider='microsoft', oauth_id=?, updated_at=datetime('now') WHERE id=?`)
          .bind(name, profile.id ?? '', userId)
          .run();
      }

      const sessionToken = await createSessionAny(db, userId);
      cookies.set('capitune_session', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      cookies.set('capitune_user', JSON.stringify({ name, email: emailStr, provider: 'microsoft', role }), {
        path: '/',
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });

      return redirect('/dashboard');
    }

    // ── Session Neon si DATABASE_URL dispo (prod Vercel) ─────────────────
    if (!db && emailStr && hasNeonDatabase()) {
      const sql = await getNeonSqlClient();
      if (!sql) return redirect('/connexion?error=MissingDatabaseUrl');

      const role = ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client';
      const existing = await sql<{ id: string }>`SELECT id FROM users WHERE email = ${emailStr} LIMIT 1`;
      const userId = existing[0]?.id ?? uuid();

      if (!existing[0]) {
        await sql`
          INSERT INTO users (id, email, name, role, oauth_provider, oauth_id)
          VALUES (${userId}, ${emailStr}, ${name}, ${role}, 'microsoft', ${profile.id ?? ''})
        `;
      } else {
        await sql`
          UPDATE users
          SET
            name = CASE WHEN ${name} <> '' THEN ${name} ELSE name END,
            oauth_provider = 'microsoft',
            oauth_id = ${profile.id ?? ''},
            role = CASE WHEN ${role} = 'admin' THEN 'admin' ELSE role END,
            updated_at = now()
          WHERE id = ${userId}
        `;
      }

      const sessionToken = await createSessionAny(null, userId);
      cookies.set('capitune_session', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      cookies.set('capitune_user', JSON.stringify({ name, email: emailStr, provider: 'microsoft', role }), {
        path: '/',
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      return redirect('/dashboard');
    }

    // ── Fallback sans DB (ex: vercel/serverless) ────────────────────────
    const sessionData = JSON.stringify({
      provider: 'microsoft',
      id: profile.id,
      email: emailStr,
      name,
      role: ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
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

    // Cookie lisible côté client
    cookies.set('capitune_user', JSON.stringify({ name, email: emailStr, provider: 'microsoft', role: ADMIN_EMAILS.includes(emailStr) ? 'admin' : 'client' }), {
      path: '/',
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirect('/dashboard');
  } catch (err) {
    console.error('[Microsoft OAuth] Callback error:', err);
    return redirect('/connexion?error=CallbackError');
  }
};
