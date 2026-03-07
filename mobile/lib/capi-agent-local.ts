import kb from './capi-kb.json';

type Project = {
  type?: string;
  province?: string;
  pays?: string;
  langues?: string[];
};

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

export function generateCapiReplyText(message: string, project?: Project | null) {
  const msg = String(message || '').trim();
  const proj = project ?? {};
  const topic = detectTopic(msg, String(proj?.type || '').trim() || undefined);
  const official = officialLinkForTopic(topic);

  const sortieIdeale = pickArray<string>((kb as any)?.role_et_regles?.sortie_ideale, 5);
  const commonSteps = pickArray<string>((kb as any)?.parcours_projet_canada?.etapes_communes, 6);

  let steps: string[] = [];
  let documents: string[] = [];
  let nextAction = 'Si vous me dites votre objectif exact et votre province, je vous propose une checklist personnalisée.';

  if (topic === 'etudes') {
    steps = pickArray<string>((kb as any)?.dossiers_specifiques?.etudes?.etapes_guidage, 6);
    const infoAsk = pickArray<string>((kb as any)?.dossiers_specifiques?.etudes?.informations_a_demander, 4);
    nextAction = infoAsk.length ? `Pour affiner : ${infoAsk.join(' · ')}.` : nextAction;
    documents = [
      "Lettre d'acceptation (établissement désigné / DLI)",
      'Preuves financières (fonds + frais de scolarité)',
      'Passeport valide',
      'Relevés / diplômes',
      "Lettre d'explication (intentions, parcours)",
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
      "Offre d'emploi (si applicable)",
      "CV + preuves d'expérience",
      'Diplômes / certifications',
    ];
  } else if (topic === 'immigration_permanente') {
    steps = commonSteps;
    const infoAsk = pickArray<string>((kb as any)?.dossiers_specifiques?.immigration_permanente?.informations_a_demander, 6);
    nextAction = infoAsk.length ? `Pour estimer les options (sans garantie) : ${infoAsk.slice(0, 5).join(' · ')}.` : nextAction;
    documents = [
      'Passeport valide',
      'Diplômes + relevés',
      "Preuves d'expérience",
      'Tests de langue (selon programme)',
      'Certificats de police (si exigés)',
    ];
  } else if (topic === 'famille') {
    steps = commonSteps;
    documents = [
      'Preuve du lien (mariage/naissance)',
      'Statut du parrain au Canada (citoyen/RP)',
      'Preuves de relation / cohabitation (si conjoint)',
      "Pièces d'identité",
    ];
    nextAction = 'Précisez le lien (conjoint/enfant/parents) et où se trouve la personne parrainée (au Canada ou à l’étranger).';
  } else if (topic === 'refugie') {
    steps = commonSteps;
    documents = [
      "Documents d'identité disponibles",
      'Récit / chronologie des faits',
      'Preuves (si disponibles) : documents, attestations, articles',
    ];
    nextAction = 'Si c’est urgent ou complexe, je recommande un conseiller : dites-moi où vous êtes actuellement (au Canada / hors Canada).';
  } else {
    steps = commonSteps;
    documents = ['Passeport valide', 'Preuves financières', 'Preuves de lien / intention (selon objectif)'];
  }

  if (!steps.length) steps = commonSteps;

  const planHint = sortieIdeale.length
    ? sortieIdeale.join(' · ')
    : 'Résumé · Étapes · Documents · Coûts · Prochaine action';

  return [
    '🤖 Réponse (CAPI — mode autonome)',
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
    `Format conseillé : ${planHint}`,
  ].join('\n');
}
