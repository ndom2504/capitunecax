import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getNeonSqlClient, hasNeonDatabase, uuid } from '../../../lib/db';

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

function computeFeeNet(gross: number, bps: number) {
  const fee = Math.max(0, Math.round(gross * (bps / 10000) * 100) / 100);
  const net = Math.max(0, Math.round((gross - fee) * 100) / 100);
  return { fee, net };
}

function parseBps(raw: unknown, fallback: number) {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  const bps = Math.round(n);
  if (bps < 0 || bps > 5000) return fallback;
  return bps;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
    const useNeon = !db && hasNeonDatabase();

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

    const platformFeeBpsDefault = getPlatformFeeBps(locals);

    async function upsertPayment(params: {
      kind: string;
      projectId: string;
      userId: string;
      proId?: string;
      quoteId?: string;
      grossAmount: number;
      currency: string;
      status: 'paid' | 'failed' | 'pending';
      method: string;
      reference: string;
      providerEventId: string;
      providerPaymentIntentId?: string;
      providerSessionId?: string;
      metadata: Record<string, unknown>;
      platformFeeBps: number;
    }) {
      const projectId = String(params.projectId ?? '').trim();
      const userId = String(params.userId ?? '').trim();
      if (!projectId || !userId) return;

      const proId = String(params.proId ?? '').trim();
      const quoteId = String(params.quoteId ?? '').trim();
      const providerEventId = String(params.providerEventId ?? '').trim();
      const providerPaymentIntentId = String(params.providerPaymentIntentId ?? '').trim();
      const providerSessionId = String(params.providerSessionId ?? '').trim();

      const grossAmount = Math.round(Number(params.grossAmount ?? 0) * 100) / 100;
      const currency = String(params.currency ?? 'cad').toUpperCase();
      const platformFeeBps = params.platformFeeBps;
      const { fee, net } = proId ? computeFeeNet(grossAmount, platformFeeBps) : { fee: 0, net: grossAmount };

      const status = params.status === 'paid' ? 'paid' : params.status === 'failed' ? 'failed' : 'pending';
      const method = String(params.method ?? '').trim() || 'stripe';
      const kind = String(params.kind ?? '').trim();
      const reference = String(params.reference ?? '').trim();
      const mdJson = JSON.stringify(params.metadata ?? {});

      if (db) {
        const existing = await db
          .prepare(
            `SELECT id FROM payments
             WHERE provider_event_id = ?
                OR provider_session_id = ?
                OR provider_payment_intent_id = ?
                OR reference = ?
             LIMIT 1`,
          )
          .bind(providerEventId, providerSessionId, providerPaymentIntentId, reference)
          .first<{ id: string }>()
          .catch(() => null);

        if (existing?.id) {
          await db
            .prepare(
              `UPDATE payments
               SET status=?, amount=?, currency=?, kind=?, pro_id=?, quote_id=?, platform_fee=?, net_amount=?, verified=?,
                   provider_event_id=?, provider_payment_intent_id=?, provider_session_id=?, metadata=?, updated_at=datetime('now')
               WHERE id=?`,
            )
            .bind(
              status,
              grossAmount,
              currency,
              kind,
              proId,
              quoteId,
              fee,
              net,
              status === 'paid' ? 1 : 0,
              providerEventId,
              providerPaymentIntentId,
              providerSessionId,
              mdJson,
              existing.id,
            )
            .run()
            .catch(() => {});
          return;
        }

        await db
          .prepare(
            `INSERT INTO payments (
              id, project_id, user_id, method, amount, currency, status, reference,
              kind, pro_id, quote_id, platform_fee, net_amount, verified,
              provider_event_id, provider_payment_intent_id, provider_session_id, metadata,
              created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              datetime('now'), datetime('now')
            )`,
          )
          .bind(
            uuid(),
            projectId,
            userId,
            method,
            grossAmount,
            currency,
            status,
            reference,
            kind,
            proId,
            quoteId,
            fee,
            net,
            status === 'paid' ? 1 : 0,
            providerEventId,
            providerPaymentIntentId,
            providerSessionId,
            mdJson,
          )
          .run()
          .catch(() => {});
        return;
      }

      if (!useNeon) return;
      const sql = await getNeonSqlClient();
      if (!sql) return;

      const proUuid = proId ? proId : null;
      const quoteUuid = quoteId ? quoteId : null;
      const mdJsonNeon = JSON.stringify(params.metadata ?? {});
      const existingRows = await sql<{ id: string }>`
        SELECT id::text as id
        FROM payments
        WHERE provider_event_id = ${providerEventId}
           OR provider_session_id = ${providerSessionId}
           OR provider_payment_intent_id = ${providerPaymentIntentId}
           OR reference = ${reference}
        LIMIT 1
      `.catch(() => []);
      const existingId = existingRows?.[0]?.id ?? null;

      if (existingId) {
        await sql`
          UPDATE payments
          SET status=${status}, amount=${grossAmount}, currency=${currency}, kind=${kind},
              pro_id=${proUuid}::uuid, quote_id=${quoteUuid}::uuid,
              platform_fee=${fee}, net_amount=${net}, verified=${status === 'paid'},
              provider_event_id=${providerEventId}, provider_payment_intent_id=${providerPaymentIntentId}, provider_session_id=${providerSessionId},
              metadata=${mdJsonNeon}::jsonb, updated_at=now()
          WHERE id=${existingId}::uuid
        `.catch(() => {});
        return;
      }

      await sql`
        INSERT INTO payments (
          id, project_id, user_id, method, amount, currency, status, reference,
          kind, pro_id, quote_id, platform_fee, net_amount, verified,
          provider_event_id, provider_payment_intent_id, provider_session_id, metadata,
          created_at, updated_at
        ) VALUES (
          ${uuid()}::uuid, ${projectId}::uuid, ${userId}::uuid, ${method}, ${grossAmount}, ${currency}, ${status}, ${reference},
          ${kind}, ${proUuid}::uuid, ${quoteUuid}::uuid, ${fee}, ${net}, ${status === 'paid'},
          ${providerEventId}, ${providerPaymentIntentId}, ${providerSessionId}, ${mdJsonNeon}::jsonb,
          now(), now()
        )
      `.catch(() => {});
    }

    async function maybePostQuotePaymentSideEffects(args: { projectId: string; userId: string; quoteId: string; grossAmount: number; currency: string }) {
      const quoteId = String(args.quoteId ?? '').trim();
      const projectId = String(args.projectId ?? '').trim();
      const userId = String(args.userId ?? '').trim();
      if (!quoteId || !projectId || !userId) return;

      const msg = `✅ Paiement confirmé (${Math.round(args.grossAmount * 100) / 100} ${String(args.currency ?? 'CAD').toUpperCase()}). Votre dossier est maintenant actif.`;

      if (db) {
        await db
          .prepare(`UPDATE project_quotes SET updated_at=datetime('now') WHERE id=?`)
          .bind(quoteId)
          .run()
          .catch(() => {});
        await db
          .prepare(`INSERT INTO messages (id, project_id, user_id, sender, content) VALUES (?, ?, ?, 'bot', ?)`)
          .bind(uuid(), projectId, userId, msg)
          .run()
          .catch(() => {});
        return;
      }

      if (!useNeon) return;
      const sql = await getNeonSqlClient();
      if (!sql) return;
      await sql`UPDATE project_quotes SET updated_at=now() WHERE id=${quoteId}::uuid`.catch(() => {});
      await sql`
        INSERT INTO messages (id, project_id, user_id, sender, content)
        VALUES (${uuid()}::uuid, ${projectId}::uuid, ${userId}::uuid, 'bot', ${msg})
      `.catch(() => {});
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const md = (session.metadata ?? {}) as Record<string, string>;
        const kind = String(md.kind ?? '').trim();
        const projectId = String(md.projectId ?? '').trim();
        const userId = String(md.userId ?? '').trim();
        const proId = String(md.proId ?? '').trim();
        const quoteId = String(md.quoteId ?? '').trim();

        const amountTotal = Number((session.amount_total ?? 0) / 100);
        const currency = String(session.currency ?? 'cad');
        const bps = parseBps(md.platformFeeBps, platformFeeBpsDefault);

        await upsertPayment({
          kind: kind || 'checkout',
          projectId,
          userId,
          proId,
          quoteId,
          grossAmount: amountTotal,
          currency,
          status: 'paid',
          method: 'stripe',
          reference: String(session.payment_intent ?? session.id),
          providerEventId: event.id,
          providerPaymentIntentId: String(session.payment_intent ?? ''),
          providerSessionId: String(session.id ?? ''),
          metadata: {
            stripe: { sessionId: session.id, paymentIntent: session.payment_intent },
            kind,
            quoteId,
            projectId,
            userId,
            proId,
            platformFeeBps: bps,
          },
          platformFeeBps: bps,
        });

        if (kind === 'quote' && quoteId && projectId && userId) {
          await maybePostQuotePaymentSideEffects({ projectId, userId, quoteId, grossAmount: amountTotal, currency });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Payment succeeded:', paymentIntent.id);

        const md = (paymentIntent.metadata ?? {}) as Record<string, string>;
        const kind = String(md.kind ?? '').trim();
        const projectId = String(md.projectId ?? '').trim();
        const userId = String(md.userId ?? '').trim();
        const grossAmount = Number((paymentIntent.amount_received ?? paymentIntent.amount ?? 0) / 100);
        const currency = String(paymentIntent.currency ?? 'cad');
        const bps = parseBps(md.platformFeeBps, platformFeeBpsDefault);

        await upsertPayment({
          kind: kind || 'payment_intent',
          projectId,
          userId,
          proId: String(md.proId ?? ''),
          quoteId: String(md.quoteId ?? ''),
          grossAmount,
          currency,
          status: 'paid',
          method: 'stripe',
          reference: paymentIntent.id,
          providerEventId: event.id,
          providerPaymentIntentId: paymentIntent.id,
          providerSessionId: '',
          metadata: {
            stripe: { paymentIntentId: paymentIntent.id },
            invoiceId: md.invoiceId,
            services: md.services,
            customerEmail: md.customerEmail,
            kind,
            projectId,
            userId,
            proId: md.proId,
            quoteId: md.quoteId,
            platformFeeBps: bps,
          },
          platformFeeBps: bps,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', failedPayment.id);
        const md = (failedPayment.metadata ?? {}) as Record<string, string>;
        await upsertPayment({
          kind: String(md.kind ?? '').trim() || 'payment_intent',
          projectId: String(md.projectId ?? '').trim(),
          userId: String(md.userId ?? '').trim(),
          proId: String(md.proId ?? '').trim(),
          quoteId: String(md.quoteId ?? '').trim(),
          grossAmount: Number((failedPayment.amount ?? 0) / 100),
          currency: String(failedPayment.currency ?? 'cad'),
          status: 'failed',
          method: 'stripe',
          reference: failedPayment.id,
          providerEventId: event.id,
          providerPaymentIntentId: failedPayment.id,
          providerSessionId: '',
          metadata: {
            stripe: { paymentIntentId: failedPayment.id },
            error: failedPayment.last_payment_error?.message ?? null,
            kind: md.kind,
            projectId: md.projectId,
            userId: md.userId,
          },
          platformFeeBps: platformFeeBpsDefault,
        });
        break;
      }

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
