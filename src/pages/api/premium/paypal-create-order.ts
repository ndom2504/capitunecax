import type { APIRoute } from 'astro';
import { getUserFromSessionFullAny, hasNeonDatabase } from '../../../lib/db';

export const POST: APIRoute = async ({ cookies, locals }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const clientId = locals?.runtime?.env?.PAYPAL_CLIENT_ID || import.meta.env.PAYPAL_CLIENT_ID;
  const secret = locals?.runtime?.env?.PAYPAL_SECRET || import.meta.env.PAYPAL_SECRET;
  const configuredCurrency =
    locals?.runtime?.env?.PAYMENT_CURRENCY ||
    import.meta.env.PAYMENT_CURRENCY ||
    import.meta.env.PUBLIC_PAYMENT_CURRENCY ||
    'CAD';
  const currencyCode = String(configuredCurrency).toUpperCase();

  if (!clientId || !secret) return json({ error: 'PayPal not configured' }, 500);

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const paypalEnv = locals?.runtime?.env?.PAYPAL_ENV || import.meta.env.PAYPAL_ENV || 'live';
  const paypalBase = paypalEnv === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

  const invoiceId = `PREMIUM-${String(me.id).slice(0, 16)}-${Date.now()}`;

  const response = await fetch(`${paypalBase}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: '100.00',
          },
          description: 'Abonnement Premium (1 an)',
          invoice_id: invoiceId,
          custom_id: `premium:${String(me.id)}`,
        },
      ],
      application_context: {
        brand_name: 'CAPITUNE',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  });

  const order = (await response.json()) as any;
  if (!response.ok) return json({ error: order?.message || 'PayPal order creation failed' }, 500);

  return json({ id: order?.id });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
