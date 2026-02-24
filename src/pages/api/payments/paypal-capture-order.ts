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

    const { orderId } = await request.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    
    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });
    
    const captureData = await response.json();
    
    if (!response.ok) {
      throw new Error(captureData.message || 'PayPal capture failed');
    }
    
    // Here you would save the payment to your database
    // For now, we'll just return the capture data
    
    return new Response(JSON.stringify({
      success: true,
      captureId: captureData.id,
      status: captureData.status,
      data: captureData
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'PayPal capture failed' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
