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

function buildTimeline(motif: CapiMotif, programme?: string, examenMedical?: boolean, where?: 'inside' | 'outside'): CapiTimelineStep[] {
  const loc = where ?? 'outside';

  // ── Scénarios INLAND (à l’intérieur du Canada) ───────────────────────────
  if (loc === 'inside') {
    if (motif === 'etudier') {
      // Guide: Étudiant — Inland (4 étapes)
      return [
        {
          id: 'si1',
          titre: 'Vérification du statut',
          description: 'Surveiller la date d’expiration du permis actuel et planifier la demande à l’avance pour éviter une perte de statut (viser 3–4 mois avant).',
          responsable: 'client',
          dureeEstimee: '1 jour',
          documents: ['Permis d’études actuel', 'Date d’expiration', 'Passeport'],
          statut: 'a_faire',
        },
        {
          id: 'si2',
          titre: 'Renouvellement CAQ (Québec) — si requis',
          description: 'Requis si rallongement d’études, échec, ou changement de cycle (ex: DEC → Université).',
          responsable: 'client',
          dureeEstimee: '4–8 semaines',
          documents: ['Lettre/attestation d’inscription', 'Preuves financières', 'Documents CAQ (si applicable)'],
          statut: 'a_faire',
        },
        {
          id: 'si3',
          titre: 'Prorogation du permis d’études (IMM 5709)',
          description: 'Déposer la demande AVANT l’expiration pour bénéficier du statut maintenu (si admissible).',
          responsable: 'client',
          dureeEstimee: '1–2 jours',
          documents: ['IMM 5709', 'Passeport', 'Permis actuel', 'Preuves de progression', 'Preuve de fonds'],
          statut: 'a_faire',
        },
        {
          id: 'si4',
          titre: 'Permis de travail post‑diplôme (PTPD)',
          description: 'Si vous terminez vos études: déposer la demande de PTPD au plus tard 180 jours après la fin des cours (selon admissibilité).',
          responsable: 'client',
          dureeEstimee: '1–2 jours',
          documents: ['Lettre de fin d’études', 'Relevé final', 'Compte IRCC'],
          statut: 'a_faire',
        },
      ];
    }

    if (motif === 'travailler') {
      // Transition PTPD (étudiant -> travailleur)
      if (programme === 'ptpd') {
        return [
          { id: 'pw1', titre: 'Fin des études', description: 'Obtenir le relevé de notes final et la lettre de fin d’études.', responsable: 'client', dureeEstimee: '1–2 semaines', documents: ['Relevé final', 'Lettre de fin d’études'], statut: 'a_faire' },
          { id: 'pw2', titre: 'Demande PTPD (IMM 5710)', description: 'Déposer la demande dans les 180 jours (avec un statut valide ou rétabli).', responsable: 'client', dureeEstimee: '1–2 jours', documents: ['IMM 5710', 'Passeport', 'Preuve de fin d’études'], statut: 'a_faire' },
          { id: 'pw3', titre: 'Statut maintenu & droit de travailler', description: 'Selon admissibilité, vous pouvez travailler à temps plein après dépôt en attendant la décision.', responsable: 'client', dureeEstimee: '0', documents: ['Preuve de soumission'], statut: 'a_faire' },
          { id: 'pw4', titre: 'Traitement IRCC', description: 'Suivi du traitement et demandes d’informations complémentaires si nécessaire.', responsable: 'gouvernement', dureeEstimee: '2–5 mois', documents: [], statut: 'a_faire' },
          { id: 'pw5', titre: 'Décision & permis', description: 'Réception du permis de travail post‑diplôme et mise à jour des démarches (NAS, employeur).', responsable: 'client', dureeEstimee: '1 jour', documents: ['PTPD'], statut: 'a_faire' },
        ];
      }

      // Changement d'employeur / modification conditions
      if (programme === 'changement_employeur') {
        // Guide: Travailleur — Inland (3 étapes)
        return [
          {
            id: 'we1',
            titre: 'Nouvelle offre d’emploi',
            description: 'Trouver un nouvel employeur (si permis fermé) et obtenir une offre/contrat signé.',
            responsable: 'client',
            dureeEstimee: 'Variable',
            documents: ['Offre/contrat signé', 'Détails du poste'],
            statut: 'a_faire',
          },
          {
            id: 'we2',
            titre: 'Nouvelle EIMT — si requise',
            description: 'Le nouvel employeur doit refaire les démarches EIMT (sauf si permis ouvert ou dispense).',
            responsable: 'client',
            dureeEstimee: '4–12 semaines',
            documents: ['Numéro EIMT (si applicable)', 'Preuve de dispense (si applicable)'],
            statut: 'a_faire',
          },
          {
            id: 'we3',
            titre: 'Modification du permis (IMM 5710)',
            description: 'Déposer la demande de changement de conditions (employeur/poste). Règle générale: ne pas commencer le nouveau travail avant approbation (sauf exceptions).',
            responsable: 'client',
            dureeEstimee: '1–2 jours',
            documents: ['IMM 5710', 'Passeport', 'Offre/contrat', 'EIMT/dispense'],
            statut: 'a_faire',
          },
        ];
      }

      // Guide: Travailleur — Inland (fallback si aucun programme précis)
      return [
        { id: 'wi1', titre: 'Nouvelle offre d’emploi', description: 'Obtenir une nouvelle offre/contrat (si vous devez changer d’employeur).', responsable: 'client', dureeEstimee: 'Variable', documents: ['Offre/contrat'], statut: 'a_faire' },
        { id: 'wi2', titre: 'Nouvelle EIMT — si requise', description: 'L’employeur refait les démarches EIMT si aucune exemption ne s’applique.', responsable: 'client', dureeEstimee: '4–12 semaines', documents: ['EIMT (si applicable)'], statut: 'a_faire' },
        { id: 'wi3', titre: 'Modification du permis (IMM 5710)', description: 'Demande de changement de conditions (IMM 5710).', responsable: 'client', dureeEstimee: '1–2 jours', documents: ['IMM 5710'], statut: 'a_faire' },
      ];
    }

    if (motif === 'visiter') {
      // Guide: Visiteur — Inland
      return [
        {
          id: 'vi1',
          titre: 'Prorogation de séjour (Fiche visiteur) — IMM 5708',
          description: 'Déposer la demande pour étendre le statut de visiteur. Condition: justifier le besoin de rester et démontrer les fonds disponibles.',
          responsable: 'client',
          dureeEstimee: '1–2 jours',
          documents: ['IMM 5708', 'Passeport', 'Lettre explicative', 'Preuves de fonds'],
          statut: 'a_faire',
        },
        {
          id: 'vi2',
          titre: 'Changement de statut (optionnel)',
          description: 'Optionnel: passer de visiteur à étudiant/travailleur. C’est souvent complexe depuis l’intérieur et peut dépendre de règles/politiques publiques spécifiques.',
          responsable: 'conseiller',
          dureeEstimee: 'Variable',
          documents: ['Selon le statut visé (LOA, offre d’emploi, etc.)'],
          statut: 'a_faire',
        },
      ];
    }
  }

  // ── Feuille de route VISA VISITEUR ───────────────────────────────────────
  if (motif === 'visiter') {
    // Guide: Visiteur — Outland (3 étapes)
    return [
      {
        id: 'v1',
        titre: 'Planification du voyage',
        description: 'Définir l’itinéraire, les dates et le motif (tourisme, famille, affaires). Préparer une lettre d’invitation si applicable.',
        responsable: 'client',
        dureeEstimee: '1–7 jours',
        documents: ['Itinéraire', 'Dates de voyage', 'Lettre d’invitation (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'v2',
        titre: 'Demande de Visa (VRT)',
        description: 'Montrer des attaches au pays d’origine (travail, famille, biens) et une preuve financière suffisante pour garantir le retour.',
        responsable: 'client',
        dureeEstimee: '3–14 jours',
        documents: ['Passeport', 'Preuves d’attaches', 'Preuves de fonds', 'Lettre explicative'],
        statut: 'a_faire',
      },
      {
        id: 'v3',
        titre: 'Biométrie',
        description: 'Rendez‑vous au centre VFS/CRDV pour empreintes et photo biométrique.',
        responsable: 'client',
        dureeEstimee: '1 jour',
        documents: ['Lettre de convocation biométrie', 'Pièce d’identité'],
        statut: 'a_faire',
      },
    ];
  }

  // ── Feuille de route TRAVAILLER ──────────────────────────────────────────
  if (motif === 'travailler') {
    // Guide: Travailleur — Outland (5 étapes)
    return [
      {
        id: 'w1',
        titre: 'Offre d’emploi',
        description: 'Trouver un employeur canadien prêt à embaucher à l’étranger (CV canadien, réseautage).',
        responsable: 'client',
        dureeEstimee: 'Variable',
        documents: ['Offre d’emploi / contrat'],
        statut: 'a_faire',
      },
      {
        id: 'w2',
        titre: 'EIMT (si requise)',
        description: 'Démarche portée par l’employeur pour prouver qu’aucun Canadien n’est disponible (souvent payée par l’employeur).',
        responsable: 'gouvernement',
        dureeEstimee: '4–8 semaines',
        documents: ['Numéro EIMT (si applicable)', 'Preuve de dispense (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'w3',
        titre: 'Demande de permis de travail (IMM 1295)',
        description: 'Demande fédérale avec contrat, EIMT/dispense et preuves d’expérience.',
        responsable: 'client',
        dureeEstimee: '1–3 jours',
        documents: ['IMM 1295', 'Passeport', 'Contrat', 'EIMT/dispense', 'Preuves d’expérience'],
        statut: 'a_faire',
      },
      {
        id: 'w4',
        titre: 'Biométrie & médical',
        description: 'Biométrie au centre VFS/CRDV. Examen médical si requis selon votre situation.',
        responsable: 'client',
        dureeEstimee: '1–7 jours',
        documents: ['Convocation biométrie', ...(examenMedical ? ['Rendez‑vous médecin désigné (si requis)'] : [])],
        statut: 'a_faire',
      },
      {
        id: 'w5',
        titre: 'Arrivée au Canada (point d’entrée)',
        description: 'À l’arrivée, l’agent frontalier délivre le permis papier et confirme les conditions.',
        responsable: 'gouvernement',
        dureeEstimee: 'Le jour J',
        documents: ['Lettre d’introduction (si applicable)', 'Passeport', 'Contrat'],
        statut: 'a_faire',
      },
    ];
  }

  // ── Feuille de route ÉTUDIER ─────────────────────────────────────────────
  if (motif === 'etudier') {
    // Guide: Étudiant — Outland (9 étapes)
    return [
      {
        id: 'e1',
        titre: 'Définir le projet d’études',
        description: 'Clarifier le projet professionnel et choisir un programme. Compléter le questionnaire de profil et estimer le budget.',
        responsable: 'client',
        dureeEstimee: '1–3 jours',
        documents: ['Objectif d’études', 'Budget estimatif'],
        statut: 'a_faire',
      },
      {
        id: 'e2',
        titre: 'Recherche d’un établissement (EED)',
        description: 'Sélectionner un établissement d’enseignement désigné (EED/DLI) et vérifier l’éligibilité au PTPD si c’est un objectif.',
        responsable: 'client',
        dureeEstimee: '3–14 jours',
        documents: ['Liste EED/DLI', 'Critères PTPD (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'e3',
        titre: 'Demande d’admission',
        description: 'Envoyer le dossier scolaire (relevés, diplômes, CV, lettre). Frais d’analyse parfois requis (50–200$ selon école).',
        responsable: 'client',
        dureeEstimee: '1–7 jours',
        documents: ['Relevés', 'Diplômes', 'CV', 'Lettre de motivation'],
        statut: 'a_faire',
      },
      {
        id: 'e4',
        titre: 'Lettre d’admission (LOA)',
        description: 'Recevoir la LOA. Souvent, un paiement partiel des frais de scolarité aide pour la preuve financière.',
        responsable: 'client',
        dureeEstimee: 'Variable',
        documents: ['LOA', 'Reçu de paiement (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'e5',
        titre: 'Preuve financière',
        description: 'Rassembler les fonds requis (scolarité + 20 635$ pour la vie + voyage) et préparer les justificatifs.',
        responsable: 'client',
        dureeEstimee: '3–10 jours',
        documents: ['Relevés bancaires (4 mois)', 'Attestation de fonds', 'Lettre de garant (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'e6',
        titre: 'Demande de CAQ (Québec seulement)',
        description: 'Si études au Québec: déposer la demande de CAQ avant la demande fédérale.',
        responsable: 'client',
        dureeEstimee: '4–8 semaines',
        documents: ['Formulaires CAQ', 'LOA', 'Preuves financières'],
        statut: 'a_faire',
      },
      {
        id: 'e7',
        titre: 'Compte IRCC & permis d’études (IMM 1294)',
        description: 'Créer/accéder au compte IRCC et soumettre la demande fédérale en ligne avec une lettre explicative.',
        responsable: 'client',
        dureeEstimee: '1–3 jours',
        documents: ['IMM 1294', 'Passeport', 'LOA', 'Lettre explicative', 'CAQ (si applicable)'],
        statut: 'a_faire',
      },
      {
        id: 'e8',
        titre: 'Biométrie & visite médicale',
        description: 'Biométrie au centre VFS/CRDV. Examen médical chez un médecin désigné si requis selon votre situation.',
        responsable: 'client',
        dureeEstimee: '1–10 jours',
        documents: ['Convocation biométrie', ...(examenMedical ? ['Rendez‑vous médecin désigné (si requis)'] : [])],
        statut: 'a_faire',
      },
      {
        id: 'e9',
        titre: 'Décision & départ',
        description: 'Réception de la lettre d’introduction (LI) et du visa/AVE, puis préparation du départ.',
        responsable: 'gouvernement',
        dureeEstimee: 'Variable',
        documents: ['Lettre d’introduction (LI)', 'Visa/AVE'],
        statut: 'a_faire',
      },
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
  const steps = buildTimeline(motif, session.programme, examenMedical, session.where);

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
