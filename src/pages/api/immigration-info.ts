export const prerender = false;

// Base de données statique issue du site officiel immigration.canada.ca
// Utilisée comme fallback rapide + enrichie par ScraperAPI si disponible
const IMMIGRATION_DB: Record<string, {
  label: string;
  emoji: string;
  delai: string;
  delaiDetail: string;
  fraisGouv: string;
  estimation: string;
  documents: string[];
  programmes: string[];
  etapes: string[];
  lien: string;
  linksCA: string[];
}> = {
  rp: {
    label: 'Résidence Permanente — Entrée Express',
    emoji: '🇨🇦',
    delai: '6 à 18 mois',
    delaiDetail: 'Environ 6 mois pour la majorité des demandes FST (objectif IRCC : 80 % en 6 mois). Le tirage Entrée Express a lieu toutes les 2 semaines environ.',
    fraisGouv: '1 365 $ CAD (demandeur principal) + 550 $ par adulte accompagnateur',
    estimation: 'Total gouvernement : ~2 000–3 500 $ CAD selon composition familiale. Sans compter les évaluations externes (WES : ~240 $, tests de langue : ~300–400 $).',
    documents: [
      'Passeport valide (minimum 6 mois après la date d\'arrivée prévue)',
      'Résultats IELTS (General) ou TEF Canada officiel',
      'Évaluation des diplômes étrangers (WES, IQAS ou autre)',
      'Relevés d\'emploi / lettres d\'employeur (3–5 ans)',
      'Certificat de police de tous les pays habités +6 mois',
      'Résultats d\'examen médical (médecin désigné IRCC)',
      'Preuves de fonds disponibles (si sans offre d\'emploi)',
      'Photos identité (normes IRCC)',
      'Offre d\'emploi valide (optional, mais augmente le score CRS)'
    ],
    programmes: [
      'FST - Travailleurs qualifiés fédéraux',
      'EECP - Expérience canadienne',
      'TQF - Travailleurs de métiers spécialisés',
      'PNP - Programmes des candidats des provinces (Ontario, BC, Alberta…)',
      'Atlantic Immigration Program (provinces atlantiques)',
      'Rural and Northern Immigration Pilot'
    ],
    etapes: [
      '1. Créer un profil Entrée Express (score CRS calculé automatiquement)',
      '2. Attendre une Invitation à Présenter une Demande (IPD)',
      '3. Soumettre la demande de RP complète en ligne (90 jours après IPD)',
      '4. Biométrie (si applicable)',
      '5. Entretien médical avec médecin désigné',
      '6. Vérification des antécédents / certificat de police',
      '7. Décision et visa de résident permanent',
      '8. Atterrissage au Canada'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html',
    linksCA: [
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/fonctionnement.html',
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/documents.html'
    ]
  },
  travail: {
    label: 'Permis de travail',
    emoji: '💼',
    delai: '1 à 6 mois',
    delaiDetail: '3–8 semaines pour les demandes en ligne (permis ouvert, PVT). Jusqu\'à 6 mois si LMIA requise (étude du marché du travail ~90 jours pour l\'employeur).',
    fraisGouv: '155 $ CAD (permis de travail) + 100 $ frais de rétablissement si applicable',
    estimation: 'Frais gouvernementaux : 155–555 $ selon le type. LMIA pour l\'employeur : 1 000 $ par poste.',
    documents: [
      'Offre d\'emploi valide de l\'employeur canadien',
      'LMIA approuvée (ou numéro de dispense LMIA)',
      'Passeport valide',
      'CV détaillé et lettres d\'emploi (3–5 dernières années)',
      'Diplômes / certifications selon le poste',
      'Preuves de qualifications / expérience pertinente',
      'Extrait de casier judiciaire (si exigé)',
      'Résultats médicaux (certains secteurs : santé, agriculture)'
    ],
    programmes: [
      'Permis fermé lié à un employeur (avec LMIA)',
      'Permis ouvert post-diplôme (PGWP)',
      'Permis ouvert conjoint de travailleur qualifié',
      'PVT / Exemptions PEQ (Canada–France, jeunes)',
      'Programme Mobilité Internationale (intra-entreprise, accords)',
      'Programme des travailleurs agricoles saisonniers'
    ],
    etapes: [
      '1. L\'employeur publie l\'offre + obtient la LMIA (si requis)',
      '2. Recevoir la lettre d\'offre officielle avec numéro LMIA',
      '3. Soumettre la demande de permis en ligne (IRCC)',
      '4. Biométrie si requis',
      '5. Obtenir le Port of Entry Letter si approuvé',
      '6. Activation du permis à l\'entrée au Canada (CBSA)',
      '7. Travailler sous les conditions du permis'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
    linksCA: [
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis/temporaire/besoin-permis.html',
    ]
  },
  etudes: {
    label: 'Permis d\'études',
    emoji: '🎓',
    delai: '4 à 16 semaines',
    delaiDetail: 'Via SDS (Stream for Direct Students / pays désignés) : 4–8 semaines. Sans SDS : 8–16 semaines. Étudiant hors Canada : plus long si poste consulaire lent.',
    fraisGouv: '150 $ CAD (permis d\'études) + 85 $ (biométrie)',
    estimation: 'Frais gouvernementaux : 235 $ CAD. Fonds nécessaires à prouver : ~10 000 $ CAD/an pour 1 personne (+ frais de scolarité).',
    documents: [
      'Lettre d\'acceptation d\'un établissement désigné (DÉ)',
      'Preuve financière suffisante (10 000 $ + frais de scolarité pour 1 an)',
      'Passeport valide (au-delà de la durée des études)',
      'Photo identité normes IRCC',
      'Lettre d\'explication / intentions de retour',
      'Relevés de notes + diplômes antérieurs',
      'Test de langue si requis (IELTS / DALF pour programmes francophones)',
      'Résultats médicaux (si études > 6 mois dans certains pays)',
      'Formulaires IMM 1294 (étudiant) + IMM 5645 (famille)'
    ],
    programmes: [
      'SDS - Student Direct Stream (pays désignés incluant le Sénégal, Inde, etc.)',
      'Non-SDS (voie standard)',
      'Diplôme d\'études collégiales (DEC) ou universitaires',
      'CAQ (Certificat d\'acceptation du Québec) pour études au Québec',
      'Permis de travail hors campus (20h/semaine pendant les études)'
    ],
    etapes: [
      '1. Choisir l\'établissement et obtenir la lettre d\'acceptation',
      '2. Obtenir le CAQ si études au Québec (+ 20 jours)',
      '3. Soumettre la demande de permis d\'études en ligne',
      '4. Fournir biométrie',
      '5. Passer l\'entretien médical si requis',
      '6. Recevoir l\'approbation + lettre d\'introduction',
      '7. Activation du permis à l\'entrée au Canada'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
    linksCA: [
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/avant-appliquer.html'
    ]
  },
  famille: {
    label: 'Regroupement familial — Parrainage',
    emoji: '👨‍👩‍👧',
    delai: '12 à 24 mois',
    delaiDetail: 'Parrainage conjoint hors Canada : 12 mois (objectif IRCC). Parents et grands-parents : 24–36 mois (programme limité par tirage annuel). Enfants dépendants : similaire au conjoint.',
    fraisGouv: '1 080 $ CAD (traitement dossier conjoint/enfant) + 550 $ (RP du parrainé)',
    estimation: 'Total gouvernemental : ~1 630 $ CAD. Engagement de parrainage sur 3 ans (conjoint) ou 10 ans (parents).',
    documents: [
      'Preuve de statut du parrain (RP ou citoyenneté canadienne)',
      'Preuve du lien familial (acte de mariage, naissance, PACS)',
      'Formulaires IMM 1344 (parrainage) + IMM 0008 (demande RP)',
      'Photos identité des deux parties',
      'Preuves de revenus du parrain (MNI : Mesure du faible revenu)',
      'Certificat de police du parrainé',
      'Examen médical du parrainé',
      'Preuves de relation authentique (photos, communications, preuves financières communes)'
    ],
    programmes: [
      'Parrainage conjoint / partenaire de fait / partenaire conjugal',
      'Parrainage d\'enfants dépendants (< 22 ans)',
      'Parrainage des parents et grands-parents (PGP — loterie annuelle)',
      'Super visa parents (2 ans de séjour, non-immigrant)'
    ],
    etapes: [
      '1. Le parrain soumet la demande de parrainage',
      '2. IRCC approuve l\'admissibilité du parrain',
      '3. Le parrainé soumet la demande de RP',
      '4. Examen médical + certificat de police',
      '5. Vérification biographique par IRCC',
      '6. Approbation et visa de résident permanent',
      '7. Atterrissage au Canada avant l\'expiration du visa RP'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membre-famille.html',
    linksCA: []
  },
  tourisme: {
    label: 'Visa Visiteur / Tourisme',
    emoji: '✈️',
    delai: '2 à 6 semaines',
    delaiDetail: 'AVE (Autorisation de Voyage Électronique) : quasi-instantané si approuvé (quelques minutes à 72h). Visa papier TRV : 2–6 semaines selon la charge consulaire. Séjour maximum : 6 mois (prolongeable).',
    fraisGouv: 'AVE : 7 $ CAD | Visa de visiteur (TRV) : 100 $ CAD',
    estimation: 'Frais totaux légers : 7–100 $ gouvernementaux. Fonds à démontrer : > 2 000–5 000 $ selon durée et famille.',
    documents: [
      'Passeport valide (minimum 6 mois après la fin du séjour prévu)',
      'Photo identité récente (format IRCC)',
      'Preuve de lien avec le pays d\'origine (emploi, propriété, famille)',
      'Preuves financières suffisantes (relevés bancaires 3–6 mois)',
      'Itinéraire de voyage (hôtels, billets d\'avion)',
      'Lettre d\'invitation (si hébergé chez un résident canadien)',
      'Assurance maladie / voyage recommandée',
      'Lettre d\'autorisation de l\'employeur (si salarié)',
      'Preuve de scolarité (si étudiant)'
    ],
    programmes: [
      'AVE — Autorisation de Voyage Électronique (pays exemptés de visa)',
      'TRV — Visa de résident temporaire (pays nécessitant un visa)',
      'Permis de séjour temporaire (PST — cas spéciaux)',
      'Prolongation de séjour depuis le Canada (IMM 5708)',
      'Super Visa (parents et grands-parents, 2 ans de séjour continu)'
    ],
    etapes: [
      '1. Déterminer si vous avez besoin d\'un visa ou d\'une AVE',
      '2. Rassembler les documents (itinéraire, preuves financières, lien au pays)',
      '3. Soumettre la demande en ligne sur le portail IRCC',
      '4. Biométrie si requise (centres de réception canadiens)',
      '5. Patienter la décision consulaire (2–6 semaines)',
      '6. Apposer le visa sur le passeport ou activer l\'AVE',
      '7. Se présenter à la frontière (CBSA) : déclarer le séjour',
      '8. Sur place : respecter les conditions (no travail, durée max 6 mois)'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html',
    linksCA: [
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada/liste-ressortissants-etrangers-visa.html',
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada/eta.html'
    ]
  },
  refugie: {
    label: 'Protection internationale / Réfugié',
    emoji: '🛡️',
    delai: '18 à 36 mois',
    delaiDetail: 'Demande d\'asile en sol canadien : audience devant la CISR généralement 18–36 mois. Programme GAR hors Canada : 12–24 mois depuis le dépôt via HCR.',
    fraisGouv: 'Aucun frais pour demande d\'asile. RP après acceptation : 550 $ CAD',
    estimation: 'Aucun frais de dossier initial. Aide sociale disponible pendant la procédure (ERAR, délibération).',
    documents: [
      'Passeport ou tout document d\'identité disponible',
      'Formulaire FDA (Formulaire de demande d\'asile)',
      'Récit personnel de persécution (Fondement de la Demande d\'Asile)',
      'Preuves de persécution (rapports, articles, attestations)',
      'Preuves d\'identité (acte de naissance, cartes ID)',
      'Certificat médical si applicable'
    ],
    programmes: [
      'Demande d\'asile en territoire canadien (Protection en sol canadien)',
      'GAR — Réfugiés pris en charge par le Gouvernement',
      'PPSR — Programme de parrainage privé de réfugiés',
      'ERAR — Examen des Risques Avant Renvoi (dernier recours)',
      'Programme d\'aide à la réinstallation (PAR)'
    ],
    etapes: [
      '1. Signaler le désir d\'asile dès l\'arrivée (port d\'entrée ou IRCC)',
      '2. Remplir le Formulaire de Demande d\'Asile (FDA)',
      '3. Rédiger le Fondement de la Demande d\'Asile (FDA narratif)',
      '4. Audience devant la Section de la Protection des Réfugiés (SPR)',
      '5. Décision de la CISR',
      '6. Si accepté : demande de RP dans les 180 jours',
      '7. Si refusé : possibilité d\'appel (SAR) ou demande ERAR'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html',
    linksCA: []
  },
  investissement: {
    label: 'Immigration Investisseur / Entrepreneur',
    emoji: '💰',
    delai: '18 à 36 mois',
    delaiDetail: 'Start-up Visa Canada : 12–16 mois en traitement prioritaire. QIIP Québec (suspendu en 2019, potentiellement repris) : 24+ mois. Voies provinciales (Ontario, BC) : 12–24 mois.',
    fraisGouv: '1 575 $ CAD (Start-up Visa) — varie par programme provincial',
    estimation: 'Exigences financières : biens nets > 800 000 $ CAD (historiquement QIIP). Start-up Visa : aucun minimum de fonds propre, mais financement requis par entité désignée.',
    documents: [
      'Preuves de valeur nette (> 300 000–800 000 $ selon programme)',
      'États financiers certifiés',
      'Plan d\'affaires détaillé',
      'Lettre de soutien d\'une entité désignée (Start-up Visa uniquement)',
      'Lettres de référence bancaires',
      'Preuves d\'expérience en gestion (5+ ans)',
      'Passeport + documents familiaux',
      'Certificat de police + examen médical'
    ],
    programmes: [
      'Start-up Visa Canada (actif — entités désignées)',
      'PNP Entrepreneurs (Ontario, BC, Québec, etc.)',
      'Self-Employed Persons Program (arts, sport, ferme)',
      'Visa Agriculteur principal'
    ],
    etapes: [
      '1. Trouver une entité désignée (capital-risque, investisseur providentiel, incubateur)',
      '2. Obtenir l\'engagement de l\'entité',
      '3. Soumettre la demande avec le plan d\'affaires',
      '4. Examen médical + certificat de police',
      '5. Entretien possible avec l\'agent IRCC',
      '6. Approbation + visa RP ou permis de travail transitoire',
      '7. Installation au Canada + lancement de l\'entreprise'
    ],
    lien: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada.html',
    linksCA: [
      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/visa-demarrage.html'
    ]
  }
};

// ScraperAPI key & mapping URL
const SCRAPER_API_KEY = '624751bbf5ddc786bad6c4f31f50d41c';
const URL_MAP: Record<string, string> = {
  rp:           'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html',
  travail:      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
  etudes:       'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
  famille:      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membre-famille.html',
  tourisme:     'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html',
  refugie:      'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html',
  investissement:'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada.html',
};

export async function GET({ url }: { url: URL }) {
  const type = url.searchParams.get('type') || 'rp';
  const live  = url.searchParams.get('live') === '1'; // optionnel : appel ScraperAPI si ?live=1

  const staticData = IMMIGRATION_DB[type] ?? IMMIGRATION_DB['rp'];
  const targetUrl  = URL_MAP[type] ?? URL_MAP['rp'];

  let scraperExcerpt: string | null = null;

  if (live) {
    try {
      const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=false`;
      const resp = await fetch(scraperUrl, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        const html = await resp.text();
        // Extraire le contenu texte brut de la balise <main> ou <article>
        const mainMatch = html.match(/<main[^>]*>([\s\S]{0,8000})<\/main>/i);
        const raw = mainMatch ? mainMatch[1] : html.substring(0, 6000);
        // Nettoyer balises HTML
        scraperExcerpt = raw
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .substring(0, 2500)
          .trim();
      }
    } catch (_) {
      // Ignorer — fallback statique uniquement
    }
  }

  return new Response(
    JSON.stringify({
      type,
      officialUrl: targetUrl,
      data: staticData,
      live: scraperExcerpt ?? null,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
