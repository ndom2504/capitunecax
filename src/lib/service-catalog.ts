export type SubService = {
  id: string;
  name: string;
  description: string;
  automated?: boolean;
  price: number;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  subServices: SubService[];
};

export type Package = {
  id: string;
  name: string;
  description: string;
  badge: string;
  price: number;
  services: string[];
  features: string[];
  popular?: boolean;
};

// ─── Services individuels (alignés avec les packs JS du dashboard) ──────────
export const servicesCatalog: readonly Service[] = [
  // ── Services communs ──
  {
    id: 'eval',
    name: 'Évaluation complète du profil',
    description: 'Analyse admissibilité, CRS, points Québec, financière',
    icon: '🔎',
    basePrice: 60,
    subServices: [{ id: 'eval-1', name: 'Évaluation complète du profil', description: 'Analyse admissibilité, CRS', automated: true, price: 60 }],
  },
  {
    id: 'admis',
    name: 'Analyse admissibilité programme',
    description: 'Vérification des critères et conditions du programme ciblé',
    icon: '✅',
    basePrice: 60,
    subServices: [{ id: 'admis-1', name: 'Analyse admissibilité programme', description: 'Vérification critères programme', automated: true, price: 60 }],
  },
  {
    id: 'plan',
    name: "Plan immigration personnalisé",
    description: 'Feuille de route, calendrier, budget prévisionnel',
    icon: '🗺️',
    basePrice: 55,
    subServices: [{ id: 'plan-1', name: "Plan immigration personnalisé", description: 'Feuille de route et calendrier', automated: true, price: 55 }],
  },
  {
    id: 'orient',
    name: 'Orientation programme adapté',
    description: 'Choix du meilleur programme en fonction du profil',
    icon: '🎯',
    basePrice: 50,
    subServices: [{ id: 'orient-1', name: 'Orientation programme adapté', description: 'Choix du programme optimal', price: 50 }],
  },
  {
    id: 'support',
    name: 'Support email 3 mois',
    description: 'Assistance par courriel pendant 3 mois',
    icon: '📧',
    basePrice: 25,
    subServices: [{ id: 'support-1', name: 'Support email 3 mois', description: 'Assistance courriel 3 mois', price: 25 }],
  },
  {
    id: 'montage',
    name: 'Montage complet du dossier',
    description: 'Collecte, structuration et vérification de tous les documents',
    icon: '📁',
    basePrice: 225,
    subServices: [{ id: 'montage-1', name: 'Montage complet du dossier', description: 'Collecte et structuration documents', automated: true, price: 225 }],
  },
  {
    id: 'formu',
    name: 'Formulaires officiels complétés',
    description: 'Remplissage des formulaires IRCC officiels',
    icon: '📝',
    basePrice: 80,
    subServices: [{ id: 'formu-1', name: 'Formulaires officiels complétés', description: 'Formulaires IRCC officiels', automated: true, price: 80 }],
  },
  {
    id: 'verif',
    name: 'Vérification conformité IRCC',
    description: 'Contrôle de conformité du dossier avant soumission',
    icon: '🔏',
    basePrice: 75,
    subServices: [{ id: 'verif-1', name: 'Vérification conformité IRCC', description: 'Contrôle conformité dossier', automated: true, price: 75 }],
  },
  {
    id: 'soumis',
    name: 'Soumission électronique',
    description: 'Dépôt en ligne sur le portail IRCC',
    icon: '📤',
    basePrice: 65,
    subServices: [{ id: 'soumis-1', name: 'Soumission électronique', description: 'Dépôt portail IRCC', automated: true, price: 65 }],
  },
  {
    id: 'suprio',
    name: 'Support prioritaire 6 mois',
    description: 'Assistance prioritaire pendant 6 mois',
    icon: '⭐',
    basePrice: 80,
    subServices: [{ id: 'suprio-1', name: 'Support prioritaire 6 mois', description: 'Assistance prioritaire 6 mois', price: 80 }],
  },
  {
    id: 'suivi',
    name: 'Suivi complet avec les autorités',
    description: 'Gestion des échanges IRCC post-soumission',
    icon: '📅',
    basePrice: 140,
    subServices: [{ id: 'suivi-1', name: 'Suivi complet avec les autorités', description: 'Échanges IRCC post-soumission', automated: true, price: 140 }],
  },
  {
    id: 'repdem',
    name: 'Réponses aux demandes additionnelles',
    description: 'Préparation des réponses aux demandes IRCC',
    icon: '💬',
    basePrice: 100,
    subServices: [{ id: 'repdem-1', name: 'Réponses aux demandes additionnelles', description: 'Réponses IRCC additionnelles', price: 100 }],
  },
  {
    id: 'rechemp',
    name: 'Recherche établissements / employeurs',
    description: 'Identification d\'établissements scolaires ou d\'employeurs',
    icon: '🔍',
    basePrice: 150,
    subServices: [{ id: 'rechemp-1', name: 'Recherche établissements / employeurs', description: 'Recherche employeurs ou écoles', price: 150 }],
  },
  {
    id: 'install',
    name: 'Assistance installation au Canada',
    description: 'Logement, NAS, compte bancaire, services essentiels',
    icon: '🏠',
    basePrice: 100,
    subServices: [{ id: 'install-1', name: 'Assistance installation au Canada', description: 'Logement, NAS, services essentiels', price: 100 }],
  },
  {
    id: 'supvip',
    name: 'Support VIP 7j/7 — 12 mois',
    description: 'Assistance VIP tous les jours pendant 12 mois',
    icon: '👑',
    basePrice: 90,
    subServices: [{ id: 'supvip-1', name: 'Support VIP 7j/7 — 12 mois', description: 'Assistance VIP 12 mois', price: 90 }],
  },
  // ── Services Tourisme ──
  {
    id: 'admis-tour',
    name: 'Analyse admissibilité visa touriste/visiteur',
    description: 'Vérification des critères AVE / TRV',
    icon: '✈️',
    basePrice: 45,
    subServices: [{ id: 'admis-tour-1', name: 'Analyse admissibilité visa touriste/visiteur', description: 'Critères AVE / TRV', automated: true, price: 45 }],
  },
  {
    id: 'montage-tour',
    name: 'Montage dossier visiteur complet (AVE / TRV)',
    description: 'Préparation complète du dossier visiteur',
    icon: '📋',
    basePrice: 70,
    subServices: [{ id: 'montage-tour-1', name: 'Montage dossier visiteur complet (AVE / TRV)', description: 'Dossier visiteur AVE / TRV', automated: true, price: 70 }],
  },
  {
    id: 'lettre-inv',
    name: "Lettre d'invitation professionnelle rédigée",
    description: "Rédaction de la lettre d'invitation officielle",
    icon: '✉️',
    basePrice: 50,
    subServices: [{ id: 'lettre-inv-1', name: "Lettre d'invitation professionnelle rédigée", description: "Lettre d'invitation officielle", price: 50 }],
  },
  {
    id: 'guide-arr',
    name: 'Guide procédures arrivée & frontière CBSA',
    description: 'Instructions pour le passage à la frontière canadienne',
    icon: '🛂',
    basePrice: 40,
    subServices: [{ id: 'guide-arr-1', name: 'Guide procédures arrivée & frontière CBSA', description: 'Passage frontière CBSA', price: 40 }],
  },
  {
    id: 'assist-place',
    name: 'Assistance démarches admin sur place (1 mois)',
    description: 'Appui administratif pendant le premier mois au Canada',
    icon: '🤝',
    basePrice: 45,
    subServices: [{ id: 'assist-place-1', name: 'Assistance démarches admin sur place (1 mois)', description: 'Admin sur place 1 mois', price: 45 }],
  },
  // ── Services Emploi ──
  {
    id: 'admis-emp',
    name: 'Analyse admissibilité permis de travail',
    description: 'Vérification des critères pour le permis de travail',
    icon: '💼',
    basePrice: 70,
    subServices: [{ id: 'admis-emp-1', name: 'Analyse admissibilité permis de travail', description: 'Critères permis de travail', automated: true, price: 70 }],
  },
  {
    id: 'orient-lmia',
    name: 'Orientation LMIA, permis fermé/ouvert',
    description: 'Choix du type de permis et stratégie LMIA',
    icon: '🗺️',
    basePrice: 80,
    subServices: [{ id: 'orient-lmia-1', name: 'Orientation LMIA, permis fermé/ouvert', description: 'Stratégie LMIA et type permis', price: 80 }],
  },
  {
    id: 'montage-emp',
    name: 'Montage complet du dossier permis travail',
    description: 'Collecte et structuration du dossier emploi',
    icon: '📁',
    basePrice: 220,
    subServices: [{ id: 'montage-emp-1', name: 'Montage complet du dossier permis travail', description: 'Dossier permis travail complet', automated: true, price: 220 }],
  },
  {
    id: 'rech-emp',
    name: "Recherche d'employeurs qualifiés avec LMIA",
    description: 'Identification d\'employeurs offrant une LMIA',
    icon: '🔍',
    basePrice: 200,
    subServices: [{ id: 'rech-emp-1', name: "Recherche d'employeurs qualifiés avec LMIA", description: 'Employeurs avec LMIA', price: 200 }],
  },
  {
    id: 'suivi-emp',
    name: 'Suivi dossier & réponses autorités',
    description: 'Suivi du dossier emploi et réponses aux autorités',
    icon: '📅',
    basePrice: 150,
    subServices: [{ id: 'suivi-emp-1', name: 'Suivi dossier & réponses autorités', description: 'Suivi dossier emploi', automated: true, price: 150 }],
  },
  {
    id: 'supp-emp',
    name: 'Support dédié emploi 6 mois',
    description: 'Assistance dédiée emploi pendant 6 mois',
    icon: '⭐',
    basePrice: 80,
    subServices: [{ id: 'supp-emp-1', name: 'Support dédié emploi 6 mois', description: 'Support emploi 6 mois', price: 80 }],
  },
] as const;

// ─── Packs (alignés avec les JS PACKS du dashboard) ─────────────────────────
export const packagesCatalog: readonly Package[] = [
  {
    id: 'tourisme',
    name: 'Pack Tourisme',
    description: 'Visa visiteur & guide sur place',
    badge: '✈️',
    price: 250,
    services: ['admis-tour', 'montage-tour', 'lettre-inv', 'guide-arr', 'assist-place'],
    features: [
      'Analyse admissibilité visa touriste/visiteur',
      'Montage dossier visiteur complet (AVE / TRV)',
      "Lettre d'invitation professionnelle rédigée",
      'Guide procédures arrivée & frontière CBSA',
      'Assistance démarches admin sur place (1 mois)',
    ],
  },
  {
    id: 'emploi',
    name: 'Pack Emploi',
    description: 'Trouver et obtenir un emploi au Canada',
    badge: '💼',
    price: 800,
    services: ['admis-emp', 'orient-lmia', 'montage-emp', 'rech-emp', 'suivi-emp', 'supp-emp'],
    features: [
      'Analyse admissibilité permis de travail',
      'Orientation LMIA, permis fermé/ouvert',
      'Montage complet du dossier permis travail',
      "Recherche d'employeurs qualifiés avec LMIA",
      'Suivi dossier & réponses autorités',
      'Support dédié emploi 6 mois',
    ],
  },
  {
    id: 'essentiel',
    name: 'Pack Essentiel',
    description: 'Pour démarrer votre projet',
    badge: '🥉',
    price: 250,
    services: ['eval', 'admis', 'plan', 'orient', 'support'],
    features: [
      'Évaluation complète du profil',
      'Analyse admissibilité programme',
      "Plan immigration personnalisé",
      'Orientation programme adapté',
      'Support email 3 mois',
    ],
  },
  {
    id: 'standard',
    name: 'Pack Standard',
    description: 'Solution complète et structurée',
    badge: '🥈',
    price: 750,
    services: ['eval', 'admis', 'plan', 'orient', 'montage', 'formu', 'verif', 'soumis', 'suprio'],
    features: [
      'Évaluation complète du profil',
      'Analyse admissibilité programme',
      "Plan immigration personnalisé",
      'Orientation programme adapté',
      'Montage complet du dossier',
      'Formulaires officiels complétés',
      'Vérification conformité IRCC',
      'Soumission électronique',
      'Support prioritaire 6 mois',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Pack Premium',
    description: 'Accompagnement de A à Z',
    badge: '🥇',
    price: 1250,
    services: ['eval', 'admis', 'plan', 'orient', 'montage', 'formu', 'verif', 'soumis', 'suivi', 'repdem', 'rechemp', 'install', 'supvip'],
    features: [
      'Évaluation complète du profil',
      'Analyse admissibilité programme',
      "Plan immigration personnalisé",
      'Orientation programme adapté',
      'Montage complet du dossier',
      'Formulaires officiels complétés',
      'Vérification conformité IRCC',
      'Soumission électronique',
      'Suivi complet avec les autorités',
      'Réponses aux demandes additionnelles',
      'Recherche établissements / employeurs',
      'Assistance installation au Canada',
      'Support VIP 7j/7 — 12 mois',
    ],
  },
] as const;

export function getServiceById(serviceId: string): Service | undefined {
  return servicesCatalog.find((s) => s.id === serviceId);
}

export function getPackageById(packageId: string): Package | undefined {
  return packagesCatalog.find((p) => p.id === packageId);
}

export function getDefaultServiceTotal(serviceId: string): number {
  const service = getServiceById(serviceId);
  if (!service) return 0;
  return service.subServices.reduce((sum, sub) => sum + sub.price, 0);
}
