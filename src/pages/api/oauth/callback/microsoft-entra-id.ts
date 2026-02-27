import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
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
    const name = profile.displayName ?? email;

    // Création de la session
    const sessionData = JSON.stringify({
      provider: 'microsoft',
      id: profile.id,
      email,
      name,
      role: ['info@misterdil.ca','divinegismille@gmail.com'].includes(email.toLowerCase()) ? 'admin' : 'user',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const isHttps = origin.startsWith('https');
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
    cookies.set('capitune_user', JSON.stringify({ name, email, provider: 'microsoft', role: ['info@misterdil.ca','divinegismille@gmail.com'].includes(email.toLowerCase()) ? 'admin' : 'user' }), {
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
