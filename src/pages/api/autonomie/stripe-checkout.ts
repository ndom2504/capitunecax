import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getUserFromSessionAny } from '../../../lib/db';

const ALLOWED_MOTIFS = [
  'visiter',
  'travailler',
  'etudier',
  'residence_permanente',
  'famille',
  'entreprendre',
  'regularisation',
] as const;

type Motif = (typeof ALLOWED_MOTIFS)[number];

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);

  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return json({ error: 'Non connecté' }, 401);

  // getUserFromSessionAny gère : token hex64 (D1/Neon) + token base64 (fallback sans DB)
  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const stripeKey = (locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY || '').trim();
  const configuredCurrency =
    locals?.runtime?.env?.PAYMENT_CURRENCY ||
    import.meta.env.PAYMENT_CURRENCY ||
    import.meta.env.PUBLIC_PAYMENT_CURRENCY ||
    'CAD';
  const currency = String(configuredCurrency).toLowerCase();

  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const motifRaw = String(body?.motif ?? '').trim();
  if (!motifRaw) return json({ error: 'motif requis' }, 400);
  if (!ALLOWED_MOTIFS.includes(motifRaw as Motif)) return json({ error: 'motif invalide' }, 400);
  const motif = motifRaw as Motif;

  const unit_amount = getAutonomiePriceCents(motif, locals);
  if (!unit_amount) {
    return json(
      {
        error:
          `Tarif Autonomie non configuré pour motif="${motif}". ` +
          `Définir AUTONOMIE_PRICE_${motif.toUpperCase()}_CENTS ou AUTONOMIE_PRICE_DEFAULT_CENTS.`,
      },
      500,
    );
  }

  const origin = new URL(request.url).origin;
  const success_url = `${origin}/autonomie/payment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/autonomie/payment-cancel`;

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: me.email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount,
            product_data: { name: getAutonomieProductName(motif) },
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      metadata: {
        kind: 'autonomie',
        userId: String(me.id),
        motif,
      },
    });

    return json({ url: session.url });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[autonomie/stripe-checkout]', msg);
    return json({ error: 'Erreur Stripe : ' + msg }, 500);
  }
};

function getAutonomieProductName(motif: Motif) {
  const labels: Record<Motif, string> = {
    visiter: 'Visa visiteur',
    travailler: 'Permis de travail',
    etudier: "Permis d'études",
    residence_permanente: 'Résidence permanente',
    famille: 'Regroupement familial',
    entreprendre: 'Entreprendre',
    regularisation: 'Régularisation',
  };
  return `Autonomie guidée — ${labels[motif]}`;
}

function getAutonomiePriceCents(motif: Motif, locals: any): number | null {
  const env = locals?.runtime?.env ?? {};

  const motifKey = `AUTONOMIE_PRICE_${motif.toUpperCase()}_CENTS`;
  const rawMotif = (env[motifKey] ?? (import.meta.env as any)[motifKey]) as unknown;
  const rawDefault = (env.AUTONOMIE_PRICE_DEFAULT_CENTS ?? (import.meta.env as any).AUTONOMIE_PRICE_DEFAULT_CENTS) as unknown;

  const parse = (v: unknown) => {
    const n = Number(String(v ?? '').trim());
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n);
  };

  return parse(rawMotif) ?? parse(rawDefault);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
