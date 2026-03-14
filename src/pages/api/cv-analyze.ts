/**
 * POST /api/cv-analyze
 * Corps : { task, cvText, targetJob?, suggestions?, service? }
 *   task    : 'analyze' | 'optimize' | 'cover_letter'
 *   service : 'cv_canada' | 'cv_quebec' | 'cv_etudiant' | 'cv_immigration' | 'letter_ircc'
 *
 * analyze      → { name, experience_years, top_skills, recommended_programs,
 *                  compatibility_score, ats_score, missing_keywords, suggestions }
 * optimize     → format CVPreview complet (contact, profile, experience, skills, education, languages)
 * cover_letter → { subject, greeting, intro, body, closing, signature }
 */
export const prerender = false;

import type { APIRoute } from 'astro';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

const MODEL = 'gpt-4.1-mini';

/** Extraction texte basique depuis un PDF base64 (CVs textuels, non scannés) */
function extractPdfText(b64: string): string {
  try {
    const bin = atob(b64);
    const chunks: string[] = [];

    // Texte dans opérateurs Tj / TJ / ' / "
    const tjRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|\'|\")/g;
    let m: RegExpExecArray | null;
    while ((m = tjRe.exec(bin)) !== null) {
      const t = m[1]
        .replace(/\\n/g, ' ').replace(/\\r/g, '').replace(/\\\\/g, '\\')
        .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
        .replace(/\\./g, '');
      if (t.trim().length > 1) chunks.push(t);
    }

    // Texte dans tableaux TJ  [(text) -200 (text2)] TJ
    const tjArrRe = /\[([^\]]+)\]\s*TJ/g;
    while ((m = tjArrRe.exec(bin)) !== null) {
      const inner = m[1];
      const strRe = /\(([^)]+)\)/g;
      let sm: RegExpExecArray | null;
      while ((sm = strRe.exec(inner)) !== null) {
        chunks.push(sm[1]);
      }
    }

    const result = chunks.join(' ').replace(/\s+/g, ' ').trim();

    // Filtrer les caractères non imprimables / binaires
    return result.replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

const SERVICE_CONTEXT: Record<string, string> = {
  cv_canada:      'CV standard canadien, anglais ou français selon la province',
  cv_quebec:      'CV québécois — rédigé en français, marché de l\'emploi du Québec',
  cv_etudiant:    'CV étudiant / premier emploi au Canada — valoriser stages et formations',
  cv_immigration: 'CV pour dossier immigration canadienne (Entrée Express, PNP) — profil immigration en avant',
  letter_ircc:    'Lettre d\'explication pour Immigration, Réfugiés et Citoyenneté Canada (IRCC)',
};

export const POST: APIRoute = async ({ request, locals }) => {
  const openaiKey = (
    (locals as any).runtime?.env?.OPENAI_API_KEY ||
    import.meta.env.OPENAI_API_KEY ||
    ''
  ).trim();

  if (!openaiKey) return json({ error: 'Clé OpenAI non configurée (OPENAI_API_KEY)' }, 503);

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
  let maxTokens    = 800;

  if (task === 'analyze') {
    systemPrompt = `Tu es un expert en recrutement canadien et en analyse ATS (Applicant Tracking System).
Contexte du service : ${serviceCtx}

Transforme ce CV en analysant sa compatibilité avec le marché canadien.
Retourne EXCLUSIVEMENT un objet JSON valide avec cette structure :
{
  "name": "Prénom Nom",
  "experience_years": 0,
  "top_skills": ["compétence1", "compétence2", "compétence3"],
  "recommended_programs": ["Entrée Express", "PNP Ontario"],
  "compatibility_score": 75,
  "ats_score": 68,
  "missing_keywords": ["project management", "budgeting", "agile"],
  "suggestions": "Conseils concrets pour améliorer la candidature au Canada."
}
Aucun texte hors du JSON.`;
    userMessage = `CV à analyser :\n\n${cvText}${targetJob ? '\n\nPoste cible : ' + targetJob : ''}`;
    maxTokens   = 900;

  } else if (task === 'optimize') {
    systemPrompt = `Tu es un expert en rédaction de CV canadien.
Contexte du service : ${serviceCtx}

Transform this resume into a Canadian-style resume.

Rules:
- Maximum 2 pages
- No photo, no age, no personal details (no SIN, no marital status)
- Focus on achievements and measurable results
- Use action verbs (Led, Increased, Developed, Managed, Achieved…)
- Adapt to Canadian job market standards
- If context is Quebec, write in French

Retourne EXCLUSIVEMENT un objet JSON valide avec cette structure :
{
  "contact": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "profile": "Résumé professionnel de 2-3 lignes percutant",
  "experience": [
    { "company": "", "role": "", "period": "", "location": "", "achievements": ["Résultat chiffré 1", "Résultat chiffré 2"] }
  ],
  "skills": { "technical": ["compétence1"], "soft": ["qualité1"] },
  "education": [{ "school": "", "degree": "", "year": "", "location": "" }],
  "languages": ["Français (natif)", "Anglais (professionnel)"]
}
Aucun texte hors du JSON.`;
    userMessage = `CV à transformer :\n${targetJob ? 'Poste cible : ' + targetJob + '\n' : ''}${suggestions ? 'Suggestions : ' + suggestions + '\n' : ''}\n${cvText}`;
    maxTokens   = 2000;

  } else if (task === 'cover_letter') {
    systemPrompt = `Tu es un expert en rédaction de lettres de motivation canadiennes.
Contexte du service : ${serviceCtx}

Rédige une lettre de motivation professionnelle adaptée au marché canadien.

Retourne EXCLUSIVEMENT un objet JSON valide avec cette structure :
{
  "subject": "Objet de la lettre",
  "greeting": "Madame, Monsieur,",
  "intro": "Paragraphe d'introduction accrocheur (2-3 phrases)",
  "body": "Corps principal en 2 paragraphes développant les compétences clés et l'adéquation au poste",
  "closing": "Paragraphe de clôture avec appel à l'action",
  "signature": "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n[Prénom Nom]"
}
Aucun texte hors du JSON.`;
    userMessage = `CV du candidat :\n${cvText}\n${targetJob ? '\nPoste visé : ' + targetJob : ''}${suggestions ? '\nInformations supplémentaires : ' + suggestions : ''}`;
    maxTokens   = 1200;

  } else {
    return json({ error: `Tâche inconnue : ${task}` }, 400);
  }

  // ── Appel OpenAI ───────────────────────────────────────────────────────────

  try {
    // ── PDF → extraction texte côté serveur ────────────────────────────────
    if (hasFile && mimeType.includes('pdf')) {
      const extracted = extractPdfText(fileBase64);
      if (!extracted || extracted.length < 50) {
        return json({ error: 'Impossible d\'extraire le texte de ce PDF. Assurez-vous que le PDF n\'est pas scanné (image). Convertissez-le en Word/.docx ou copiez-collez le texte.' }, 422);
      }
      // Injecter le texte extrait dans userMessage et utiliser Chat Completions
      const msgWithPdf = userMessage.includes('CV à analyser') || userMessage.includes('CV à transformer') || userMessage.includes('CV du candidat')
        ? userMessage + '\n\n[Texte extrait du PDF] :\n' + extracted.slice(0, 8000)
        : extracted.slice(0, 8000);

      const aiResPdf = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model:           MODEL,
          messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: msgWithPdf }],
          max_tokens:      maxTokens,
          temperature:     0.4,
          response_format: { type: 'json_object' },
        }),
      });
      if (!aiResPdf.ok) {
        const errText = await aiResPdf.text();
        console.error('[cv-analyze] OpenAI PDF error:', aiResPdf.status, errText);
        return json({ error: 'Erreur OpenAI PDF : ' + aiResPdf.status }, 502);
      }
      const aiDataPdf = await aiResPdf.json() as { choices?: { message?: { content?: string } }[] };
      const rawPdf = aiDataPdf?.choices?.[0]?.message?.content?.trim() ?? '';
      if (!rawPdf) return json({ error: 'Réponse IA vide (PDF)' }, 502);
      try { return json(JSON.parse(rawPdf)); }
      catch { return json({ error: 'Réponse IA non JSON', raw: rawPdf }, 502); }
    }

    // Fichier DOCX → extraire texte lisible depuis le XML ZIP
    if (hasFile && (mimeType.includes('word') || fileName.endsWith('.docx'))) {
      // Décode base64 → string brute, extrait contenu des balises <w:t>...</w:t>
      const raw    = atob(fileBase64);
      const chunks = [] as string[];
      const re     = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw)) !== null) chunks.push(m[1]);
      const extracted = chunks.join(' ').trim();
      if (!extracted) return json({ error: 'Impossible d\'extraire le texte du DOCX. Convertissez-le en PDF ou TXT.' }, 422);
      // Relancer avec le texte extrait via Chat Completions
      const aiResD = await fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model:           MODEL,
          messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage.replace(cvText, extracted) }],
          max_tokens:      maxTokens,
          temperature:     0.4,
          response_format: { type: 'json_object' },
        }),
      });
      if (!aiResD.ok) return json({ error: 'Erreur OpenAI DOCX : ' + aiResD.status }, 502);
      const aiDataD = await aiResD.json() as { choices?: { message?: { content?: string } }[] };
      const rawD = aiDataD?.choices?.[0]?.message?.content?.trim() || '';
      if (!rawD) return json({ error: 'Réponse IA vide (DOCX)' }, 502);
      try { return json(JSON.parse(rawD)); }
      catch { return json({ error: 'Réponse IA non JSON', raw: rawD }, 502); }
    }
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model:           MODEL,
        messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        max_tokens:      maxTokens,
        temperature:     0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[cv-analyze] OpenAI error:', aiRes.status, errText);
      return json({ error: 'Erreur OpenAI : ' + aiRes.status }, 502);
    }

    const aiData = await aiRes.json() as { choices?: { message?: { content?: string } }[] };
    const raw = aiData?.choices?.[0]?.message?.content?.trim() || '';
    if (!raw) return json({ error: 'Réponse IA vide' }, 502);

    try { return json(JSON.parse(raw)); }
    catch { return json({ error: 'Réponse IA non JSON', raw }, 502); }

  } catch (err) {
    console.error('[cv-analyze] fetch error:', err);
    return json({ error: 'Erreur de connexion à OpenAI' }, 502);
  }
};
