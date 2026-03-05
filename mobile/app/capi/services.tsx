import React, { useState } from 'react';
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
import type { CapiMotif, CapiService } from '../../lib/api';

// Catalogue de services par motif
function buildServices(motif: CapiMotif, complexite?: string): CapiService[] {
  const isComplex = complexite === 'elevee';

  // ── Services spécifiques VISA VISITEUR ──────────────────────────────────
  if (motif === 'visiter') {
    const immigration: CapiService[] = [
      { id: 'analyse_visiteur', nom: 'Analyse d\'admissibilité visiteur', description: 'Étude de votre profil, vérification des critères IRCC et recommandations personnalisées.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 149, devise: 'CAD', selected: true },
      { id: 'lettre_explication', nom: 'Rédaction de la lettre d\'explication', description: 'Lettre structurée exposant les motifs du voyage, l\'itinéraire et vos attaches au pays d\'origine.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 99, devise: 'CAD', selected: true },
      { id: 'preparation_visiteur', nom: 'Préparation complète du dossier', description: 'Collecte, vérification et organisation de tous les documents requis (IMM5257, photos, preuves).', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 199, devise: 'CAD', selected: true },
      { id: 'biometrie_rdv', nom: 'Prise de rendez-vous biométrie', description: 'Aide pour réserver votre rendez-vous au CRDV le plus proche et préparation des documents requis.', categorie: 'immigration', priorite: 'recommande', prixEstime: 49, devise: 'CAD', selected: false },
      { id: 'soumission_visiteur', nom: 'Soumission de la demande', description: 'Dépôt officiel de votre demande de visa visiteur auprès de l\'IRCC.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 199, devise: 'CAD', selected: true },
      { id: 'suivi_visiteur', nom: 'Suivi de dossier', description: 'Surveillance de l\'état de la demande et réponse rapide aux demandes d\'information de l\'IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
      ...(isComplex ? [{ id: 'refus_recours', nom: 'Lettre de refus antérieur + représentation', description: 'Analyse du refus précédent et rédaction d\'une lettre de représentation solide.', categorie: 'immigration' as const, priorite: 'recommande' as const, prixEstime: 299, devise: 'CAD', selected: false }] : []),
    ];
    const installation: CapiService[] = [
      { id: 'accueil_aeroport', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée et orientation vers votre hébergement.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'logement_temporaire', nom: 'Aide au logement temporaire', description: 'Recherche d\'hôtel, Airbnb ou hébergement chez famille/amis au Canada.', categorie: 'installation', priorite: 'optionnel', prixEstime: 149, devise: 'CAD', selected: false },
      { id: 'assurance_voyage', nom: 'Assurance voyage', description: 'Mise en relation avec un assureur pour couvrir votre séjour au Canada.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques TRAVAILLER ─────────────────────────────────────
  if (motif === 'travailler') {
    const immigration: CapiService[] = [
      { id: 'analyse_emploi', nom: 'Analyse d\'admissibilité emploi', description: 'Étude de votre profil, vérification de l\'offre d\'emploi et stratégie EIMT / exemptions.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 149, devise: 'CAD', selected: true },
      { id: 'verif_offre', nom: 'Vérification de l\'offre d\'emploi', description: 'Analyse de la conformité de l\'offre (NOC, salaire, conditions) pour éviter un refus.', categorie: 'immigration', priorite: 'recommande', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'prep_eimt', nom: 'Préparation EIMT (si requis)', description: 'Accompagnement de l\'employeur dans la démarche EIMT auprès d\'ESDC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 299, devise: 'CAD', selected: false },
      { id: 'montage_travail', nom: 'Montage du dossier permis de travail', description: 'Collecte, vérification et organisation complète des documents IMM requis.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 299, devise: 'CAD', selected: true },
      { id: 'soumission_travail', nom: 'Soumission de la demande', description: 'Dépôt officiel de la demande de permis de travail auprès de l\'IRCC.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 199, devise: 'CAD', selected: true },
      { id: 'suivi_travail', nom: 'Suivi de dossier', description: 'Surveillance du statut et réponse aux demandes IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 99, devise: 'CAD', selected: false },
      ...(isComplex ? [{ id: 'recours_travail', nom: 'Gestion d\'un refus / appel', description: 'Analyse du refus et représentation.', categorie: 'immigration' as const, priorite: 'optionnel' as const, prixEstime: 1200, devise: 'CAD', selected: false }] : []),
    ];
    const installation: CapiService[] = [
      { id: 'logement', nom: 'Recherche de logement', description: 'Aide à trouver un appartement avant ou après votre arrivée.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'nas', nom: 'Inscription NAS & impôts', description: 'Aide à l\'obtention du NAS et première déclaration fiscale.', categorie: 'installation', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
      { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Accompagnement pour ouvrir votre compte canadien.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
      { id: 'emploi_coaching', nom: 'Coaching emploi', description: 'CV canadien, préparation entretiens, réseau professionnel.', categorie: 'installation', priorite: 'optionnel', prixEstime: 249, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques ÉTUDIER ─────────────────────────────────────────
  if (motif === 'etudier') {
    const immigration: CapiService[] = [
      { id: 'analyse_etudes', nom: 'Analyse d\'admissibilité études', description: 'Vérification du DLI, éligibilité au permis d\'études et conseils sur le CAQ si Québec.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 149, devise: 'CAD', selected: true },
      { id: 'caq', nom: 'CAQ — Certificat d\'acceptation Québec', description: 'Préparation et soumission du CAQ (obligatoire pour les études au Québec).', categorie: 'immigration', priorite: 'recommande', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'montage_etudes', nom: 'Montage du dossier permis d\'études', description: 'Collecte, vérification et organisation complète des documents requis.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 249, devise: 'CAD', selected: true },
      { id: 'soumission_etudes', nom: 'Soumission de la demande (SDE ou ordinaire)', description: 'Dépôt officiel du permis d\'études via le Système de demande en direct ou dossier papier.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 149, devise: 'CAD', selected: true },
      { id: 'suivi_etudes', nom: 'Suivi de dossier', description: 'Surveillance du statut et réponse aux demandes IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
    ];
    const installation: CapiService[] = [
      { id: 'logement', nom: 'Recherche de logement étudiant', description: 'Aide pour trouver une résidence ou un appartement près de votre campus.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Accompagnement pour ouvrir votre premier compte canadien.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
      { id: 'assurance', nom: 'Assurance santé privée', description: 'Couverture pendant l\'attente de la carte d\'assurance maladie provinciale.', categorie: 'installation', priorite: 'recommande', prixEstime: 89, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques RÉSIDENCE PERMANENTE ────────────────────────────
  if (motif === 'residence_permanente') {
    const immigration: CapiService[] = [
      { id: 'analyse_rp', nom: 'Analyse complète Express Entry / PNP', description: 'Calcul du score CRS, identification du volet optimal et feuille de route personnalisée.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 299, devise: 'CAD', selected: true },
      { id: 'coaching_langue', nom: 'Coaching IELTS / TEF', description: 'Préparation intensive aux tests de langue pour maximiser votre score et CRS.', categorie: 'immigration', priorite: 'recommande', prixEstime: 350, devise: 'CAD', selected: false },
      { id: 'aide_wes', nom: 'Aide évaluation diplômes (WES)', description: 'Accompagnement dans la démarche WES ou équivalent pour la reconnaissance de vos titres étrangers.', categorie: 'immigration', priorite: 'recommande', prixEstime: 149, devise: 'CAD', selected: false },
      { id: 'montage_rp', nom: 'Montage du dossier RP complet', description: 'Collecte, vérification et organisation de tous les documents pour la demande RP.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 899, devise: 'CAD', selected: true },
      { id: 'soumission_rp', nom: 'Soumission de la demande RP', description: 'Dépôt officiel auprès d\'IRCC suite à l\'ITA.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 499, devise: 'CAD', selected: true },
      { id: 'suivi_rp', nom: 'Suivi mensuel', description: 'Surveillance du dossier et réponse aux demandes IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 149, devise: 'CAD', selected: false },
      ...(isComplex ? [{ id: 'recours_rp', nom: 'Gestion d\'un refus / appel', description: 'Analyse du refus et représentation devant la SAI si nécessaire.', categorie: 'immigration' as const, priorite: 'optionnel' as const, prixEstime: 1200, devise: 'CAD', selected: false }] : []),
    ];
    const installation: CapiService[] = [
      { id: 'logement', nom: 'Recherche de logement', description: 'Aide pour trouver un appartement.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Premier compte canadien.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
      { id: 'nas', nom: 'Inscription NAS & impôts', description: 'NAS et première déclaration fiscale.', categorie: 'installation', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
      { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'assurance', nom: 'Assurance santé privée', description: 'Couverture santé en attente de la RAMQ / OHIP.', categorie: 'installation', priorite: 'recommande', prixEstime: 89, devise: 'CAD', selected: false },
      { id: 'emploi', nom: 'Coaching emploi', description: 'CV canadien, entretiens, réseau professionnel.', categorie: 'installation', priorite: 'optionnel', prixEstime: 249, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques FAMILLE ─────────────────────────────────────────
  if (motif === 'famille') {
    const immigration: CapiService[] = [
      { id: 'analyse_famille', nom: 'Analyse admissibilité parrainage', description: 'Vérification du statut du parrain, éligibilité financière et stratégie de dossier.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 249, devise: 'CAD', selected: true },
      { id: 'preuves_relation', nom: 'Aide preuves de relation', description: 'Conseil et structuration des preuves d\'authenticité de la relation (photos, communications, etc.).', categorie: 'immigration', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'montage_famille', nom: 'Montage du dossier de parrainage', description: 'Préparation complète du dossier parrain + parrainé (IMM 1344, IMM 5532, etc.).', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 599, devise: 'CAD', selected: true },
      { id: 'soumission_famille', nom: 'Soumission de la demande', description: 'Dépôt officiel du dossier de parrainage auprès d\'IRCC.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 299, devise: 'CAD', selected: true },
      { id: 'suivi_famille', nom: 'Suivi de dossier', description: 'Surveillance et réponse aux demandes d\'information IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 149, devise: 'CAD', selected: false },
    ];
    const installation: CapiService[] = [
      { id: 'logement', nom: 'Recherche de logement', description: 'Aide pour préparer l\'arrivée du membre de la famille.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Premier compte canadien du membre parrainé.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
      { id: 'nas', nom: 'Inscription NAS & impôts', description: 'NAS et première déclaration fiscale.', categorie: 'installation', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques ENTREPRENDRE ────────────────────────────────────
  if (motif === 'entreprendre') {
    const immigration: CapiService[] = [
      { id: 'analyse_suv', nom: 'Analyse admissibilité entrepreneur', description: 'Évaluation du profil, du projet et identification de l\'organisme désigné le mieux adapté.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 399, devise: 'CAD', selected: true },
      { id: 'plan_affaires', nom: 'Aide à la rédaction du plan d\'affaires', description: 'Accompagnement dans la création d\'un business plan convaincant pour les organismes désignés.', categorie: 'immigration', priorite: 'recommande', prixEstime: 799, devise: 'CAD', selected: false },
      { id: 'incubateur', nom: 'Mise en relation — organisme désigné', description: 'Introduction auprès d\'incubateurs, anges financiers ou capital-risqueurs reconnus par IRCC.', categorie: 'immigration', priorite: 'recommande', prixEstime: 299, devise: 'CAD', selected: false },
      { id: 'montage_suv', nom: 'Montage du dossier SUV', description: 'Préparation complète du dossier SUV ou programme provincial entrepreneur.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 999, devise: 'CAD', selected: true },
      { id: 'soumission_suv', nom: 'Soumission de la demande', description: 'Dépôt officiel de la demande SUV auprès d\'IRCC.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 499, devise: 'CAD', selected: true },
      { id: 'suivi_suv', nom: 'Suivi de dossier', description: 'Surveillance et réponse aux demandes d\'information.', categorie: 'immigration', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
    ];
    const installation: CapiService[] = [
      { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
      { id: 'logement', nom: 'Recherche de logement', description: 'Aide pour trouver un logement ou un espace de coworking.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
      { id: 'banque', nom: 'Ouverture compte bancaire pro & personnel', description: 'Accompagnement pour compte personnel et compte d\'entreprise.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
      { id: 'assurance', nom: 'Assurance santé privée', description: 'Couverture santé en attendant la couverture provinciale.', categorie: 'installation', priorite: 'recommande', prixEstime: 89, devise: 'CAD', selected: false },
    ];
    return [...immigration, ...installation];
  }

  // ── Services spécifiques RÉGULARISATION ──────────────────────────────────
  if (motif === 'regularisation') {
    const immigration: CapiService[] = [
      { id: 'consultation_urgente', nom: 'Consultation urgente', description: 'Évaluation rapide de votre situation et des options disponibles, avec plan d\'action immédiat.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 199, devise: 'CAD', selected: true },
      { id: 'analyse_hc', nom: 'Analyse complète de la situation', description: 'Étude approfondie de votre dossier, identification des motifs H&C et évaluation des risques.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 399, devise: 'CAD', selected: true },
      { id: 'montage_hc', nom: 'Montage dossier H&C / ERAR / PRTD', description: 'Préparation complète du dossier de régularisation avec tous les documents justificatifs.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 1099, devise: 'CAD', selected: true },
      { id: 'soumission_hc', nom: 'Soumission de la demande', description: 'Dépôt officiel de la demande auprès d\'IRCC.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 499, devise: 'CAD', selected: true },
      { id: 'suivi_hc', nom: 'Suivi de dossier', description: 'Surveillance et réponse aux demandes d\'information urgentes.', categorie: 'immigration', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
    ];
    return immigration;
  }

  // ── Fallback (ne devrait pas être atteint) ────────────────────────────────
  const immigration: CapiService[] = [
    { id: 'analyse', nom: 'Analyse stratégique du profil', description: 'Étude complète de votre dossier, recommandations personnalisées et plan d\'action.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 299, devise: 'CAD', selected: true },
    { id: 'preparation', nom: 'Montage et préparation du dossier', description: 'Collecte, vérification et organisation complète de tous vos documents.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 699, devise: 'CAD', selected: true },
    { id: 'soumission', nom: 'Soumission de la demande', description: 'Dépôt officiel de la demande auprès de l\'IRCC ou Québec.', categorie: 'immigration', priorite: 'obligatoire', prixEstime: 499, devise: 'CAD', selected: true },
    { id: 'traduction', nom: 'Traduction certifiée', description: 'Traduction officielle de vos documents par un traducteur agréé.', categorie: 'immigration', priorite: 'recommande', prixEstime: 150, devise: 'CAD', selected: false },
    { id: 'coaching_langue', nom: 'Coaching IELTS / TEF', description: 'Préparation aux tests de langue pour maximiser votre score.', categorie: 'immigration', priorite: motif === 'residence_permanente' ? 'recommande' : 'optionnel', prixEstime: 350, devise: 'CAD', selected: false },
    { id: 'suivi', nom: 'Suivi administratif mensuel', description: 'Réponses aux demandes d\'information et suivi de l\'avancement.', categorie: 'immigration', priorite: 'recommande', prixEstime: 149, devise: 'CAD', selected: false },
    ...(isComplex ? [{ id: 'recours', nom: 'Gestion d\'un recours / appel', description: 'Représentation et préparation en cas de refus ou d\'appel.', categorie: 'immigration' as const, priorite: 'optionnel' as const, prixEstime: 1200, devise: 'CAD', selected: false }] : []),
  ];
  const installation: CapiService[] = [
    { id: 'logement', nom: 'Recherche de logement', description: 'Aide à la recherche d\'un appartement et mise en relation avec des propriétaires.', categorie: 'installation', priorite: 'recommande', prixEstime: 199, devise: 'CAD', selected: false },
    { id: 'accueil', nom: 'Accueil à l\'aéroport', description: 'Prise en charge à l\'arrivée et accompagnement vers votre logement temporaire.', categorie: 'installation', priorite: 'optionnel', prixEstime: 99, devise: 'CAD', selected: false },
    { id: 'banque', nom: 'Ouverture compte bancaire', description: 'Accompagnement pour ouvrir votre premier compte canadien.', categorie: 'installation', priorite: 'recommande', prixEstime: 0, devise: 'CAD', selected: false },
    { id: 'assurance', nom: 'Assurance santé privée', description: 'Souscription à une assurance santé en attendant la couverture provinciale.', categorie: 'installation', priorite: 'recommande', prixEstime: 89, devise: 'CAD', selected: false },
    { id: 'nas', nom: 'Inscription NAS & impôts', description: 'Aide à l\'obtention du Numéro d\'Assurance Sociale et première déclaration.', categorie: 'installation', priorite: 'recommande', prixEstime: 79, devise: 'CAD', selected: false },
    { id: 'emploi', nom: 'Coaching emploi', description: 'CV canadien, préparation entretiens, réseau professionnel local.', categorie: 'installation', priorite: 'optionnel', prixEstime: 249, devise: 'CAD', selected: false },
  ];
  return [...immigration, ...installation];
}

const PRIORITE_CFG = {
  obligatoire: { label: 'Obligatoire', color: Colors.error, bg: '#fee2e2' },
  recommande:  { label: 'Recommandé', color: Colors.warning, bg: '#fef3c7' },
  optionnel:   { label: 'Optionnel', color: Colors.textMuted, bg: Colors.border },
};

export default function CapiServicesScreen() {
  const router = useRouter();
  const { session, updateSession } = useCapiSession();
  const motif = session.motif ?? 'visiter';

  const [services, setServices] = useState<CapiService[]>(() =>
    buildServices(motif, session.evaluation?.complexite),
  );

  const toggle = (id: string) => {
    setServices(prev => prev.map(s =>
      s.id === id && s.priorite !== 'obligatoire' ? { ...s, selected: !s.selected } : s,
    ));
  };

  const selected = services.filter(s => s.selected);
  const total = selected.reduce((sum, s) => sum + (s.prixEstime ?? 0), 0);

  const immigrationServices = services.filter(s => s.categorie === 'immigration');
  const installationServices = services.filter(s => s.categorie === 'installation');

  const next = () => {
    updateSession({ services, step: 6 });
    router.push('/capi/timeline');
  };

  const renderService = (service: CapiService) => {
    const cfg = PRIORITE_CFG[service.priorite];
    const isObl = service.priorite === 'obligatoire';
    return (
      <TouchableOpacity
        key={service.id}
        style={[styles.serviceCard, service.selected && styles.serviceCardSelected]}
        onPress={() => toggle(service.id)}
        activeOpacity={isObl ? 1 : 0.85}
      >
        <View style={styles.serviceTop}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceName} numberOfLines={2}>{service.nom}</Text>
            <View style={[styles.checkbox, service.selected && styles.checkboxSelected]}>
              {service.selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </View>
          <Text style={styles.serviceDesc}>{service.description}</Text>
        </View>
        <View style={styles.serviceMeta}>
          <View style={[styles.prioriteBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.prioriteText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.servicePrice}>
            {(service.prixEstime ?? 0) === 0 ? 'Gratuit' : `${service.prixEstime} ${service.devise}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: '62.5%' }]} />
        </View>
        <Text style={styles.stepLabel}>5 / 8</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.capiHeader}>
          <CapiAvatar size={44} state="idle" />
          <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {motif === 'visiter'
              ? 'Voici les services adaptés à votre visa visiteur. Les services '
              : 'Voici les services adaptés à votre projet. Les services '}
            <Text style={{ color: Colors.error, fontWeight: '600' }}>obligatoires</Text>
            {' sont présélectionnés. Ajoutez ce dont vous avez besoin.'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🧾 Services Immigration</Text>
        <View style={styles.list}>{immigrationServices.map(renderService)}</View>

        <Text style={styles.sectionTitle}>🏠 Services d'Installation</Text>
        <View style={styles.list}>{installationServices.map(renderService)}</View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer avec total */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Estimation totale</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} $ CAD</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Voir ma timeline</Text>
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
  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12, alignItems: 'flex-start' },

  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 10, marginTop: 4 },
  list: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  serviceCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.border, ...UI.cardShadow },
  serviceCardSelected: { borderColor: Colors.orange, backgroundColor: Colors.orange + '06' },
  serviceTop: { marginBottom: 10 },
  serviceTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  serviceDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prioriteBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  prioriteText: { fontSize: 11, fontWeight: '600' },
  servicePrice: { fontSize: 13, fontWeight: '700', color: Colors.text },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  footer: { padding: 20, paddingBottom: 28, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: Colors.textMuted },
  totalAmount: { fontSize: 18, fontWeight: '800', color: Colors.orange },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.orange, borderRadius: 14, paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
