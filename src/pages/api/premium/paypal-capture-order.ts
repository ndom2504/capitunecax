import type { APIRoute } from 'astro';
import { getUserFromSessionFullAny, hasNeonDatabase } from '../../../lib/db';
import { activatePremiumForUserAny } from '../../../lib/premium';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const clientId = locals?.runtime?.env?.PAYPAL_CLIENT_ID || import.meta.env.PAYPAL_CLIENT_ID;
  const secret = locals?.runtime?.env?.PAYPAL_SECRET || import.meta.env.PAYPAL_SECRET;
  if (!clientId || !secret) return json({ error: 'PayPal not configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const orderId = String(body?.orderId ?? '').trim();
  if (!orderId) return json({ error: 'orderId requis' }, 400);

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const paypalEnv = locals?.runtime?.env?.PAYPAL_ENV || import.meta.env.PAYPAL_ENV || 'live';
  const paypalBase = paypalEnv === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const response = await fetch(`${paypalBase}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
  });

  const captureData = (await response.json()) as any;
  if (!response.ok) return json({ error: captureData?.message || 'PayPal capture failed' }, 500);

  const result = await activatePremiumForUserAny(db, String(me.id));
  return json({ ok: true, premium_expires_at: result.premium_expires_at, data: captureData });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
