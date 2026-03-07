import type { APIRoute } from 'astro';

import {
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

// KB packagée dans le bundle (compatible Cloudflare Workers)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import kb from '../../../../agent/capitune-kb/capitune-knowledge-base.json';

type Project = {
  type?: string;
  province?: string;
  pays?: string;
  langues?: string[];
};

type Body = {
  message?: string;
  project?: Project | null;
};

type EnvLike = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

async function isPayingUserAny(locals: unknown, sessionToken: string): Promise<boolean> {
  if (!sessionToken) return false;

  const runtimeEnv = (locals as any)?.runtime?.env as any;
  const db = (runtimeEnv?.DB as D1Database | null | undefined) ?? null;
  const useNeon = !db && hasNeonDatabase();

  // Sans DB, on ne peut pas vérifier l'achat autonomie. On autorise seulement les admins.
  if (!db && !useNeon) {
    const basicUser = await getUserFromSessionFullAny(null, sessionToken);
    if (!basicUser) return false;
    const isAdmin = String((basicUser as any)?.role ?? '') === 'admin';
    return isAdmin;
  }

  const user = await getUserFromSessionFullAny(db, sessionToken);
  if (!user) return false;

  const isAdmin = String((user as any)?.role ?? '') === 'admin';
  if (isAdmin) return true;

  // Achat "autonomie" (persisté dans capi_sessions.session_data)
  let sessionData: string | null = null;
  try {
    if (db) {
      const row = await db
        .prepare('SELECT session_data FROM capi_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
        .bind(user.id)
        .first<{ session_data: string }>();
      sessionData = row?.session_data ?? null;
    } else {
      const sql = await getNeonSqlClient();
      if (!sql) return false;
      const rows = await sql<{ session_data: string }>`
        SELECT session_data FROM capi_sessions
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC LIMIT 1
      `;
      sessionData = rows[0]?.session_data ?? null;
    }
  } catch {
    sessionData = null;
  }

  if (!sessionData) return false;
  try {
    const obj = JSON.parse(sessionData) as any;
    return Boolean(obj?.autonomie?.hasPaidAutonomie);
  } catch {
    return false;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;'
  );
}

function pickArray<T>(arr: unknown, max: number): T[] {
  return Array.isArray(arr) ? (arr.slice(0, max) as T[]) : [];
}

function detectTopic(message: string, projectType?: string) {
  const m = message.toLowerCase();
  const contains = (re: RegExp) => re.test(m);

  if (projectType === 'etudes' || contains(/\b(etudes?|études?)\b|\bdli\b|\bcaq\b|\bpermis d'?études?\b/)) return 'etudes';
  if (projectType === 'travail' || contains(/\btravail\b|\blmia\b|\bpgwp\b|\bpermis de travail\b/)) return 'travail';
  if (projectType === 'tourisme' || contains(/\bvisiteur\b|\btourisme\b|\bave\b|\btrv\b|\bvisa visiteur\b/)) return 'visiteur';
  if (projectType === 'famille' || contains(/\bparrain\b|\bfamille\b|\bconjoint\b|\benfants?\b/)) return 'famille';
  if (projectType === 'rp' || contains(/\brp\b|résidence permanente|\bentrée express\b|\bcrs\b|\bpnp\b/)) return 'immigration_permanente';
  if (projectType === 'refugie' || contains(/réfugi|asile|protection/)) return 'refugie';
  return 'general';
}

function officialLinkForTopic(topic: string) {
  const links: Record<string, { label: string; url: string }> = {
    etudes: {
      label: 'Étudier au Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
    },
    travail: {
      label: 'Permis de travail (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
    },
    visiteur: {
      label: 'Visiter le Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html',
    },
    famille: {
      label: 'Parrainer un membre de la famille (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membre-famille.html',
    },
    immigration_permanente: {
      label: 'Immigrer au Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada.html',
    },
    refugie: {
      label: 'Réfugiés et asile (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html',
    },
    general: {
      label: 'Immigration Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete.html',
    },
  };
  return links[topic] || links.general;
}

function toReplyHtmlFromText(text: string, official: { label: string; url: string }) {
  const safe = escHtml(String(text || '').trim());
  return (
    `<div class="msg-bot-section"><strong>🤖 Réponse (CAPI)</strong></div>` +
    `<div class="msg-bot-section" style="white-space:pre-wrap;">${safe}</div>` +
    `<a href="${escHtml(official.url)}" target="_blank" rel="noopener" style="font-size:11px;color:#2980b9;display:block;margin-top:8px;">📎 ${escHtml(official.label)}</a>`
  );
}

async function openAiAnswer(args: {
  apiKey: string;
  model: string;
  message: string;
  project?: Project | null;
  topic: string;
  official: { label: string; url: string };
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  try {
    const projectLines: string[] = [];
    const p = args.project ?? {};
    if (p?.type) projectLines.push(`Type: ${p.type}`);
    if (p?.province) projectLines.push(`Province: ${p.province}`);
    if (p?.pays) projectLines.push(`Pays: ${p.pays}`);
    if (Array.isArray(p?.langues) && p.langues.length) projectLines.push(`Langues: ${p.langues.join(', ')}`);

    const projectContext = projectLines.length ? `\n\nContexte projet:\n${projectLines.join('\n')}` : '';

    const system = [
      'Tu es CAPI, un agent d’orientation pour des démarches liées au Canada.',
      'Réponds toujours en français.',
      'Ne donne jamais de garantie, et ne fournis pas d’avis juridique.',
      'Structure obligatoire de la réponse :',
      '1) Résumé rapide',
      '2) Étapes',
      '3) Documents probables',
      '4) Coûts estimatifs (si pertinent, sinon mentionner que ça varie)',
      '5) Prochaine action recommandée',
      '',
      'Utilise des listes à puces pour Étapes et Documents.',
      'Reste concis (≈ 10-18 lignes).',
    ].join('\n');

    const user = `Question utilisateur:\n${args.message}${projectContext}\n\nLien officiel à rappeler: ${args.official.label} — ${args.official.url}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false as const, error: `OpenAI HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}` };
    }

    const data = (await res.json()) as any;
    const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
    if (!content) return { ok: false as const, error: 'OpenAI réponse vide' };

    return { ok: true as const, replyText: content };
  } catch (e) {
    return { ok: false as const, error: String(e) };
  } finally {
    clearTimeout(timeoutId);
  }
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const message = String(body.message || '').trim();
  if (!message) return json({ error: 'Message vide' }, 400);

  const project = (body.project ?? {}) || {};
  const topic = detectTopic(message, String(project.type || '').trim() || undefined);
  const official = officialLinkForTopic(topic);

  const sortieIdeale = pickArray<string>((kb as any)?.role_et_regles?.sortie_ideale, 5);
  const commonSteps = pickArray<string>((kb as any)?.parcours_projet_canada?.etapes_communes, 6);

  let steps: string[] = [];
  let documents: string[] = [];
  let nextAction = 'Si vous me dites votre objectif exact et votre province, je vous propose une checklist personnalisée.';

  if (topic === 'etudes') {
    steps = pickArray<string>((kb as any)?.dossiers_specifiques?.etudes?.etapes_guidage, 6);
    const infoAsk = pickArray<string>((kb as any)?.dossiers_specifiques?.etudes?.informations_a_demander, 4);
    nextAction = infoAsk.length
      ? `Pour affiner : ${infoAsk.join(' · ')}.`
      : nextAction;
    documents = [
      'Lettre d\'acceptation (établissement désigné / DLI)',
      'Preuves financières (fonds + frais de scolarité)',
      'Passeport valide',
      'Relevés / diplômes',
      'Lettre d\'explication (intentions, parcours)',
    ];
  } else if (topic === 'visiteur') {
    steps = pickArray<string>((kb as any)?.dossiers_specifiques?.visiteur?.etapes, 6);
    documents = pickArray<string>((kb as any)?.dossiers_specifiques?.visiteur?.documents_probables, 7);
    nextAction = 'Dites-moi votre durée prévue et votre pays de résidence : je vous indique AVE vs visa visiteur (TRV) et la liste courte des preuves.';
  } else if (topic === 'travail') {
    steps = commonSteps;
    const qs = pickArray<string>((kb as any)?.dossiers_specifiques?.travail?.questions_a_poser, 4);
    nextAction = qs.length ? `Pour avancer : ${qs.join(' · ')}.` : nextAction;
    documents = [
      'Passeport valide',
      'Offre d\'emploi (si applicable)',
      'CV + preuves d\'expérience',
      'Diplômes / certifications',
    ];
  } else if (topic === 'immigration_permanente') {
    steps = commonSteps;
    const infoAsk = pickArray<string>((kb as any)?.dossiers_specifiques?.immigration_permanente?.informations_a_demander, 6);
    nextAction = infoAsk.length
      ? `Pour estimer les options (sans garantie) : ${infoAsk.slice(0, 5).join(' · ')}.`
      : nextAction;
    documents = [
      'Passeport valide',
      'Diplômes + relevés',
      'Preuves d\'expérience',
      'Tests de langue (selon programme)',
      'Certificats de police (si exigés)',
    ];
  } else if (topic === 'famille') {
    steps = commonSteps;
    documents = [
      'Preuve du lien (mariage/naissance)',
      'Statut du parrain au Canada (citoyen/RP)',
      'Preuves de relation / cohabitation (si conjoint)',
      'Pièces d\'identité',
    ];
    nextAction = 'Précisez le lien (conjoint/enfant/parents) et où se trouve la personne parrainée (au Canada ou à l\'étranger).';
  } else if (topic === 'refugie') {
    steps = commonSteps;
    documents = [
      'Documents d\'identité disponibles',
      'Récit / chronologie des faits',
      'Preuves (si disponibles) : documents, attestations, articles',
    ];
    nextAction = 'Si c\'est urgent ou complexe, je recommande un conseiller : dites-moi où vous êtes actuellement (au Canada / hors Canada).';
  } else {
    steps = commonSteps;
    documents = [
      'Passeport valide',
      'Preuves financières',
      'Preuves de lien / intention (selon objectif)',
    ];
  }

  if (!steps.length) steps = commonSteps;

  const stepsHtml = steps.map((s) => `<li>${escHtml(String(s))}</li>`).join('');
  const docsHtml = documents.map((d) => `<li>${escHtml(String(d))}</li>`).join('');
  const planHint = sortieIdeale.length ? escHtml(sortieIdeale.join(' · ')) : 'Résumé · Étapes · Documents · Coûts · Prochaine action';

  const kbReplyText = [
    '🤖 Réponse (base KB)',
    'Je vous réponds de façon générale (sans garantie ni avis juridique).',
    `Sujet détecté : ${topic.replace(/_/g, ' ')}`,
    '',
    '✅ Étapes',
    ...steps.map((s) => `- ${String(s)}`),
    '',
    '📄 Documents probables',
    ...documents.map((d) => `- ${String(d)}`),
    '',
    '💰 Coûts estimatifs',
    'Les frais varient selon le programme et votre situation; vérifiez toujours sur la page officielle IRCC.',
    '',
    '➡️ Prochaine action',
    String(nextAction),
    '',
    `📎 ${official.label} — ${official.url}`,
    '',
    `Format conseillé : ${sortieIdeale.length ? sortieIdeale.join(' · ') : 'Résumé · Étapes · Documents · Coûts · Prochaine action'}`,
  ].join('\n');

  const kbReplyHtml =
    `<div class="msg-bot-section"><strong>🤖 Réponse (base KB)</strong></div>` +
    `<div class="msg-bot-section" style="font-size:12px;color:#444;">` +
    `Je vous réponds de façon générale (sans garantie ni avis juridique).` +
    `</div>` +
    `<div class="msg-bot-section"><strong>📌 Résumé</strong><br>` +
    `${escHtml(`Sujet détecté : ${topic.replace(/_/g, ' ')}`)}` +
    `</div>` +
    `<div class="msg-bot-section"><strong>✅ Étapes</strong><ul class="msg-bot-list">${stepsHtml}</ul></div>` +
    `<div class="msg-bot-section"><strong>📄 Documents probables</strong><ul class="msg-bot-list">${docsHtml}</ul></div>` +
    `<div class="msg-bot-section"><strong>💰 Coûts estimatifs</strong><br>` +
    `Les frais varient selon le programme et votre situation; vérifiez toujours sur la page officielle IRCC.` +
    `</div>` +
    `<div class="msg-bot-section"><strong>➡️ Prochaine action</strong><br>${escHtml(nextAction)}</div>` +
    `<a href="${escHtml(official.url)}" target="_blank" rel="noopener" style="font-size:11px;color:#2980b9;display:block;margin-top:8px;">📎 ${escHtml(official.label)}</a>` +
    `<div class="msg-bot-section" style="font-size:10px;color:#777;">` +
    `Format conseillé : ${planHint}` +
    `</div>`;

  // --- OpenAI (optionnel) --------------------------------------------------
  // Par sécurité/coûts : OpenAI uniquement pour les utilisateurs payants.
  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value ?? null;
  const sessionToken = bearerToken || cookieToken;
  const hasSession = Boolean(sessionToken);

  const env = (locals.runtime?.env as EnvLike | undefined) ?? undefined;
  const openaiKey = String(env?.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || '').trim();
  const model = String(env?.OPENAI_MODEL || import.meta.env.OPENAI_MODEL || 'gpt-4o-mini').trim();

  const isPaying = hasSession ? await isPayingUserAny(locals, String(sessionToken)) : false;

  if (hasSession && openaiKey && isPaying) {
    const ai = await openAiAnswer({
      apiKey: openaiKey,
      model,
      message,
      project,
      topic,
      official,
    });
    if (ai.ok) {
      const replyText = ai.replyText;
      const replyHtml = toReplyHtmlFromText(replyText, official);
      return json({ replyHtml, replyText, meta: { topic, source: 'openai' } });
    }
    // Si OpenAI échoue, on retombe sur la KB sans faire échouer l’UX.
    return json({ replyHtml: kbReplyHtml, replyText: kbReplyText, meta: { topic, source: 'kb', openaiError: ai.error } });
  }

  return json({ replyHtml: kbReplyHtml, replyText: kbReplyText, meta: { topic, source: 'kb' } });
};

export const GET: APIRoute = async () => {
  return json(
    {
      error: 'Méthode non supportée. Utilisez POST avec un corps JSON.',
      allow: ['POST'],
      exampleBody: {
        message: 'Je veux étudier au Canada, que faire ?',
        project: { type: 'etudes', pays: 'France', province: 'QC' },
      },
    },
    405
  );
};
