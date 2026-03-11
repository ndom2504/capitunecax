import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getActiveProjectAny, getUserFromSessionAny, hasNeonDatabase } from '../../../lib/db';
import { isTestEmail } from '../../../lib/test-access';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
    const useNeon = !db && hasNeonDatabase();

    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    const configuredCurrency =
      locals?.runtime?.env?.PAYMENT_CURRENCY ||
      import.meta.env.PAYMENT_CURRENCY ||
      import.meta.env.PUBLIC_PAYMENT_CURRENCY ||
      'CAD';
    const currency = String(configuredCurrency).toLowerCase();
    
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia'
    });
    
    const { amount, invoiceId, services, customerEmail, customerName } = await request.json();

    const token = cookies.get('capitune_session')?.value ?? '';
    const me = token ? await getUserFromSessionAny(db, token) : null;
    const project = me && (db || useNeon) ? await getActiveProjectAny(db, String(me.id)) : null;

    // Compte test : aucun paiement ne doit être créé.
    if (isTestEmail(customerEmail, locals)) {
      return new Response(JSON.stringify({ error: 'Paiements désactivés pour ce compte de test.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        invoiceId: invoiceId || '',
        services: JSON.stringify(services || []),
        customerEmail: customerEmail || '',
        customerName: customerName || '',
        kind: 'services',
        userId: me ? String(me.id) : '',
        projectId: project?.id ? String(project.id) : '',
      },
      description: `CAPITUNE - ${invoiceId || 'Service'}`
    });
    
    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Stripe payment intent error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Payment intent creation failed' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
