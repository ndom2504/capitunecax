import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
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

  if (!savedState || savedState !== state) {
    return redirect('/connexion?error=InvalidState');
  }

  try {
    const clientId = import.meta.env.AUTH_GOOGLE_ID;
    const clientSecret = import.meta.env.AUTH_GOOGLE_SECRET;
    const origin = import.meta.env.DEV
      ? 'http://localhost:3000'
      : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
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

    // Création de la session (cookie httpOnly sécurisé)
    const sessionData = JSON.stringify({
      provider: 'google',
      id: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      role: ['info@misterdil.ca','divinegismille@gmail.com'].includes((profile.email||'').toLowerCase()) ? 'admin' : 'user',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 jours
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

    // Cookie lisible côté client pour afficher le nom/avatar
    cookies.set('capitune_user', JSON.stringify({ name: profile.name, email: profile.email, picture: profile.picture, provider: 'google', role: ['info@misterdil.ca','divinegismille@gmail.com'].includes((profile.email||'').toLowerCase()) ? 'admin' : 'user' }), {
      path: '/',
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return redirect('/dashboard');
  } catch (err) {
    console.error('[Google OAuth] Callback error:', err);
    return redirect('/connexion?error=CallbackError');
  }
};
