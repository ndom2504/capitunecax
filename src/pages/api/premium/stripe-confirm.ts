import type { APIRoute } from 'astro';
import Stripe from 'stripe';
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

  const stripeKey = locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const sessionId = String(body?.sessionId ?? '').trim();
  if (!sessionId) return json({ error: 'sessionId requis' }, 400);

  let session: any;
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[stripe-confirm]', msg);
    return json({ error: 'Erreur Stripe : ' + msg }, 500);
  }

  if (!session) return json({ error: 'Session Stripe introuvable' }, 404);
  if (session.payment_status !== 'paid') return json({ error: 'Paiement non confirmé' }, 402);

  const md = session.metadata || {};
  if (md.kind !== 'premium') return json({ error: 'Session invalide' }, 400);
  if (String(md.userId) !== String(me.id)) return json({ error: 'Session non associée à cet utilisateur' }, 403);

  const result = await activatePremiumForUserAny(db, String(me.id));
  return json({ ok: true, premium_expires_at: result.premium_expires_at });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
