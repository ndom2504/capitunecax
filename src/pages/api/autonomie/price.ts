import type { APIRoute } from 'astro';

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

export const GET: APIRoute = async ({ locals, request }) => {
  const url = new URL(request.url);
  const motifRaw = String(url.searchParams.get('motif') ?? '').trim();

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

  const configuredCurrency =
    locals?.runtime?.env?.PAYMENT_CURRENCY ||
    import.meta.env.PAYMENT_CURRENCY ||
    import.meta.env.PUBLIC_PAYMENT_CURRENCY ||
    (globalThis as any).process?.env?.PAYMENT_CURRENCY ||
    'CAD';

  const currency = String(configuredCurrency || 'CAD').toUpperCase();

  return json({ motif, unit_amount, currency });
};

function getAutonomiePriceCents(motif: Motif, locals: any): number | null {
  const env = locals?.runtime?.env ?? {};
  const penv = (globalThis as any).process?.env ?? {};

  const motifKey = `AUTONOMIE_PRICE_${motif.toUpperCase()}_CENTS`;
  const rawMotif = (env[motifKey] ?? penv[motifKey] ?? (import.meta.env as any)[motifKey]) as unknown;
  const rawDefault =
    (env.AUTONOMIE_PRICE_DEFAULT_CENTS ??
      penv.AUTONOMIE_PRICE_DEFAULT_CENTS ??
      (import.meta.env as any).AUTONOMIE_PRICE_DEFAULT_CENTS) as unknown;

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
