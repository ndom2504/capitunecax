import type { APIRoute } from 'astro';

// Route de diagnostic temporaire — À SUPPRIMER après debug
export const GET: APIRoute = async ({ locals }) => {
  const penv = (globalThis as any).process?.env ?? {};
  const stripeRuntime = locals?.runtime?.env?.STRIPE_SECRET_KEY;
  const stripeMeta = import.meta.env.STRIPE_SECRET_KEY;
  const stripeProcess = penv.STRIPE_SECRET_KEY;

  const keys = Object.keys(penv).filter(k =>
    k.includes('STRIPE') || k.includes('AUTONOMIE') || k.includes('DATABASE') || k.includes('PAYMENT')
  );

  return new Response(JSON.stringify({
    runtime_stripe: stripeRuntime ? 'SET ('+String(stripeRuntime).substring(0,8)+'...)' : 'MISSING',
    meta_stripe: stripeMeta ? 'SET ('+String(stripeMeta).substring(0,8)+'...)' : 'MISSING',
    process_stripe: stripeProcess ? 'SET ('+String(stripeProcess).substring(0,8)+'...)' : 'MISSING',
    process_has_keys: keys,
    total_process_keys: Object.keys(penv).length,
    node_env: penv.NODE_ENV,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
