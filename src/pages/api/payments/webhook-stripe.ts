import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
    const webhookSecret = locals?.runtime?.env?.STRIPE_WEBHOOK_SECRET || import.meta.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeKey || !webhookSecret) {
      return new Response('Webhook not configured', { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia'
    });
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);
        
        // TODO: Update your database
        // - Mark invoice as paid
        // - Send confirmation email
        // - Activate services for user
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', failedPayment.id);
        
        // TODO: Handle failed payment
        // - Notify user
        // - Log the failure
        
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
