/**
 * POST /api/quote/checkout — Créer un Checkout Stripe pour payer un devis (côté client)
 * Body: { quote_id }
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase } from '../../../lib/db';
import { isTestEmail } from '../../../lib/test-access';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getPlatformFeeBps(locals: any): number {
  const env = locals?.runtime?.env ?? {};
  const penv = (globalThis as any).process?.env ?? {};
  const raw = env.PLATFORM_FEE_BPS ?? penv.PLATFORM_FEE_BPS ?? (import.meta.env as any).PLATFORM_FEE_BPS;
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return 0;
  const bps = Math.round(n);
  if (bps < 0 || bps > 5000) return 0;
  return bps;
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env | undefined)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  if (isTestEmail(me.email, locals)) {
    return json({ error: 'Paiements désactivés pour ce compte de test.' }, 403);
  }

  const stripeKey = (
    locals?.runtime?.env?.STRIPE_SECRET_KEY ||
    import.meta.env.STRIPE_SECRET_KEY ||
    (globalThis as any).process?.env?.STRIPE_SECRET_KEY ||
    ''
  ).trim();
  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  const body = (await request.json().catch(() => null)) as any;
  const quoteId = String(body?.quote_id ?? '').trim();
  if (!quoteId) return json({ error: 'quote_id manquant' }, 400);

  const platformFeeBps = getPlatformFeeBps(locals);
  const origin = new URL(request.url).origin;
  const success_url = `${origin}/dashboard?quote_payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/dashboard?quote_payment=cancel`;

  try {
    let quote: any = null;
    if (db) {
      quote = await db
        .prepare(
          `SELECT id, project_id, client_id, pro_id, currency, total, status
           FROM project_quotes
           WHERE id = ?
           LIMIT 1`,
        )
        .bind(quoteId)
        .first<any>();
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return json({ error: 'DB non disponible' }, 503);
      const rows = await sql<any>`
        SELECT
          id::text as id,
          project_id::text as project_id,
          client_id::text as client_id,
          pro_id::text as pro_id,
          currency,
          (total::float8) as total,
          status
        FROM project_quotes
        WHERE id = ${quoteId}::uuid
        LIMIT 1
      `;
      quote = rows?.[0] ?? null;
    }

    if (!quote) return json({ error: 'Proposition introuvable' }, 404);
    if (String(quote.client_id) !== String(me.id)) return json({ error: 'Accès refusé' }, 403);

    const total = Number(quote.total ?? 0);
    if (!Number.isFinite(total) || total <= 0) return json({ error: 'Montant invalide' }, 400);

    const currency = String(quote.currency ?? 'CAD').toLowerCase();
    const unit_amount = Math.round(total * 100);

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: me.email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount,
            product_data: {
              name: 'CAPITUNE — Paiement du devis',
            },
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        kind: 'quote',
        quoteId: String(quote.id),
        projectId: String(quote.project_id),
        userId: String(me.id),
        proId: String(quote.pro_id),
        platformFeeBps: String(platformFeeBps),
      },
    });

    return json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[quote/checkout]', msg);
    return json({ error: 'Erreur Stripe : ' + msg }, 500);
  }
};
