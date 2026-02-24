import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const clientId = locals?.runtime?.env?.PAYPAL_CLIENT_ID || import.meta.env.PAYPAL_CLIENT_ID;
    const secret = locals?.runtime?.env?.PAYPAL_SECRET || import.meta.env.PAYPAL_SECRET;
    
    if (!clientId || !secret) {
      return new Response(JSON.stringify({ error: 'PayPal not configured' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { amount, invoiceId, description } = await request.json();
    
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    
    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'CAD',
            value: amount.toFixed(2)
          },
          description: description || `CAPITUNE - ${invoiceId}`,
          invoice_id: invoiceId
        }],
        application_context: {
          brand_name: 'CAPITUNE',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${import.meta.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/dashboard?payment=success'}`,
          cancel_url: `${import.meta.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/dashboard?payment=cancelled'}`
        }
      })
    });
    
    const order = await response.json();
    
    if (!response.ok) {
      throw new Error(order.message || 'PayPal order creation failed');
    }
    
    return new Response(JSON.stringify(order), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'PayPal order creation failed' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
