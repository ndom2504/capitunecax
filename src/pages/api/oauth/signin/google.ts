import type { APIRoute } from 'astro';

// Format Google OAuth Client ID: NNNNN.apps.googleusercontent.com
// Note: le domaine Firebase (ex: projet.firebaseapp.com) est l'URI de redirection,
//       PAS le client ID. Le vrai client ID se trouve dans Google Cloud Console
//       → APIs & Services → Credentials → OAuth 2.0 Client IDs
function isValidGoogleClientId(id: string): boolean {
  return id.endsWith('.apps.googleusercontent.com');
}

function normalizeGoogleClientId(raw: string | undefined): string {
  // Vercel UI / .env peuvent inclure des espaces ou des guillemets
  // (ex: "xxx.apps.googleusercontent.com").
  return String(raw ?? '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '');
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
  const reqUrl = new URL(request.url);
  const accountType = reqUrl.searchParams.get('accountType') === 'pro' ? 'pro' : 'client';
  // ?mobile=true → signale que la requête vient de l'app mobile (deep link au retour)
  const mobile = reqUrl.searchParams.get('mobile') === 'true';
  // ?redirect_uri= → URI dynamique fournie par l'app mobile (exp://... en Expo Go)
  const mobileRedirectUri = reqUrl.searchParams.get('redirect_uri') ?? 'capitune://oauth';

  const clientId = normalizeGoogleClientId(import.meta.env.AUTH_GOOGLE_ID);

  if (!clientId || !isValidGoogleClientId(clientId)) {
    const msg = !clientId
      ? 'AUTH_GOOGLE_ID+manquant'
      : 'AUTH_GOOGLE_ID+invalide+-+format+attendu+%3A+NNN.apps.googleusercontent.com';
    return redirect(`/connexion?error=${msg}`);
  }

  // En dev : toujours localhost (les IPs privées sont rejetées par Google)
  // En prod : utiliser une origine canonique (SITE_URL) et y basculer AVANT
  // de poser le cookie state, sinon le callback peut revenir sur un autre domaine
  // et le cookie ne sera pas envoyé (→ InvalidState/CSRF).
  const requestOrigin = new URL(request.url).origin;
  const siteOrigin = import.meta.env.SITE_URL
    ? new URL(String(import.meta.env.SITE_URL).trim()).origin
    : null;
  const origin = import.meta.env.DEV ? 'http://localhost:3000' : (siteOrigin ?? requestOrigin);

  if (!import.meta.env.DEV && siteOrigin && siteOrigin !== requestOrigin) {
    // Conserver le choix de type de compte et le flag mobile
    const target = new URL(`${siteOrigin}/api/oauth/signin/google`);
    target.searchParams.set('accountType', accountType);
    if (mobile) target.searchParams.set('mobile', 'true');
    target.searchParams.set('redirect_uri', mobileRedirectUri);
    return redirect(target.toString());
  }

  const callbackUrl = `${origin}/api/oauth/callback/google`;
  // Encoder :mobile dans le state → survit à l'aller-retour Google sans cookie supplémentaire
  const state = mobile ? `${crypto.randomUUID()}:mobile` : crypto.randomUUID();

  const isHttps = origin.startsWith('https');

  cookies.set('oauth_state_google', state, {
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  cookies.set('oauth_account_type', accountType, {
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  if (mobile) {
    cookies.set('oauth_mobile_redirect', mobileRedirectUri, {
      path: '/',
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 10,
    });
  }

  return redirect(buildGoogleAuthUrl(clientId, callbackUrl, state));
};

// POST: réponse JSON attendue par auth-astro/client signIn('google')
export const POST: APIRoute = async ({ request, cookies }) => {
  let accountType: 'client' | 'pro' = 'client';
  try {
    const body = (await request.json()) as Record<string, unknown>;
    accountType = String(body?.accountType ?? '').toLowerCase().trim() === 'pro' ? 'pro' : 'client';
  } catch {
    accountType = 'client';
  }

  const clientId = normalizeGoogleClientId(import.meta.env.AUTH_GOOGLE_ID);

  if (!clientId || !isValidGoogleClientId(clientId)) {
    const msg = !clientId ? 'AUTH_GOOGLE_ID manquant' : 'AUTH_GOOGLE_ID invalide — format attendu : NNN.apps.googleusercontent.com';
    return new Response(JSON.stringify({ url: `/connexion?error=${encodeURIComponent(msg)}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestOrigin = new URL(request.url).origin;
  const siteOrigin = import.meta.env.SITE_URL
    ? new URL(String(import.meta.env.SITE_URL).trim()).origin
    : null;
  const origin = import.meta.env.DEV ? 'http://localhost:3000' : (siteOrigin ?? requestOrigin);
  const callbackUrl = `${origin}/api/oauth/callback/google`;
  const state = crypto.randomUUID();

  const isHttps = origin.startsWith('https');

  cookies.set('oauth_state_google', state, {
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  cookies.set('oauth_account_type', accountType, {
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  const oauthUrl = buildGoogleAuthUrl(clientId, callbackUrl, state);

  return new Response(JSON.stringify({ url: oauthUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
