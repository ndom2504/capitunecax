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

export const packagesCatalog: readonly Package[] = [
  {
    id: 'essentiel',
    name: 'Pack Essentiel',
    description: 'Pour démarrer votre projet',
    badge: '🥉',
    price: 500,
    services: ['consultation', 'orientation'],
    features: [
      'Évaluation complète du profil',
      "Analyse d'admissibilité",
      "Plan d'immigration personnalisé",
      'Orientation programme adapté',
      'Support par email',
    ],
  },
  {
    id: 'standard',
    name: 'Pack Standard',
    description: 'Solution complète et structurée',
    badge: '🥈',
    price: 1500,
    services: ['consultation', 'orientation', 'dossier'],
    features: [
      'Tout du Pack Essentiel',
      'Montage complet du dossier',
      'Formulaires officiels',
      'Vérification conformité',
      'Soumission électronique',
      'Support prioritaire',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Pack Premium',
    description: 'Accompagnement intégral de A à Z',
    badge: '🥇',
    price: 2500,
    services: ['consultation', 'orientation', 'dossier', 'suivi', 'recherche', 'integration'],
    features: [
      'Tout du Pack Standard',
      'Suivi complet avec les autorités',
      'Réponses aux demandes additionnelles',
      "Recherche d'établissements/employeurs",
      'Assistance installation au Canada',
      'Support VIP 7j/7',
    ],
  },
] as const;

export const servicesCatalog: readonly Service[] = [
  {
    id: 'consultation',
    name: 'Consultation Stratégique',
    description: 'Analyser et définir la meilleure stratégie',
    icon: '🎯',
    basePrice: 250,
    subServices: [
      {
        id: 'eval-complete',
        name: 'Évaluation complète du profil',
        description: 'Analyse admissibilité, CRS, points Québec, financière',
        automated: true,
        price: 150,
      },
      {
        id: 'simulation',
        name: 'Simulation de scénarios',
        description: 'Entrée Express, PNP, Études→RP, Permis→RP',
        price: 100,
      },
      {
        id: 'plan-perso',
        name: "Plan d'immigration personnalisé",
        description: 'Feuille de route, calendrier, budget prévisionnel',
        automated: true,
        price: 150,
      },
      {
        id: 'optimisation',
        name: 'Optimisation du dossier',
        description: 'Stratégie amélioration score, expérience, linguistique',
        price: 100,
      },
    ],
  },
  {
    id: 'orientation',
    name: 'Orientation & Choix du Programme',
    description: 'Choisir le bon programme officiel',
    icon: '🗺️',
    basePrice: 200,
    subServices: [
      {
        id: 'orient-immigration',
        name: 'Orientation Immigration',
        description: 'RP, Immigration Québec, Parrainage, Humanitaire',
        price: 100,
      },
      {
        id: 'orient-etudes',
        name: 'Orientation Études',
        description: 'Choix programme, province, établissement',
        price: 100,
      },
      {
        id: 'orient-travail',
        name: 'Orientation Travail',
        description: 'LMIA, Permis fermé, Permis ouvert',
        price: 100,
      },
      {
        id: 'orient-entrepreneur',
        name: 'Orientation Entrepreneur',
        description: 'Start-up Visa, Investisseur, Travailleur autonome',
        price: 150,
      },
    ],
  },
  {
    id: 'dossier',
    name: 'Montage Complet du Dossier',
    description: 'Préparer et structurer tous les documents',
    icon: '📁',
    basePrice: 600,
    subServices: [
      {
        id: 'prep-admin',
        name: 'Préparation administrative',
        description: 'Formulaires officiels, vérification conformité',
        automated: true,
        price: 200,
      },
      {
        id: 'structuration',
        name: 'Structuration des documents',
        description: 'Classement stratégique, vérification cohérence',
        automated: true,
        price: 150,
      },
      {
        id: 'redaction',
        name: 'Rédaction spécialisée',
        description: "Lettres d'explication, intention, motivation, business plan",
        price: 250,
      },
      {
        id: 'soumission',
        name: 'Soumission électronique',
        description: 'Création compte IRCC, téléversement, vérification finale',
        automated: true,
        price: 200,
      },
    ],
  },
  {
    id: 'suivi',
    name: 'Suivi & Communication',
    description: 'Gérer les échanges avec les autorités',
    icon: '📅',
    basePrice: 400,
    subServices: [
      {
        id: 'suivi-admin',
        name: 'Suivi administratif',
        description: 'Vérification statut, mise à jour dossier',
        automated: true,
        price: 150,
      },
      {
        id: 'reponses',
        name: 'Réponses aux demandes additionnelles',
        description: 'Préparation documents, rédaction réponses',
        price: 200,
      },
      {
        id: 'entrevue',
        name: 'Préparation entrevue',
        description: 'Simulation, coaching personnalisé',
        price: 150,
      },
      {
        id: 'post-soumission',
        name: 'Assistance post-soumission',
        description: 'Biométrie, visite médicale, passeport',
        price: 100,
      },
    ],
  },
  {
    id: 'recherche',
    name: "Recherche d'Institutions",
    description: 'Trouver établissement ou employeur',
    icon: '🔍',
    basePrice: 300,
    subServices: [
      {
        id: 'recherche-ecoles',
        name: 'Recherche établissements scolaires',
        description: 'Collèges, universités, centres professionnels',
        price: 150,
      },
      {
        id: 'recherche-employeurs',
        name: 'Recherche employeurs',
        description: 'Entreprises LMIA, recrutement ciblé',
        price: 200,
      },
      {
        id: 'accomp-admission',
        name: 'Accompagnement admission',
        description: 'Préparation dossier, suivi admission',
        price: 150,
      },
    ],
  },
  {
    id: 'integration',
    name: 'Accueil & Intégration',
    description: 'Installation au Canada',
    icon: '🏠',
    basePrice: 250,
    subServices: [
      {
        id: 'logement',
        name: 'Recherche logement',
        description: 'Aide à la recherche et sélection',
        price: 100,
      },
      {
        id: 'services-base',
        name: 'Services essentiels',
        description: 'Compte bancaire, NAS, assurance maladie',
        price: 100,
      },
      {
        id: 'integration-famille',
        name: 'Intégration famille',
        description: 'Inscription enfants école, coaching installation',
        price: 150,
      },
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
