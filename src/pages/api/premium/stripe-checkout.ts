import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getUserFromSessionFullAny, hasNeonDatabase } from '../../../lib/db';
import { isTestEmail } from '../../../lib/test-access';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  // Compte test : aucun paiement ne doit être créé.
  if (isTestEmail(me.email, locals)) {
    return json({ error: 'Paiements désactivés pour ce compte de test.' }, 403);
  }

  const stripeKey = (
    locals?.runtime?.env?.STRIPE_SECRET_KEY ||
    import.meta.env.STRIPE_SECRET_KEY ||
    (globalThis as any).process?.env?.STRIPE_SECRET_KEY ||
    ''
  ).trim();
  const configuredCurrency =
    locals?.runtime?.env?.PAYMENT_CURRENCY ||
    import.meta.env.PAYMENT_CURRENCY ||
    import.meta.env.PUBLIC_PAYMENT_CURRENCY ||
    'CAD';
  const currency = String(configuredCurrency).toLowerCase();

  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  const origin = new URL(request.url).origin;
  const success_url = `${origin}/dashboard?premium=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/dashboard?premium=cancelled`;

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: me.email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: 10000,
            product_data: { name: 'Abonnement Premium (1 an)' },
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        kind: 'premium',
        userId: String(me.id),
      },
    });

    return json({ url: session.url });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[stripe-checkout]', msg);
    return json({ error: 'Erreur Stripe : ' + msg }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
