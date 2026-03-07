import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { isTestEmail } from '../../../lib/test-access';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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
        customerName: customerName || ''
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
