import type { APIRoute } from 'astro';

function buildMicrosoftAuthUrl(clientId: string, tenantId: string, callbackUrl: string, state: string): string {
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');
  return authUrl.toString();
}

// GET: redirection directe vers Microsoft OAuth (navigation navigateur)
export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const clientId = import.meta.env.AUTH_MICROSOFT_ENTRA_ID ?? import.meta.env.AUTH_MICROSOFT_ID;
  const tenantId = import.meta.env.AUTH_MICROSOFT_ENTRA_TENANT_ID ?? 'common';

  if (!clientId || clientId.includes('votre')) {
    return redirect('/connexion?error=Configuration+Microsoft+OAuth+manquante');
  }

  const origin = import.meta.env.DEV
    ? 'http://localhost:3000'
    : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
  const callbackUrl = `${origin}/api/oauth/callback/microsoft-entra-id`;
  const state = crypto.randomUUID();

  cookies.set('oauth_state_microsoft', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  return redirect(buildMicrosoftAuthUrl(clientId, tenantId, callbackUrl, state));
};

// POST: réponse JSON attendue par auth-astro/client signIn('microsoft-entra-id')
export const POST: APIRoute = async ({ request, cookies }) => {
  const clientId = import.meta.env.AUTH_MICROSOFT_ENTRA_ID ?? import.meta.env.AUTH_MICROSOFT_ID;
  const tenantId = import.meta.env.AUTH_MICROSOFT_ENTRA_TENANT_ID ?? 'common';

  if (!clientId || clientId.includes('votre')) {
    return new Response(JSON.stringify({ url: '/connexion?error=Configuration+Microsoft+OAuth+manquante' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = import.meta.env.DEV
    ? 'http://localhost:3000'
    : (import.meta.env.SITE_URL ?? new URL(request.url).origin);
  const callbackUrl = `${origin}/api/oauth/callback/microsoft-entra-id`;
  const state = crypto.randomUUID();

  cookies.set('oauth_state_microsoft', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  const oauthUrl = buildMicrosoftAuthUrl(clientId, tenantId, callbackUrl, state);

  return new Response(JSON.stringify({ url: oauthUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
