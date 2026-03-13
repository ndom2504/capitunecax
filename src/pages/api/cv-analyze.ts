/**
 * POST /api/cv-analyze
 * Corps : { task: 'analyze' | 'optimize', cvText: string, targetJob?: string, suggestions?: string }
 * Retourne :
 *   - analyze  → { name, experience_years, top_skills, recommended_programs, compatibility_score, suggestions }
 *   - optimize → { contact, profile, experience, skills, education, languages }  (format CVPreview)
 *
 * Utilise OpenAI GPT-4o-mini. Accessible sans authentification.
 */
export const prerender = false;

import type { APIRoute } from 'astro';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const openaiKey = (
    (locals as any).runtime?.env?.OPENAI_API_KEY ||
    import.meta.env.OPENAI_API_KEY ||
    ''
  ).trim();

  if (!openaiKey) {
    return json({ error: 'Clé OpenAI non configurée (OPENAI_API_KEY)' }, 503);
  }

  let body: { task?: string; cvText?: string; targetJob?: string; suggestions?: string } = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const { task = 'analyze', cvText = '', targetJob = '', suggestions = '' } = body;

  if (!cvText.trim()) {
    return json({ error: 'cvText est requis' }, 400);
  }

  // ── Prompts selon la tâche ────────────────────────────────────────────────

  const systemPrompt = task === 'optimize'
    ? `Tu es un expert en rédaction de CV canadien. Tu reçois un CV et tu le transformes pour le marché canadien (pas de photo, pas d'âge, format chronologique, chiffrer les réussites, langue de la région).

Retourne EXCLUSIVEMENT un objet JSON valide correspondant exactement à cette structure:
{
  "contact": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "profile": "Résumé professionnel de 2-3 lignes percutant",
  "experience": [
    { "company": "", "role": "", "period": "", "location": "", "achievements": ["Résultat chiffré 1", "Résultat chiffré 2"] }
  ],
  "skills": { "technical": ["compétence1"], "soft": ["qualité1"] },
  "education": [
    { "school": "", "degree": "", "year": "", "location": "" }
  ],
  "languages": ["Français (natif)", "Anglais (professionnel)"]
}
Aucun texte hors du JSON.`
    : `Tu es un expert en immigration canadienne et recrutement. Analyse ce CV et évalue sa compatibilité avec le marché de l'emploi canadien.

Retourne EXCLUSIVEMENT un objet JSON valide avec cette structure:
{
  "name": "Prénom Nom",
  "experience_years": 0,
  "top_skills": ["compétence1", "compétence2"],
  "recommended_programs": ["Entrée Express", "PNP Ontario"],
  "compatibility_score": 75,
  "suggestions": "Conseils concrets pour améliorer la candidature au Canada."
}
Aucun texte hors du JSON.`;

  const userMessage = task === 'optimize'
    ? `CV à transformer pour le marché canadien:
${targetJob ? `\nPoste cible: ${targetJob}` : ''}
${suggestions ? `\nSuggestions à intégrer: ${suggestions}` : ''}

CV original:
${cvText}`
    : `Voici le CV à analyser:\n\n${cvText}`;

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: task === 'optimize' ? 2000 : 800,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[cv-analyze] OpenAI error:', aiRes.status, errText);
      return json({ error: 'Erreur OpenAI : ' + aiRes.status }, 502);
    }

    const aiData = await aiRes.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const raw = aiData?.choices?.[0]?.message?.content?.trim() || '';
    if (!raw) return json({ error: 'Réponse IA vide' }, 502);

    try {
      return json(JSON.parse(raw));
    } catch {
      return json({ error: 'Réponse IA non JSON', raw }, 502);
    }

  } catch (err) {
    console.error('[cv-analyze] fetch error:', err);
    return json({ error: 'Erreur de connexion à OpenAI' }, 502);
  }
};
