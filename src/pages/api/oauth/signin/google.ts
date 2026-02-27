import type { APIRoute } from 'astro';

// Format Google OAuth Client ID: NNNNN.apps.googleusercontent.com
// Note: le domaine Firebase (ex: projet.firebaseapp.com) est l'URI de redirection,
//       PAS le client ID. Le vrai client ID se trouve dans Google Cloud Console
//       → APIs & Services → Credentials → OAuth 2.0 Client IDs
function isValidGoogleClientId(id: string): boolean {
  return id.endsWith('.apps.googleusercontent.com');
}

function buildGoogleAuthUrl(clientId: string, callbackUrl: string, state: string): string {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');
  return authUrl.toString();
}

// GET: redirection directe vers Google OAuth (navigation navigateur)
export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const clientId = import.meta.env.AUTH_GOOGLE_ID;

  if (!clientId || !isValidGoogleClientId(clientId)) {
    const msg = !clientId
      ? 'AUTH_GOOGLE_ID+manquant'
      : 'AUTH_GOOGLE_ID+invalide+-+format+attendu+%3A+NNN.apps.googleusercontent.com';
    return redirect(`/connexion?error=${msg}`);
  }

  // En dev : toujours localhost (les IPs privées sont rejetées par Google)
  // En prod : utiliser SITE_URL ou l'origin de la requête
  const origin = import.meta.env.DEV
    ? 'http://localhost:3000'
    : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
  const callbackUrl = `${origin}/api/oauth/callback/google`;
  const state = crypto.randomUUID();

  cookies.set('oauth_state_google', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  return redirect(buildGoogleAuthUrl(clientId, callbackUrl, state));
};

// POST: réponse JSON attendue par auth-astro/client signIn('google')
export const POST: APIRoute = async ({ request, cookies }) => {
  const clientId = import.meta.env.AUTH_GOOGLE_ID;

  if (!clientId || !isValidGoogleClientId(clientId)) {
    const msg = !clientId ? 'AUTH_GOOGLE_ID manquant' : 'AUTH_GOOGLE_ID invalide — format attendu : NNN.apps.googleusercontent.com';
    return new Response(JSON.stringify({ url: `/connexion?error=${encodeURIComponent(msg)}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = import.meta.env.DEV
    ? 'http://localhost:3000'
    : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
  const callbackUrl = `${origin}/api/oauth/callback/google`;
  const state = crypto.randomUUID();

  cookies.set('oauth_state_google', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  const oauthUrl = buildGoogleAuthUrl(clientId, callbackUrl, state);

  return new Response(JSON.stringify({ url: oauthUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
