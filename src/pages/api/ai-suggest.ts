/**
 * POST /api/ai-suggest
 * Corps : { messages: [{sender, content}][], project?: {type?, province?, pays?} }
 * Retourne : { suggestion: string }
 *
 * Réservé aux admins/pros. Appelle OpenAI pour suggérer une réponse
 * professionnelle au dernier message client, avec contexte immigration CAPITUNE.
 */
import type { APIRoute } from 'astro';
import { getUserFromSessionAny } from '../../lib/db';

// ── Résumé du contexte immigration (system prompt) ───────────────────────────
const IMMIGRATION_CONTEXT = `
Tu es un conseiller expert en immigration canadienne chez CAPITUNE (Export Monde Prestige Inc.), basé à Lévis, Québec.
CAPITUNE accompagne des clients internationaux dans leurs démarches d'immigration au Canada.

Voici les principaux programmes d'immigration que tu maîtrises :

• RÉSIDENCE PERMANENTE (Entrée Express) — Score CRS, FST, EECP, TQF, PNP. Délai ~6-18 mois. Frais gouvernementaux ~1 365-3 500 $ CAD.
• PERMIS DE TRAVAIL — Permis fermé (LMIA), PGWP post-diplôme, permis conjoint. Délai 1-6 mois. Frais ~155 $ CAD.
• ÉTUDES — Permis d'études, DEC/DEP/AEC Québec, universités canadiennes. Délai 2-12 semaines (SDS) ou 2-4 mois. Frais ~150 $ CAD.
• FAMILLE — Parrainage conjoint/parents/enfants. Délai 12-24 mois (conjoint), jusqu'à 24 mois (parents). Frais 1 050 $ CAD.
• TOURISME — AVE (7 $ CAD) ou Visa visiteur (100 $). Délai 72h / 3-4 semaines.
• STATUT RÉFUGIÉ — Protection des réfugiés, délai 21 mois (CISR). Gratuit.
• INVESTISSEUR/ENTREPRENEUR — PNP entrepreneur, visa Start-up. Délai 12-24 mois.

Documents fréquents : passeport valide, résultats linguistiques (IELTS/TEF), évaluation diplômes (WES), casier judiciaire, résultats médicaux.

Ton rôle : aider les clients à comprendre leur situation, les rassurer, et les guider vers les prochaines étapes concrètes.
Toujours répondre en français, de manière professionnelle, chaleureuse et précise.
Réponses courtes à modérées (2-4 phrases max), adaptées à un chat de messagerie.
Ne jamais inventer de délais ou de montants exacts — s'appuyer sur les fourchettes ci-dessus.
`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // ── Vérification authentification admin/pro ──────────────────────────────
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  // On accepte admins et pros (pas les clients)
  const db = ((locals as any).runtime?.env?.DB ?? null);
  const user = await getUserFromSessionAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);
  const role = String((user as any)?.role ?? '');
  const accountType = String((user as any)?.account_type ?? '');
  if (role !== 'admin' && accountType !== 'pro') {
    return json({ error: 'Accès réservé aux professionnels' }, 403);
  }

  // ── Récupération de la clé OpenAI ────────────────────────────────────────
  const openaiKey = (
    (locals as any).runtime?.env?.OPENAI_API_KEY ||
    import.meta.env.OPENAI_API_KEY ||
    ''
  ).trim();
  if (!openaiKey) {
    return json({ error: 'Clé OpenAI non configurée (OPENAI_API_KEY)' }, 503);
  }

  // ── Lecture du corps ──────────────────────────────────────────────────────
  let body: { messages?: { sender: string; content: string }[]; project?: Record<string, string> } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const project = body.project || {};

  if (!rawMessages.length) {
    return json({ error: 'Aucun message fourni' }, 400);
  }

  // ── Construction du contexte projet ──────────────────────────────────────
  const projectLines: string[] = [];
  if (project.type)     projectLines.push(`Type d'immigration visé : ${project.type}`);
  if (project.province) projectLines.push(`Province cible : ${project.province}`);
  if (project.pays)     projectLines.push(`Pays d'origine du client : ${project.pays}`);
  if (project.pack_id)  projectLines.push(`Pack souscrit : ${project.pack_id}`);
  if (project.status)   projectLines.push(`Statut du dossier : ${project.status}`);

  const projectContext = projectLines.length
    ? '\n\nContexte du dossier client :\n' + projectLines.join('\n')
    : '';

  // ── Construction de l'historique pour GPT ────────────────────────────────
  // On garde les 10 derniers messages pour limiter les tokens
  const recentMsgs = rawMessages.slice(-10);

  const chatMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: IMMIGRATION_CONTEXT + projectContext },
    ...recentMsgs.map(m => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    {
      role: 'system',
      content: 'Sur la base de l\'échange ci-dessus, rédige une seule réponse professionnelle et concise (2-4 phrases) au dernier message du client. Réponds directement, sans introduction ni signature.',
    },
  ];

  // ── Appel OpenAI ─────────────────────────────────────────────────────────
  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[ai-suggest] OpenAI error:', aiRes.status, errText);
      return json({ error: 'Erreur OpenAI : ' + aiRes.status }, 502);
    }

    const aiData = await aiRes.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const suggestion = aiData?.choices?.[0]?.message?.content?.trim() || '';
    if (!suggestion) return json({ error: 'Réponse IA vide' }, 502);

    return json({ suggestion });

  } catch (err) {
    console.error('[ai-suggest] fetch error:', err);
    return json({ error: 'Erreur de connexion à OpenAI' }, 502);
  }
};
