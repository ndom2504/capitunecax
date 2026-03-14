/**
 * POST /api/cv-analyze  — propulsé par Google Gemini
 * Corps : { task, cvText?, targetJob?, suggestions?, service?,
 *           fileBase64?, mimeType?, fileName? }
 *   task    : 'analyze' | 'optimize' | 'cover_letter'
 *   service : 'cv_canada' | 'cv_quebec' | 'cv_etudiant' | 'cv_immigration' | 'cover_letter' | 'letter_ircc'
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { GoogleGenAI, createUserContent, createPartFromBase64 } from '@google/genai';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

const MODEL = 'gemini-2.0-flash';

const SERVICE_CONTEXT: Record<string, string> = {
  cv_canada:      "CV standard canadien, anglais ou français selon la province",
  cv_quebec:      "CV québécois — rédigé en français, marché de l'emploi du Québec",
  cv_etudiant:    "CV étudiant / premier emploi au Canada — valoriser stages et formations",
  cv_immigration: "CV pour dossier immigration canadienne (Entrée Express, PNP) — profil immigration en avant",
  cover_letter:   "Lettre de motivation bilingue pour le marché canadien",
  letter_ircc:    "Lettre d'explication pour Immigration, Réfugiés et Citoyenneté Canada (IRCC)",
};

export const POST: APIRoute = async ({ request, locals }) => {
  const geminiKey = (
    (locals as any).runtime?.env?.GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    ''
  ).trim();

  if (!geminiKey) return json({ error: 'Clé Gemini non configurée (GEMINI_API_KEY)' }, 503);

  let body: {
    task?: string; cvText?: string; targetJob?: string;
    suggestions?: string; service?: string;
    fileBase64?: string; mimeType?: string; fileName?: string;
  } = {};
  try { body = await request.json(); } catch { return json({ error: 'Corps JSON invalide' }, 400); }

  const {
    task        = 'analyze',
    cvText      = '',
    targetJob   = '',
    suggestions = '',
    service     = 'cv_canada',
    fileBase64  = '',
    mimeType    = '',
    fileName    = 'cv',
  } = body;

  const hasFile = !!fileBase64.trim();
  if (!cvText.trim() && !hasFile) return json({ error: 'cvText ou fileBase64 est requis' }, 400);

  const serviceCtx = SERVICE_CONTEXT[service] ?? SERVICE_CONTEXT.cv_canada;

  // ── Prompts ────────────────────────────────────────────────────────────────

  let systemPrompt = '';
  let userMessage  = '';
  let maxTokens    = 900;

  if (task === 'analyze') {
    systemPrompt = `Tu es un expert en recrutement canadien et en analyse ATS (Applicant Tracking System).
Contexte du service : ${serviceCtx}

Analyse ce CV et retourne EXCLUSIVEMENT un objet JSON valide (sans markdown, sans \`\`\`json) :
{
  "name": "Prénom Nom",
  "experience_years": 0,
  "top_skills": ["compétence1", "compétence2", "compétence3"],
  "recommended_programs": ["Entrée Express", "PNP Ontario"],
  "compatibility_score": 75,
  "ats_score": 68,
  "missing_keywords": ["project management", "budgeting", "agile"],
  "suggestions": "Conseils concrets pour améliorer la candidature au Canada."
}`;
    userMessage = `CV à analyser :${targetJob ? '\n\nPoste cible : ' + targetJob : ''}\n\n${cvText}`;
    maxTokens   = 900;

  } else if (task === 'optimize') {
    systemPrompt = `Tu es un expert en rédaction de CV canadien.
Contexte du service : ${serviceCtx}

Transforme ce CV en un CV canadien professionnel. Retourne EXCLUSIVEMENT un objet JSON valide (sans markdown) :
{
  "contact": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "profile": "Résumé professionnel 2-3 lignes",
  "experience": [
    { "company": "", "role": "", "period": "", "location": "", "achievements": ["Résultat chiffré 1"] }
  ],
  "skills": { "technical": ["compétence1"], "soft": ["qualité1"] },
  "education": [{ "school": "", "degree": "", "year": "", "location": "" }],
  "languages": ["Français (natif)", "Anglais (professionnel)"]
}
Règles : max 2 pages, pas de photo/âge/NAS, verbes d'action, résultats chiffrés.`;
    userMessage = `${targetJob ? 'Poste cible : ' + targetJob + '\n' : ''}${suggestions ? 'Suggestions : ' + suggestions + '\n' : ''}CV :\n\n${cvText}`;
    maxTokens   = 2500;

  } else if (task === 'cover_letter') {
    systemPrompt = `Tu es un expert en rédaction de lettres de motivation canadiennes.
Contexte du service : ${serviceCtx}

Rédige une lettre de motivation professionnelle. Retourne EXCLUSIVEMENT un objet JSON valide (sans markdown) :
{
  "subject": "Objet de la lettre",
  "greeting": "Madame, Monsieur,",
  "intro": "Paragraphe d'introduction accrocheur (2-3 phrases)",
  "body": "Corps principal en 2 paragraphes",
  "closing": "Paragraphe de clôture avec appel à l'action",
  "signature": "Veuillez agréer...\n[Prénom Nom]"
}`;
    userMessage = `CV du candidat :${targetJob ? '\n\nPoste visé : ' + targetJob : ''}${suggestions ? '\n\nInfos supplémentaires : ' + suggestions : ''}\n\n${cvText}`;
    maxTokens   = 1200;

  } else {
    return json({ error: `Tâche inconnue : ${task}` }, 400);
  }

  // ── Appel Gemini ──────────────────────────────────────────────────────────

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // Construire les parts de contenu
    const parts: any[] = [];

    // Fichier binaire (PDF ou DOCX) → part inline base64
    if (hasFile) {
      const fileMime = mimeType ||
        (fileName.endsWith('.pdf')  ? 'application/pdf' :
         fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
         'application/octet-stream');
      parts.push(createPartFromBase64(fileBase64, fileMime));
    }

    // Texte du prompt
    parts.push({ text: systemPrompt + '\n\n' + userMessage });

    const result = await ai.models.generateContent({
      model:  MODEL,
      contents: createUserContent(parts),
      config: {
        maxOutputTokens: maxTokens,
        temperature:     0.4,
        responseMimeType: 'application/json',
      },
    });

    const raw = result.text?.trim() ?? '';
    if (!raw) return json({ error: 'Réponse Gemini vide' }, 502);

    // Nettoyer les blocs markdown si présents malgré responseMimeType
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    try   { return json(JSON.parse(cleaned)); }
    catch { return json({ error: 'Réponse non JSON', raw: cleaned }, 502); }

  } catch (err: any) {
    console.error('[cv-analyze] Gemini error:', err?.message ?? err);
    return json({ error: 'Erreur Gemini : ' + (err?.message ?? 'inconnue') }, 502);
  }
};
