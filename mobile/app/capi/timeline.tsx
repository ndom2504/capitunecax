import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { CapiAvatar } from '../../components/CapiAvatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import type { CapiMotif, CapiTimelineStep } from '../../lib/api';

type Responsable = 'client' | 'conseiller' | 'gouvernement';

function buildTimeline(motif: CapiMotif, programme?: string, examenMedical?: boolean): CapiTimelineStep[] {
  // ── Feuille de route VISA VISITEUR ───────────────────────────────────────
  if (motif === 'visiter') {
    const steps: CapiTimelineStep[] = [
      {
        id: 'v1',
        titre: 'Analyse d\'admissibilité',
        description: 'Votre conseiller Capitune étudie votre profil, vérifie les critères IRCC et établit une stratégie personnalisée.',
        responsable: 'conseiller',
        dureeEstimee: '2–3 jours',
        documents: [],
        statut: 'a_faire',
      },
      {
        id: 'v2',
        titre: 'Collecte des documents',
        description: 'Rassemblez tous les documents requis : passeport, photos, relevés bancaires, preuves d\'emploi, lettre d\'invitation si applicable.',
        responsable: 'client',
        dureeEstimee: '1–2 semaines',
        documents: ['Passeport valide (+ 6 mois)', 'Photos format immigration', 'Relevés bancaires 6 mois', 'Preuve d\'emploi / revenus', 'Preuve de logement au Canada'],
        statut: 'a_faire',
      },
      {
        id: 'v3',
        titre: 'Biométrie (CRDV)',
        description: 'Rendez-vous au Centre de réception des demandes de visa pour vos empreintes digitales et photo biométrique.',
        responsable: 'client',
        dureeEstimee: '1 journée',
        documents: ['Lettre de convocation biométrie', 'Pièce d\'identité valide'],
        statut: 'a_faire',
      },
      ...(examenMedical ? [{
        id: 'v4',
        titre: 'Examen médical',
        description: 'Rendez-vous chez un médecin agréé par l\'IRCC. Obligatoire pour les séjours de plus de 6 mois.',
        responsable: 'client' as const,
        dureeEstimee: '3–5 jours',
        documents: ['Liste des médecins agréés IRCC'],
        statut: 'a_faire' as const,
      }] : []),
      {
        id: 'v5',
        titre: 'Soumission de la demande',
        description: 'Votre conseiller Capitune dépose officiellement votre demande de visa visiteur (IMM5257) auprès de l\'IRCC.',
        responsable: 'conseiller',
        dureeEstimee: '1 jour',
        documents: ['Formulaire IMM5257 complété', 'Lettre d\'explication', 'Tous documents collectés'],
        statut: 'a_faire',
      },
      {
        id: 'v6',
        titre: 'Traitement par l\'IRCC',
        description: 'Le gouvernement canadien analyse votre demande. Des informations complémentaires peuvent être demandées.',
        responsable: 'gouvernement',
        dureeEstimee: '2–8 semaines',
        documents: [],
        statut: 'a_faire',
      },
      {
        id: 'v7',
        titre: 'Envoi du passeport',
        description: 'En cas d\'approbation, vous envoyez votre passeport au CRDV pour apposition du visa.',
        responsable: 'client',
        dureeEstimee: '3–5 jours',
        documents: ['Passeport original'],
        statut: 'a_faire',
      },
      {
        id: 'v8',
        titre: 'Réception visa & préparation voyage',
        description: 'Votre passeport avec le visa vous est retourné. Capitune vous accompagne dans la préparation du voyage.',
        responsable: 'conseiller',
        dureeEstimee: '1 semaine',
        documents: ['Visa apposé sur passeport', 'Assurance voyage', 'Billet aller-retour confirmé'],
        statut: 'a_faire',
      },
    ];
    return steps;
  }

  // ── Feuille de route TRAVAILLER ──────────────────────────────────────────
  if (motif === 'travailler') {
    return [
      { id: 'w1', titre: 'Analyse d\'admissibilité', description: 'Vérification de l\'offre d\'emploi, du NOC, des exemptions EIMT et choix du type de permis.', responsable: 'conseiller', dureeEstimee: '2–3 jours', documents: [], statut: 'a_faire' },
      { id: 'w2', titre: 'Collecte des documents', description: 'Passeport, offre d\'emploi signée, diplômes, lettres de référence et relevés bancaires.', responsable: 'client', dureeEstimee: '1–2 semaines', documents: ['Passeport valide', 'Offre d\'emploi signée', 'Diplômes / attestations'], statut: 'a_faire' },
      { id: 'w3', titre: 'Vérification de l\'offre d\'emploi', description: 'Contrôle de la conformité de l\'offre (NOC, salaire, conditions de travail) avant soumission.', responsable: 'conseiller', dureeEstimee: '2–3 jours', documents: [], statut: 'a_faire' },
      { id: 'w4', titre: 'EIMT — si requis', description: 'L\'employeur dépose une demande EIMT auprès d\'ESDC si aucune exemption ne s\'applique.', responsable: 'gouvernement', dureeEstimee: '30–45 jours', documents: ['Formulaire EIMT', 'Preuve de recrutement'], statut: 'a_faire' },
      { id: 'w5', titre: 'Rendez-vous biométrie (CRDV)', description: 'Collecte des données biométriques au centre désigné le plus proche.', responsable: 'client', dureeEstimee: '1 jour', documents: ['Convocation biométrie', 'Pièce d\'identité'], statut: 'a_faire' },
      { id: 'w6', titre: 'Soumission de la demande', description: 'Dépôt officiel du permis de travail auprès de l\'IRCC.', responsable: 'conseiller', dureeEstimee: '1 jour', documents: [], statut: 'a_faire' },
      { id: 'w7', titre: 'Traitement IRCC', description: 'L\'IRCC étudie votre demande. Des informations complémentaires peuvent être demandées.', responsable: 'gouvernement', dureeEstimee: '4–12 semaines', documents: [], statut: 'a_faire' },
      { id: 'w8', titre: 'Réception du permis & arrivée', description: 'Réception du permis de travail et préparation de l\'arrivée au Canada.', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Permis de travail', 'Billet d\'avion'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route ÉTUDIER ─────────────────────────────────────────────
  if (motif === 'etudier') {
    return [
      { id: 'e1', titre: 'Analyse d\'admissibilité', description: 'Vérification du DLI, éligibilité au permis d\'études, stratégie SDE ou dossier ordinaire.', responsable: 'conseiller', dureeEstimee: '2–3 jours', documents: [], statut: 'a_faire' },
      { id: 'e2', titre: 'Lettre d\'acceptation', description: 'Obtention de la lettre d\'acceptation officielle de l\'établissement d\'enseignement désigné (DLI).', responsable: 'client', dureeEstimee: 'Variable', documents: ['Lettre d\'acceptation DLI'], statut: 'a_faire' },
      { id: 'e3', titre: 'CAQ — si études au Québec', description: 'Demande du Certificat d\'acceptation du Québec (obligatoire avant le permis fédéral).', responsable: 'conseiller', dureeEstimee: '3–5 semaines', documents: ['Formulaire CAQ', 'Lettre d\'acceptation'], statut: 'a_faire' },
      { id: 'e4', titre: 'Collecte des documents', description: 'Passeport, lettre d\'acceptation, relevés de notes, preuves financières et CAQ si applicable.', responsable: 'client', dureeEstimee: '1–2 semaines', documents: ['Passeport valide', 'Diplômes / relevés', 'Preuve de fonds'], statut: 'a_faire' },
      { id: 'e5', titre: 'Rendez-vous biométrie (CRDV)', description: 'Collecte des données biométriques au centre désigné le plus proche.', responsable: 'client', dureeEstimee: '1 jour', documents: ['Convocation biométrie'], statut: 'a_faire' },
      { id: 'e6', titre: 'Examen médical — si requis', description: 'Examen chez un médecin désigné IRCC (obligatoire si programme > 6 mois dans certains pays).', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Résultats examen médical'], statut: 'a_faire' },
      { id: 'e7', titre: 'Soumission de la demande', description: 'Dépôt officiel du permis d\'études via le SDE ou dossier papier.', responsable: 'conseiller', dureeEstimee: '1 jour', documents: [], statut: 'a_faire' },
      { id: 'e8', titre: 'Traitement IRCC', description: 'L\'IRCC traite votre demande. Des informations complémentaires peuvent être demandées.', responsable: 'gouvernement', dureeEstimee: '3–8 sem. (SDE) / 8–12 sem. (ordinaire)', documents: [], statut: 'a_faire' },
      { id: 'e9', titre: 'Préparation du départ', description: 'Réception du permis, billets, assurance santé et préparation logistique.', responsable: 'client', dureeEstimee: '2 semaines', documents: ['Permis d\'études', 'Billet d\'avion', 'Assurance santé'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route RÉSIDENCE PERMANENTE ────────────────────────────────
  if (motif === 'residence_permanente') {
    return [
      { id: 'r1', titre: 'Analyse du score CRS', description: 'Calcul du score CRS, identification du volet Express Entry ou PNP optimal.', responsable: 'conseiller', dureeEstimee: '3–5 jours', documents: [], statut: 'a_faire' },
      { id: 'r2', titre: 'Tests de langue (IELTS / TEF)', description: 'Passage des tests officiels de lange pour maximiser le score CRS.', responsable: 'client', dureeEstimee: '2–4 semaines', documents: ['Résultats IELTS ou TEF'], statut: 'a_faire' },
      { id: 'r3', titre: 'Évaluation des diplômes (WES)', description: 'Démarche WES ou équivalent pour la reconnaissance des titres étrangers.', responsable: 'client', dureeEstimee: '5–7 semaines', documents: ['Rapport WES ou équivalent'], statut: 'a_faire' },
      { id: 'r4', titre: 'Création du profil Express Entry', description: 'Création et optimisation du profil dans le système Express Entry IRCC.', responsable: 'conseiller', dureeEstimee: '1 semaine', documents: ['Profil EE créé'], statut: 'a_faire' },
      { id: 'r5', titre: 'Collecte des documents', description: 'Rassembler passeport, relevés d\'emploi, casier judiciaire, preuves de fonds et autres pièces.', responsable: 'client', dureeEstimee: '2–4 semaines', documents: ['Passeport', 'Relevés d\'emploi', 'Casier judiciaire', 'Preuves de fonds'], statut: 'a_faire' },
      { id: 'r6', titre: 'Invitation à présenter une demande (ITA)', description: 'Attente d\'une invitation lors d\'un tirage Express Entry ou nomination PNP.', responsable: 'gouvernement', dureeEstimee: 'Variable (selon tirage)', documents: [], statut: 'a_faire' },
      { id: 'r7', titre: 'Préparation du dossier RP complet', description: 'Montage et vérification du dossier RP suite à la réception de l\'ITA.', responsable: 'conseiller', dureeEstimee: '2–3 semaines', documents: ['Formulaires IMM', 'Photos d\'identité'], statut: 'a_faire' },
      { id: 'r8', titre: 'Examen médical', description: 'Examen obligatoire chez un médecin désigné IRCC.', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Résultats examen médical'], statut: 'a_faire' },
      { id: 'r9', titre: 'Soumission de la demande RP', description: 'Dépôt officiel du dossier complet de résidence permanente.', responsable: 'conseiller', dureeEstimee: '1 jour', documents: [], statut: 'a_faire' },
      { id: 'r10', titre: 'Traitement gouvernemental', description: 'IRCC étudie le dossier. Des vérifications de sécurité et des demandes d\'informations peuvent intervenir.', responsable: 'gouvernement', dureeEstimee: '6–18 mois', documents: [], statut: 'a_faire' },
      { id: 'r11', titre: 'Décision et confirmation RP', description: 'Réception de la décision. En cas d\'approbation, confirmation de la résidence permanente.', responsable: 'gouvernement', dureeEstimee: '1–2 mois', documents: ['Lettre d\'approbation', 'Confirmation de RP (CoPR)'], statut: 'a_faire' },
      { id: 'r12', titre: 'Arrivée & formalités RP', description: 'Confirmation de l\'entrée comme résident permanent, carte RP, démarches administratives.', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Carte de résident permanent', 'Confirmation d\'entrée'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route FAMILLE ─────────────────────────────────────────────
  if (motif === 'famille') {
    return [
      { id: 'f1', titre: 'Analyse admissibilité parrainage', description: 'Vérification du statut du parrain (RP ou citoyen), capacité financière et éligibilité.', responsable: 'conseiller', dureeEstimee: '2–3 jours', documents: [], statut: 'a_faire' },
      { id: 'f2', titre: 'Collecte documents — parrain', description: 'Preuves de statut, déclarations de revenus, état financier du parrain.', responsable: 'client', dureeEstimee: '1–2 semaines', documents: ['Preuve de statut', 'Déclarations de revenus (3 ans)'], statut: 'a_faire' },
      { id: 'f3', titre: 'Collecte documents — parrainé', description: 'Passeport, acte de naissance, acte de mariage, preuves de relation.', responsable: 'client', dureeEstimee: '2–4 semaines', documents: ['Passeport parrainé', 'Acte de mariage / naissance', 'Preuves de relation'], statut: 'a_faire' },
      { id: 'f4', titre: 'Examen médical — parrainé', description: 'Examen obligatoire chez un médecin désigné IRCC (pour la personne parrainée).', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Résultats examen médical'], statut: 'a_faire' },
      { id: 'f5', titre: 'Préparation du dossier complet', description: 'Montage des formulaires parrain + parrainé (IMM 1344, IMM 5532, etc.).', responsable: 'conseiller', dureeEstimee: '2 semaines', documents: ['Formulaires IMM', 'Engagement de parrainage'], statut: 'a_faire' },
      { id: 'f6', titre: 'Soumission parrainage + RP', description: 'Dépôt simultané du dossier de parrainage et de la demande de RP du parrainé.', responsable: 'conseiller', dureeEstimee: '1 jour', documents: [], statut: 'a_faire' },
      { id: 'f7', titre: 'Traitement — volet parrainage', description: 'IRCC vérifie l\'admissibilité du parrain.', responsable: 'gouvernement', dureeEstimee: '1–2 mois', documents: [], statut: 'a_faire' },
      { id: 'f8', titre: 'Traitement — volet RP parrainé', description: 'IRCC traite la demande de RP de la personne parrainée (vérifications, sécurité, etc.).', responsable: 'gouvernement', dureeEstimee: '10–18 mois', documents: [], statut: 'a_faire' },
      { id: 'f9', titre: 'Décision & entrée au Canada', description: 'Réception de la décision, confirmation RP, arrivée et formalités.', responsable: 'gouvernement', dureeEstimee: '1 mois', documents: ['Confirmation de RP', 'Billet d\'avion'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route ENTREPRENDRE ────────────────────────────────────────
  if (motif === 'entreprendre') {
    return [
      { id: 'b1', titre: 'Analyse admissibilité entrepreneur', description: 'Évaluation du profil, du projet d\'affaires et identification de l\'organisme désigné adapté.', responsable: 'conseiller', dureeEstimee: '3–5 jours', documents: [], statut: 'a_faire' },
      { id: 'b2', titre: 'Rédaction du plan d\'affaires', description: 'Rédaction ou révision d\'un business plan solide avec projections financières sur 5 ans.', responsable: 'client', dureeEstimee: '4–8 semaines', documents: ['Plan d\'affaires', 'Projections financières', 'Étude de marché'], statut: 'a_faire' },
      { id: 'b3', titre: 'Démarches auprès de l\'organisme désigné', description: 'Prise de contact et présentation du projet à des incubateurs, anges ou capital-risqueurs reconnus IRCC.', responsable: 'client', dureeEstimee: '4–12 semaines', documents: ['Pitch deck', 'Résumé exécutif'], statut: 'a_faire' },
      { id: 'b4', titre: 'Lettre d\'appui obtenue', description: 'Signature de la lettre d\'appui par l\'organisme désigné — étape clé pour le SUV.', responsable: 'client', dureeEstimee: 'Variable', documents: ['Lettre d\'appui officielle'], statut: 'a_faire' },
      { id: 'b5', titre: 'Collecte des documents', description: 'Passeport, preuves de fonds, résultats de langue, casier judiciaire.', responsable: 'client', dureeEstimee: '2 semaines', documents: ['Passeport', 'Preuves de fonds', 'Résultats CLB', 'Casier judiciaire'], statut: 'a_faire' },
      { id: 'b6', titre: 'Examen médical', description: 'Examen obligatoire chez un médecin désigné IRCC.', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Résultats examen médical'], statut: 'a_faire' },
      { id: 'b7', titre: 'Soumission dossier SUV / provincial', description: 'Dépôt officiel de la demande auprès d\'IRCC.', responsable: 'conseiller', dureeEstimee: '1 semaine', documents: [], statut: 'a_faire' },
      { id: 'b8', titre: 'Traitement gouvernemental', description: 'IRCC examine le dossier. Des informations complémentaires peuvent être demandées.', responsable: 'gouvernement', dureeEstimee: '12–24 mois', documents: [], statut: 'a_faire' },
      { id: 'b9', titre: 'Décision & installation', description: 'Réception de la décision, confirmation RP, arrivée et démarrage d\'entreprise.', responsable: 'conseiller', dureeEstimee: '1 mois', documents: ['Confirmation de RP', 'Immatriculation entreprise'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route RÉGULARISATION ──────────────────────────────────────
  if (motif === 'regularisation') {
    return [
      { id: 'h1', titre: 'Consultation urgente', description: 'Évaluation immédiate de la situation, options légales disponibles et plan d\'action prioritaire.', responsable: 'conseiller', dureeEstimee: '1–2 jours', documents: [], statut: 'a_faire' },
      { id: 'h2', titre: 'Analyse de situation & options', description: 'Étude approfondie du dossier, identification des motifs H&C et choix de la procédure adaptée.', responsable: 'conseiller', dureeEstimee: '3–5 jours', documents: [], statut: 'a_faire' },
      { id: 'h3', titre: 'Collecte des preuves d\'établissement', description: 'Rassembler toutes les preuves d\'établissement au Canada (bail, emploi, école, bénévolat, etc.).', responsable: 'client', dureeEstimee: '2–4 semaines', documents: ['Bail ou preuve de résidence', 'Preuve d\'emploi / bénévolat', 'Relevés scolaires des enfants'], statut: 'a_faire' },
      { id: 'h4', titre: 'Préparation du dossier H&C / ERAR', description: 'Montage du dossier de régularisation, déclaration personnelle et preuve de difficultés exceptionnelles.', responsable: 'conseiller', dureeEstimee: '2–4 semaines', documents: ['Formulaire IMM 5283', 'Déclaration personnelle', 'Rapport psychologique si applicable'], statut: 'a_faire' },
      { id: 'h5', titre: 'Examen médical — si requis', description: 'Examen chez un médecin désigné IRCC si la régularisation mène à la RP.', responsable: 'client', dureeEstimee: '1 semaine', documents: ['Résultats examen médical'], statut: 'a_faire' },
      { id: 'h6', titre: 'Soumission de la demande', description: 'Dépôt officiel du dossier H&C ou ERAR auprès d\'IRCC.', responsable: 'conseiller', dureeEstimee: '1 jour', documents: [], statut: 'a_faire' },
      { id: 'h7', titre: 'Traitement gouvernemental', description: 'IRCC examine le dossier. Des informations complémentaires ou une audition peuvent être requises.', responsable: 'gouvernement', dureeEstimee: '12–36 mois selon le type', documents: [], statut: 'a_faire' },
      { id: 'h8', titre: 'Décision & prochaines étapes', description: 'Réception de la décision IRCC et accompagnement dans la suite du processus.', responsable: 'gouvernement', dureeEstimee: 'Variable', documents: ['Lettre de décision IRCC'], statut: 'a_faire' },
    ];
  }

  // ── Feuille de route générique (fallback) ────────────────────────────────
  const base: CapiTimelineStep[] = [
    {
      id: 't1',
      titre: 'Analyse stratégique',
      description: 'Étude complète de votre profil, évaluation des critères et sélection de la meilleure voie.',
      responsable: 'conseiller',
      dureeEstimee: '3–5 jours',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't2',
      titre: 'Collecte des documents',
      description: 'Réunir et faire certifier tous les documents requis : état civil, diplômes, preuves d\'emploi.',
      responsable: 'client',
      dureeEstimee: '2–4 semaines',
      documents: ['Passeport valide', 'Diplômes certifiés', 'Relevés de notes', 'Preuve d\'emploi', 'Extrait de casier judiciaire'],
      statut: 'a_faire',
    },
    {
      id: 't3',
      titre: 'Préparation et vérification du dossier',
      description: 'Révision complète du dossier, correction des lacunes, traductions si nécessaire.',
      responsable: 'conseiller',
      dureeEstimee: '1–2 semaines',
      documents: ['Formulaires gouvernementaux', 'Traductions certifiées'],
      statut: 'a_faire',
    },
    {
      id: 't4',
      titre: 'Soumission de la demande',
      description: 'Dépôt officiel auprès de l\'IRCC ou du Québec selon votre programme.',
      responsable: 'conseiller',
      dureeEstimee: '1–2 jours',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't5',
      titre: 'Traitement gouvernemental',
      description: 'L\'autorité compétente étudie votre demande. Des informations complémentaires peuvent être demandées.',
      responsable: 'gouvernement',
      dureeEstimee: motif === 'travailler' ? '1–6 mois' : '6–24 mois',
      documents: [],
      statut: 'a_faire',
    },
    {
      id: 't6',
      titre: 'Décision finale',
      description: 'Réception de l\'approbation (ou refus). En cas d\'approbation, préparation à l\'arrivée.',
      responsable: 'gouvernement',
      dureeEstimee: '1–3 jours',
      documents: ['Visa / permis / résidence', 'Lettre d\'approbation'],
      statut: 'a_faire',
    },
    {
      id: 't7',
      titre: 'Installation au Canada',
      description: 'Accompagnement à l\'arrivée, logement, banque, NAS, assurance et intégration.',
      responsable: 'conseiller',
      dureeEstimee: '2–4 semaines',
      documents: [],
      statut: 'a_faire',
    },
  ];
  return base;
}

const RESP_CFG: Record<Responsable, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  client:       { label: 'Vous', color: '#3b82f6', icon: 'person' },
  conseiller:   { label: 'Votre conseiller', color: Colors.orange, icon: 'briefcase' },
  gouvernement: { label: 'Gouvernement', color: '#8b5cf6', icon: 'business' },
};

export default function CapiTimelineScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const motif = session.motif ?? 'visiter';
  const examenMedical =
    session.evaluation?.visiteurPlan?.examenMedical ??
    session.evaluation?.motifPlan?.examenMedical ??
    false;
  const steps = buildTimeline(motif, session.programme, examenMedical);

  const next = () => {
    const timeline = steps;
    updateSession({ timeline, step: 7 });
    router.push('/capi/conseiller');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '75%' }]} />
        </View>
        <Text style={styles.stepLabel}>6 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Voici votre <Text style={{ fontWeight: '700', color: Colors.orange }}>feuille de route</Text> complète. Chaque étape est clairement définie — vous saurez toujours où vous en êtes.</Text>
          </View>
        </View>

        {/* Légende responsables */}
        <View style={styles.legend}>
          {(Object.entries(RESP_CFG) as [Responsable, typeof RESP_CFG[Responsable]][]).map(([key, cfg]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={styles.legendText}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.timeline}>
          {steps.map((step, idx) => {
            const cfg = RESP_CFG[step.responsable];
            const isLast = idx === steps.length - 1;
            return (
              <View key={step.id} style={styles.timelineRow}>
                {/* Colonne gauche — ligne + cercle */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { borderColor: cfg.color, backgroundColor: cfg.color + '20' }]}>
                    <Text style={styles.timelineNum}>{idx + 1}</Text>
                  </View>
                  {!isLast && <View style={[styles.timelineLine, { borderColor: cfg.color + '40' }]} />}
                </View>

                {/* Contenu de l'étape */}
                <View style={[styles.timelineCard, isLast && { marginBottom: 0 }]}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{step.titre}</Text>
                    <View style={[styles.respBadge, { backgroundColor: cfg.color + '18' }]}>
                      <Ionicons name={cfg.icon} size={11} color={cfg.color} />
                      <Text style={[styles.respText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardDesc}>{step.description}</Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.cardDuration}>{step.dureeEstimee}</Text>
                  </View>
                  {step.documents && step.documents.length > 0 && (
                    <View style={styles.docList}>
                      {step.documents.map((d, i) => (
                        <View key={i} style={styles.docItem}>
                          <Ionicons name="document-text-outline" size={12} color={Colors.textMuted} />
                          <Text style={styles.docText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Choisir mon conseiller</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32 },
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.textMuted },
  timeline: { paddingHorizontal: 20 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineLeft: { alignItems: 'center', width: 36 },
  timelineDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  timelineNum: { fontSize: 13, fontWeight: '700', color: Colors.text },
  timelineLine: { flex: 1, width: 0, borderLeftWidth: 2, borderStyle: 'dashed', marginVertical: 4 },
  timelineCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 14, ...UI.cardBorder, ...UI.cardShadow },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1 },
  respBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8 },
  respText: { fontSize: 10, fontWeight: '600' },
  cardDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDuration: { fontSize: 12, color: Colors.textMuted },
  docList: { marginTop: 10, gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docText: { fontSize: 11, color: Colors.textMuted },
  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
