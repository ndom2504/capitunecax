/**
 * POST /api/ai-suggest
 * Corps : { messages: [{sender, content}][], project?: {type?, province?, pays?} }
 * Retourne : { suggestion: string }
 *
 * RÃ©servÃ© aux admins/pros. Appelle OpenAI pour suggÃ©rer une rÃ©ponse
 * professionnelle au dernier message client, avec contexte immigration CAPITUNE.
 */
import type { APIRoute } from 'astro';
import { getUserFromSessionAny } from '../../lib/db';

// â”€â”€ RÃ©sumÃ© du contexte immigration (system prompt) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IMMIGRATION_CONTEXT = `
Tu es Capy, l'agent IA exclusif et expert de CAPI (Export Monde Prestige Inc.).

// =========================================================
// 💡 INSTRUCTIONS JENOVA INTÉGRÉES
// =========================================================
# Rôle de l’agent CAPI

Tu es l’agent intelligent de CAPI.

Ta mission est d’aider les utilisateurs à structurer leurs projets liés au Canada de manière claire, méthodique et rassurante.

## Ton rôle
- Comprendre le projet de l’utilisateur
- Identifier le bon parcours
- Donner les étapes à suivre
- Expliquer les coûts probables
- Lister les documents possibles
- Expliquer les délais moyens
- Aider l’utilisateur à gérer sa demande lui-même
- Proposer un conseiller si la situation devient complexe

## Ton ton
- Professionnel
- Clair
- Pédagogique
- Encourageant
- Structuré
- Jamais alarmiste

## Ce que tu dois éviter
- Ne jamais garantir un visa, une admission ou une résidence permanente
- Ne jamais inventer un document officiel
- Ne jamais donner de conseil juridique comme si tu étais avocat ou consultant réglementé
- Toujours présenter les informations comme des estimations, guides ou éléments probables
- Quand une situation est complexe, recommander un conseiller

## Sortie idéale
Toujours répondre avec :
1. Résumé rapide
2. Étapes
3. Documents probables
4. Coûts estimatifs
5. Prochaine action recommandée
// =========================================================

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

Ton rôle : agir comme Capy, aider les clients à comprendre leur situation, les rassurer, et suggérer les prochaines étapes concrètes.
Toujours répondre en français, de manière bienveillante, professionnelle, chaleureuse et précise.
Reste toujours aligné avec la sortie idéale de Capy (Résumé, Étapes, Documents, Coûts, Prochaine action).
`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // â”€â”€ VÃ©rification authentification admin/pro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connectÃ©' }, 401);

  // On accepte admins et pros (pas les clients)
  const db = ((locals as any).runtime?.env?.DB ?? null);
  const user = await getUserFromSessionAny(db, token);
  if (!user) return json({ error: 'Session expirÃ©e' }, 401);
  const role = String((user as any)?.role ?? '');
  const accountType = String((user as any)?.account_type ?? '');
  if (role !== 'admin' && accountType !== 'pro') {
    return json({ error: 'AccÃ¨s rÃ©servÃ© aux professionnels' }, 403);
  }

  // â”€â”€ RÃ©cupÃ©ration de la clÃ© OpenAI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openaiKey = (
    (locals as any).runtime?.env?.OPENAI_API_KEY ||
    import.meta.env.OPENAI_API_KEY ||
    ''
  ).trim();
  if (!openaiKey) {
    return json({ error: 'ClÃ© OpenAI non configurÃ©e (OPENAI_API_KEY)' }, 503);
  }

  // â”€â”€ Lecture du corps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Construction du contexte projet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const projectLines: string[] = [];
  if (project.type)     projectLines.push(`Type d'immigration visÃ© : ${project.type}`);
  if (project.province) projectLines.push(`Province cible : ${project.province}`);
  if (project.pays)     projectLines.push(`Pays d'origine du client : ${project.pays}`);
  if (project.pack_id)  projectLines.push(`Pack souscrit : ${project.pack_id}`);
  if (project.status)   projectLines.push(`Statut du dossier : ${project.status}`);

  const projectContext = projectLines.length
    ? '\n\nContexte du dossier client :\n' + projectLines.join('\n')
    : '';

  // â”€â”€ Construction de l'historique pour GPT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      content: 'Sur la base de l\'Ã©change ci-dessus, rÃ©dige une seule rÃ©ponse professionnelle et concise (2-4 phrases) au dernier message du client. RÃ©ponds directement, sans introduction ni signature.',
    },
  ];

  // â”€â”€ Appel OpenAI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    if (!suggestion) return json({ error: 'RÃ©ponse IA vide' }, 502);

    return json({ suggestion });

  } catch (err) {
    console.error('[ai-suggest] fetch error:', err);
    return json({ error: 'Erreur de connexion Ã  OpenAI' }, 502);
  }
};

