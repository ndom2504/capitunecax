import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { UI } from '../../constants/UI';
import { useCapiSession } from '../../context/CapiContext';
import { CapiAvatar } from '../../components/CapiAvatar';
import { CapiHelpFab } from '../../components/CapiHelpFab';
import type { CapiSession } from '../../lib/api';

type ArrivalStage = NonNullable<CapiSession['arrivalStage']>;

type StageOption = {
  id: ArrivalStage;
  emoji: string;
  label: string;
  desc: string;
};

type IntegrationStep = {
  id: string;
  title: string;
  description: string;
  when?: string;
  documents?: string[];
  links: { label: string; url: string }[];
  checkItems: { id: string; label: string; links?: { label: string; url: string }[] }[];
};

type Page =
  | { key: 'pick'; kind: 'pick' }
  | { key: string; kind: 'step'; stepId: string }
  | { key: 'finish'; kind: 'finish' };

const STAGES: StageOption[] = [
  {
    id: 'rp',
    emoji: '🟩',
    label: 'Résident Permanent (RP)',
    desc: 'J’ai ma confirmation de résidence (CoPR) / je suis RP.',
  },
  {
    id: 'student',
    emoji: '🎓',
    label: 'Étudiant international',
    desc: 'J’ai un permis d’études.',
  },
  {
    id: 'worker',
    emoji: '💼',
    label: 'Travailleur temporaire',
    desc: 'J’ai un permis de travail.',
  },
  {
    id: 'asylum',
    emoji: '🛟',
    label: 'Demandeur d’asile',
    desc: 'Je demande la protection au Canada.',
  },
];

const OFFICIAL = {
  cbsaTravel: 'https://www.cbsa-asfc.gc.ca/travel-voyage/menu-fra.html',
  cbsaCustoms: 'https://www.cbsa-asfc.gc.ca/travel-voyage/dc-ed/nextapp-proapp-fra.html',
  settleIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/setablir-canada.html',
  studyIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
  studyPermitConditions: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/apres-arrivee.html',
  studyPermitRenew: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/prolonger.html',
  dliListIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/preparer/liste-etablissements-enseignement-designes.html',
  workIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada.html',
  workPermitIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
  workPermitRenew: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailleurs-temporaires/prolonger-modifier-permis.html',
  tfwESDC: 'https://www.canada.ca/fr/emploi-developpement-social/services/travailleurs-etrangers.html',
  tfwRights: 'https://www.canada.ca/fr/emploi-developpement-social/services/travailleurs-etrangers/droits.html',
  sinServiceCanada: 'https://www.canada.ca/fr/emploi-developpement-social/services/numero-assurance-sociale.html',
  serviceCanadaOffices: 'https://www.canada.ca/fr/emploi-developpement-social/ministere/coordonnees/bureau-service-canada.html',
  taxesCRA: 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/nouveaux-arrivants-canada.html',
  craNewcomers: 'https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/nouveaux-arrivants-canada/renseignements-generaux.html',
  craMyAccount: 'https://www.canada.ca/fr/agence-revenu/services/services-ligne/moncompte.html',
  prCardIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/nouveaux-immigrants/carte-resident-permanent.html',
  jobBank: 'https://www.jobbank.gc.ca',
  eiServiceCanada: 'https://www.canada.ca/fr/emploi-developpement-social/services/assurance-emploi.html',
  refugeesIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html',
  asylumIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies/demande-asile.html',
  asylumProcess: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies/demande-asile/processus.html',
  ifhpIRCC: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies/aide-medicale.html',
  irb: 'https://www.irb-cisr.gc.ca/fr/Pages/index.aspx',
  irbProcess: 'https://www.irb-cisr.gc.ca/fr/procedures/Pages/SPRProcess.aspx',
  expressEntry: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html',
  pnp: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/programmes-provinciaux-territoriaux.html',
  fcac: 'https://www.canada.ca/fr/agence-consommation-services-financiers/services/banques-investissements/ouvrir-compte-bancaire-canada.html',
  healthWaiting: 'https://sante.gouv.qc.ca/conseils-et-prevention/les-delais-d-attente/',
} as const;

const CAPITUNE_RESOURCES = {
  newcomerIndex: 'https://www.capitune.com/ressources/nouvel-arrivant',
  banks: 'https://www.capitune.com/ressources/nouvel-arrivant/banques',
  phoneInternet: 'https://www.capitune.com/ressources/nouvel-arrivant/telephonie-internet',
  housing: 'https://www.capitune.com/ressources/nouvel-arrivant/logement',
  transport: 'https://www.capitune.com/ressources/nouvel-arrivant/transports',
} as const;

const EXTERNAL = {
  // Hébergement
  airbnb: 'https://www.airbnb.ca',
  kijiji: 'https://www.kijiji.ca',
  rentals: 'https://rentals.ca',
  padmapper: 'https://www.padmapper.com',
  zumper: 'https://www.zumper.com/apartments-for-rent/canada',
  cmhcRent: 'https://www.cmhc-schl.gc.ca/fr/consumers/renting-a-home',
  talQC: 'https://www.tal.gouv.qc.ca',
  ltbON: 'https://tribunalsontario.ca/ltb/',
  // Emploi
  indeed: 'https://www.indeed.ca',
  linkedin: 'https://www.linkedin.com',
  acces: 'https://accesemployment.ca',
  ymca: 'https://www.ymcasettlement.ca',
  // Santé
  ramq: 'https://www.ramq.gouv.qc.ca',
  ohip: 'https://www.ontario.ca/page/apply-ohip',
  mspBC: 'https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp',
  ahcipAB: 'https://www.alberta.ca/ahcip-enroll.aspx',
  skHealth: 'https://www.ehealthsask.ca/residents/health-cards',
  // Banque
  rbcNewcomers: 'https://www.rbc.com/fr/nouveaux-arrivants-au-canada',
  tdNewcomers: 'https://www.td.com/fr/particuliers/solutions/nouveaux-arrivants',
  scotiabankNewcomers: 'https://www.scotiabank.com/ca/fr/particuliers/solutions/programme-se-lancer-au-canada.html',
  bmoNewcomers: 'https://www.bmo.com/fr/nouveaux-arrivants',
  desjardins: 'https://www.desjardins.com/fr/particuliers/produits-services/comptes.html',
  simplii: 'https://www.simplii.com/fr/compte-cheques.html',
  equifax: 'https://www.consumer.equifax.ca/fr/personnel',
  transunion: 'https://www.transunion.ca/fr',
  // Téléphonie
  koodo: 'https://www.koodomobile.com/fr',
  fido: 'https://www.fido.ca/fr',
  fizz: 'https://fizz.ca/fr',
  publicMobile: 'https://publicmobile.ca/fr',
  // Transport aéroport (rideshare + navettes)
  uber: 'https://www.uber.com/ca/fr/',
  inDriver: 'https://indriver.com/country/ca',
  yulTransport: 'https://www.admtl.com/fr/passagers/transport-et-stationnement',
  yyzTransport: 'https://www.torontopearson.com/fr/transports',
  yvrTransport: 'https://www.yvr.ca/fr/passagers/transport-terrestre',
  // Transport en commun
  stm: 'https://www.stm.info',
  ttc: 'https://www.ttc.ca',
  translink: 'https://www.translink.ca',
  octranspo: 'https://www.octranspo.com',
  exo: 'https://exo.quebec',
  calgarytransit: 'https://www.calgarytransit.com',
  edmontonets: 'https://www.edmonton.ca/ets',
  // Impôts
  wealthsimpleTax: 'https://www.wealthsimple.com/fr-ca/tax',
  // Asile
  costiToronto: 'https://costi.org',
} as const;

function buildIntegrationSteps(stage: ArrivalStage): IntegrationStep[] {
  switch (stage) {
    // ─── RÉSIDENT PERMANENT ────────────────────────────────────────────────
    case 'rp':
      return [
        // ── Étape 1 ──
        {
          id: 'airport',
          title: 'Arrivée à l\'aéroport',
          description: 'Franchir le contrôle des frontières, présenter vos documents et valider votre statut de résident permanent au point d\'entrée.',
          when: 'Jour 0',
          documents: ['Passeport valide', 'Confirmation de résidence permanente (CoPR)', 'Formulaire douanier/déclaration à l\'arrivée', 'Adresse au Canada (même temporaire)'],
          links: [
            { label: 'ASFC — Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'ASFC — Déclaration à l\'arrivée (officiel)', url: OFFICIAL.cbsaCustoms },
            { label: 'S\'établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'present_docs', label: 'Présenter passeport + CoPR à l\'agent des frontières.' },
            { id: 'validate_status', label: 'Obtenir le tampon / les documents confirmant le statut RP.' },
            { id: 'customs', label: 'Remplir la déclaration douanière (et déclarer les marchandises si requis).' },
          ],
        },
        // ── Étape 1b : Transport aéroport ──
        {
          id: 'airport_transport',
          title: 'Transport : aéroport → hébergement',
          description: 'Organisez votre trajet de l’aéroport au logement. Uber est disponible dans la majorité des aéroports canadiens (zone de prise en charge dédiée, distincte des taxis). Les taxis officiels sont réglementés et affichent un tarif fixe depuis les aéroports dans plusieurs villes.',
          when: 'Jour 0',
          documents: ['Téléphone chargé + internet (Wi-Fi aéroport ou SIM locale)', 'Adresse du logement temporaire'],
          links: [
            { label: 'Uber Canada — réserver un trajet', url: EXTERNAL.uber },
            { label: 'InDriver Canada — tarifs négociés', url: EXTERNAL.inDriver },
            { label: 'Transports aéroport Montréal / YUL (officiel)', url: EXTERNAL.yulTransport },
            { label: 'Transports aéroport Toronto / YYZ (officiel)', url: EXTERNAL.yyzTransport },
            { label: 'Transports aéroport Vancouver / YVR (officiel)', url: EXTERNAL.yvrTransport },
          ],
          checkItems: [
            { id: 'address_ready', label: 'Avoir l’adresse du logement disponible (message, courriel ou note).' },
            { id: 'choose_ride', label: 'Choisir Uber, InDriver, navette ou taxi officiel selon la ville.' },
            { id: 'pickup_zone', label: 'Repérer la zone de prise en charge : Uber/rideshare ≠ taxi (panneaux à la sortie baggages).' },
            { id: 'set_destination', label: 'Saisir l’adresse ou montrer la note au chauffeur.' },
          ],
        },
        // ── Étape 2 ──
        {
          id: 'temp_housing',
          title: 'Hébergement temporaire',
          description: 'Stabiliser un toit pour les premiers jours pendant que vous explorez le logement permanent. Même une adresse temporaire suffit pour les premières démarches.',
          when: 'Jour 1–7',
          documents: ['Pièce d\'identité', 'Carte de crédit / moyen de paiement'],
          links: [
            { label: 'Logement — ressources nouvel arrivant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'Airbnb Canada (officiel)', url: EXTERNAL.airbnb },
            { label: 'Kijiji — logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'SCHL/CMHC — Louer au Canada (officiel)', url: EXTERNAL.cmhcRent },
          ],
          checkItems: [
            { id: 'choose_option', label: 'Choisir une option (Airbnb / auberge / hôtel / proches / résidence).' },
            { id: 'book', label: 'Réserver et noter l\'adresse (nécessaire pour les prochaines démarches).' },
          ],
        },
        // ── Étape 3 ──
        {
          id: 'sin',
          title: 'Numéro d\'assurance sociale (NAS)',
          description: 'Indispensable pour travailler légalement, payer des impôts et accéder aux prestations gouvernementales. Faites la demande le plus tôt possible.',
          when: 'Semaine 1',
          documents: ['Passeport', 'Preuve de statut RP (CoPR ou carte RP)'],
          links: [
            { label: 'Demander un NAS — Service Canada (officiel)', url: OFFICIAL.sinServiceCanada },
            { label: 'Trouver un bureau Service Canada', url: OFFICIAL.serviceCanadaOffices },
          ],
          checkItems: [
            { id: 'prepare_docs', label: 'Préparer les documents requis (passeport + preuve de statut).' },
            { id: 'apply', label: 'Faire la demande en personne ou en ligne et noter le NAS reçu.' },
          ],
        },
        // ── Étape 4 ──
        {
          id: 'bank',
          title: 'Ouvrir un compte bancaire',
          description: 'Recevoir votre salaire, payer le loyer et gérer vos finances. Plusieurs banques offrent des comptes sans frais pour nouveaux arrivants.',
          when: 'Semaine 1–2',
          documents: ['Passeport', 'Preuve de statut RP', 'Adresse canadienne (même temporaire)'],
          links: [
            { label: 'Banques — guide nouvel arrivant (CAPITUNE)', url: CAPITUNE_RESOURCES.banks },
            { label: 'Ouvrir un compte au Canada — ACFC (officiel)', url: OFFICIAL.fcac },
            { label: 'RBC Nouveaux arrivants', url: EXTERNAL.rbcNewcomers },
            { label: 'TD Nouveaux arrivants', url: EXTERNAL.tdNewcomers },
            { label: 'Banque Scotia — Se lancer au Canada', url: EXTERNAL.scotiabankNewcomers },
            { label: 'BMO Nouveaux arrivants', url: EXTERNAL.bmoNewcomers },
            { label: 'Desjardins (Québec)', url: EXTERNAL.desjardins },
            { label: 'Simplii — compte sans frais', url: EXTERNAL.simplii },
          ],
          checkItems: [
            { id: 'compare', label: 'Comparer 2–3 banques (frais, offre "nouvel arrivant", carte).' },
            { id: 'open', label: 'Ouvrir le compte et demander une carte de débit/crédit.' },
            { id: 'credit', label: '(Optionnel) Ouvrir un dossier de crédit pour l\'avenir.' },
          ],
        },
        // ── Étape 5 ──
        {
          id: 'health',
          title: 'Assurance maladie provinciale',
          description: 'Chaque province a son régime. Certaines ont une période d\'attente de 3 mois. Souscrivez une assurance privée de transition si c\'est le cas.',
          when: 'Semaine 1–3',
          documents: ['Pièce d\'identité', 'Preuve de résidence / adresse (selon province)'],
          links: [
            { label: 'RAMQ — Assurance maladie Québec (officiel)', url: EXTERNAL.ramq },
            { label: 'OHIP — Assurance maladie Ontario (officiel)', url: EXTERNAL.ohip },
            { label: 'MSP — Assurance maladie Colombie-Britannique (officiel)', url: EXTERNAL.mspBC },
            { label: 'AHCIP — Assurance maladie Alberta (officiel)', url: EXTERNAL.ahcipAB },
            { label: 'Saskatchewan Health Card (officiel)', url: EXTERNAL.skHealth },
            { label: 'S\'établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'identify_province', label: 'Identifier la démarche officielle de votre province.' },
            { id: 'apply', label: 'Déposer la demande de couverture santé.' },
            { id: 'interim', label: 'Si période d\'attente : souscrire une assurance privée temporaire.' },
          ],
        },
        // ── Étape 6 ──
        {
          id: 'phone',
          title: 'Téléphone & internet',
          description: 'Un numéro canadien est requis pour la banque, le logement et les rendez-vous officiels. Commencez avec un forfait prépayé ou sans engagement.',
          when: 'Semaine 1',
          documents: ['Pièce d\'identité', 'Moyen de paiement'],
          links: [
            { label: 'Téléphonie — guide nouvel arrivant (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Koodo — forfaits abordables', url: EXTERNAL.koodo },
            { label: 'Fido — forfaits', url: EXTERNAL.fido },
            { label: 'Fizz — prépayé / mensuel', url: EXTERNAL.fizz },
            { label: 'Public Mobile — prépayé abordable', url: EXTERNAL.publicMobile },
          ],
          checkItems: [
            { id: 'choose', label: 'Choisir un forfait (idéalement sans engagement au départ).' },
            { id: 'activate', label: 'Activer la SIM/eSIM et tester appels + données.' },
          ],
        },
        // ── Étape 7 ──
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Obtenir une carte de transport de votre ville. Des tarifs réduits peuvent exister. Téléchargez l\'appli officielle du réseau local.',
          when: 'Semaine 1',
          documents: ['Adresse', 'Photo (selon carte)'],
          links: [
            { label: 'Transports — guide nouvel arrivant (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM — Montréal (officiel)', url: EXTERNAL.stm },
            { label: 'TTC — Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink — Vancouver (officiel)', url: EXTERNAL.translink },
            { label: 'OC Transpo — Ottawa (officiel)', url: EXTERNAL.octranspo },
            { label: 'EXO — Montréal grandes lignes (officiel)', url: EXTERNAL.exo },
            { label: 'Calgary Transit (officiel)', url: EXTERNAL.calgarytransit },
            { label: 'ETS — Edmonton (officiel)', url: EXTERNAL.edmontonets },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier et télécharger l\'appli du réseau officiel de votre ville.' },
            { id: 'card', label: 'Obtenir et recharger une carte (ou abonnement mensuel).' },
          ],
        },
        // ── Étape 8 ──
        {
          id: 'housing_perm',
          title: 'Logement permanent',
          description: 'Préparer un dossier de location et chercher un appartement stable. Connaissez vos droits en tant que locataire.',
          when: 'Mois 1',
          documents: ['Pièce d\'identité', 'Preuve de revenus (si applicable)', 'Références de logement (si demandées)'],
          links: [
            { label: 'Logement — guide nouvel arrivant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC — Location (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'PadMapper (officiel)', url: EXTERNAL.padmapper },
            { label: 'Zumper — annonces Canada', url: EXTERNAL.zumper },
            { label: 'Kijiji — immobilier (officiel)', url: EXTERNAL.kijiji },
            { label: 'TAL — droits locataires Québec (officiel)', url: EXTERNAL.talQC },
            { label: 'LTB — droits locataires Ontario (officiel)', url: EXTERNAL.ltbON },
          ],
          checkItems: [
            { id: 'prepare_file', label: 'Préparer le "dossier locataire" (ID, preuves, contacts).' },
            { id: 'search', label: 'Faire une shortlist (quartier, budget, accès transport).' },
            { id: 'visit', label: 'Visiter et signer un bail écrit si vous décidez.' },
          ],
        },
        // ── Étape 9 ──
        {
          id: 'job',
          title: 'Recherche d\'emploi',
          description: 'Adapter votre CV au format canadien et entamer vos démarches. Les organismes spécialisés peuvent vous accompagner gratuitement.',
          when: 'Mois 1',
          documents: ['CV (format Canada)', 'Profil LinkedIn', 'NAS'],
          links: [
            { label: 'Job Bank — emplois Canada (officiel)', url: OFFICIAL.jobBank },
            { label: 'Indeed Canada (officiel)', url: EXTERNAL.indeed },
            { label: 'LinkedIn Canada (officiel)', url: EXTERNAL.linkedin },
            { label: 'ACCES Employment — aide à l\'emploi', url: EXTERNAL.acces },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'cv', label: 'Adapter votre CV au format canadien (1–2 pages, résultats).' },
            { id: 'apply', label: 'Postuler à des offres ciblées et suivre vos candidatures.' },
          ],
        },
        // ── Étape 10 ──
        {
          id: 'settlement',
          title: 'Services d\'intégration (organismes)',
          description: 'Cours de langue gratuits, orientation, aide à l\'emploi, services sociaux. Ces services financés par IRCC sont gratuits pour les résidents permanents.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Trouver un service d\'établissement — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Ressources essentielles (CAPITUNE)', url: CAPITUNE_RESOURCES.newcomerIndex },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver un organisme d\'établissement proche de vous.' },
            { id: 'contact', label: 'Prendre contact et réserver un premier rendez-vous.' },
          ],
        },
        // ── Étape 11 ──
        {
          id: 'pr_card',
          title: 'Carte de résident permanent & statut',
          description: 'Sécuriser vos documents de statut originaux et faire le suivi de l\'émission de votre carte RP. Nécessaire pour voyager et re-rentrer au Canada.',
          when: 'Mois 1–3',
          documents: ['CoPR / preuves de statut', 'Adresse canadienne à jour'],
          links: [
            { label: 'Carte de résident permanent — IRCC (officiel)', url: OFFICIAL.prCardIRCC },
            { label: 'S\'établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Entrée express — immigrer au Canada (officiel)', url: OFFICIAL.expressEntry },
            { label: 'Programmes provinciaux/territoriaux — PNP (officiel)', url: OFFICIAL.pnp },
          ],
          checkItems: [
            { id: 'secure', label: 'Mettre vos documents originaux en lieu sûr (CoPR, etc.).' },
            { id: 'track', label: 'Suivre l\'état de la demande de carte RP.' },
            { id: 'address', label: 'Mettre à jour votre adresse auprès d\'IRCC si elle change.' },
          ],
        },
        // ── Étape 12 ──
        {
          id: 'tax',
          title: 'Impôts & fiscalité',
          description: 'Même sans revenus la première année, déclarer peut vous donner droit à des crédits (TPS/TVH, Allocation canadienne). La date limite est généralement le 30 avril.',
          when: 'Mois 3 (puis annuel)',
          documents: ['NAS', 'T4 / feuillets fiscaux (si applicable)', 'Reçus de dépenses déductibles'],
          links: [
            { label: 'Nouveaux arrivants — ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'Renseignements généraux — ARC (officiel)', url: OFFICIAL.craNewcomers },
            { label: 'Mon dossier CRA — en ligne (officiel)', url: OFFICIAL.craMyAccount },
            { label: 'Wealthsimple Tax — déclaration gratuite en ligne', url: EXTERNAL.wealthsimpleTax },
          ],
          checkItems: [
            { id: 'understand', label: 'Comprendre vos obligations fiscales (résidence, revenus mondiaux).' },
            { id: 'plan', label: 'Rassembler les feuillets et planifier la déclaration.' },
            { id: 'file', label: 'Produire la déclaration (ou se faire aider).' },
          ],
        },
      ];

    case 'student':
      return [
        // ── Étape 1 ──
        {
          id: 'airport',
          title: 'Arrivée à l’aéroport',
          description: 'Franchir le contrôle des frontières et obtenir votre permis d’études physique. Vérifiez attentivement les conditions inscrites sur le permis.',
          when: 'Jour 0',
          documents: ['Passeport valide', 'Lettre d’introduction IRCC', 'Lettre d’admission', 'Preuve de fonds', 'Adresse au Canada'],
          links: [
            { label: 'ASFC — Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Arriver avec un permis d’études — IRCC (officiel)', url: OFFICIAL.studyPermitConditions },
            { label: 'Étudier au Canada — IRCC (officiel)', url: OFFICIAL.studyIRCC },
          ],
          checkItems: [
            { id: 'present_docs', label: 'Présenter passeport, lettre IRCC et lettre d’admission.' },
            { id: 'receive_permit', label: 'Recevoir le permis d’études et vérifier dates/conditions.' },
          ],
        },
        // ── Étape 1b : Transport aéroport ──
        {
          id: 'airport_transport',
          title: 'Transport : aéroport → hébergement',
          description: 'Organisez votre trajet de l’aéroport au logement. Uber est disponible dans la majorité des aéroports canadiens (zone de prise en charge dédiée, distincte des taxis). Les taxis officiels sont réglementés et affichent un tarif fixe depuis les aéroports dans plusieurs villes.',
          when: 'Jour 0',
          documents: ['Téléphone chargé + internet (Wi-Fi aéroport ou SIM locale)', 'Adresse du logement temporaire'],
          links: [
            { label: 'Uber Canada — réserver un trajet', url: EXTERNAL.uber },
            { label: 'InDriver Canada — tarifs négociés', url: EXTERNAL.inDriver },
            { label: 'Transports aéroport Montréal / YUL (officiel)', url: EXTERNAL.yulTransport },
            { label: 'Transports aéroport Toronto / YYZ (officiel)', url: EXTERNAL.yyzTransport },
            { label: 'Transports aéroport Vancouver / YVR (officiel)', url: EXTERNAL.yvrTransport },
          ],
          checkItems: [
            { id: 'address_ready', label: 'Avoir l’adresse du logement disponible (message, courriel ou note).' },
            { id: 'choose_ride', label: 'Choisir Uber, InDriver, navette ou taxi officiel selon la ville.' },
            { id: 'pickup_zone', label: 'Repérer la zone de prise en charge : Uber/rideshare ≠ taxi (panneaux à la sortie baggages).' },
            { id: 'set_destination', label: 'Saisir l’adresse ou montrer la note au chauffeur.' },
          ],
        },
        // ── Étape 2 ──
        {
          id: 'temp_housing',
          title: 'Hébergement temporaire',
          description: 'Les premiers jours, préférez une résidence étudiante, un Airbnb ou une auberge proche du campus. Notez l’adresse pour vos premières démarches.',
          when: 'Jour 1–7',
          documents: ['Pièce d’identité', 'Moyen de paiement'],
          links: [
            { label: 'Logement — guide étudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'Airbnb Canada (officiel)', url: EXTERNAL.airbnb },
            { label: 'Kijiji — logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'SCHL/CMHC — Louer au Canada (officiel)', url: EXTERNAL.cmhcRent },
          ],
          checkItems: [
            { id: 'choose_option', label: 'Choisir une option d’hébergement temporaire.' },
            { id: 'confirm', label: 'Confirmer l’adresse.' },
          ],
        },
        // ── Étape 3 ──
        {
          id: 'study_basics',
          title: 'Comprendre votre permis d’études',
          description: 'Le permis précise si vous pouvez travailler hors campus, les heures autorisées et l’établissement désigné. Ne pas le respecter peut affecter votre statut.',
          when: 'Semaine 1',
          documents: ['Permis d’études', 'Passeport'],
          links: [
            { label: 'Conditions du permis d’études — IRCC (officiel)', url: OFFICIAL.studyPermitConditions },
            { label: 'Renouveler le permis — IRCC (officiel)', url: OFFICIAL.studyPermitRenew },
            { label: 'Liste des DLI (EED) — IRCC (officiel)', url: OFFICIAL.dliListIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire toutes les conditions inscrites sur le permis.' },
            { id: 'calendar', label: 'Noter les dates clés (expiration, renouvellement 2 mois avant).' },
            { id: 'work_rights', label: 'Vérifier les droits de travail autorisés.' },
          ],
        },
        // ── Étape 4 ──
        {
          id: 'campus',
          title: 'Inscription & intégration campus',
          description: 'Finaliser l’inscription, obtenir la carte étudiante, activer les outils numériques et repérer les services du campus (santé, aide, emploi).',
          when: 'Semaine 1–4',
          documents: ['Lettre d’admission', 'Numéro étudiant', 'Pièce d’identité'],
          links: [
            { label: 'Liste officielle des établissements désignés — IRCC', url: OFFICIAL.dliListIRCC },
            { label: 'Étudier au Canada — IRCC (officiel)', url: OFFICIAL.studyIRCC },
          ],
          checkItems: [
            { id: 'register', label: 'Finaliser l’inscription et payer les frais si requis.' },
            { id: 'student_card', label: 'Obtenir la carte étudiante.' },
            { id: 'portal', label: 'Activer le portail académique, le courriel et les outils numériques.' },
            { id: 'services', label: 'Repérer les services campus (santé, aide, emploi, international).' },
          ],
        },
        // ── Étape 5 ──
        {
          id: 'phone',
          title: 'Téléphone & internet',
          description: 'Un numéro canadien est requis pour la banque, le logement et les démarches du campus. Commencez par un forfait prépayé ou sans engagement.',
          when: 'Semaine 1',
          documents: ['Pièce d’identité', 'Moyen de paiement'],
          links: [
            { label: 'Téléphonie — guide étudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Koodo — forfaits abordables', url: EXTERNAL.koodo },
            { label: 'Fido — forfaits', url: EXTERNAL.fido },
            { label: 'Fizz — prépayé / mensuel', url: EXTERNAL.fizz },
            { label: 'Public Mobile — prépayé abordable', url: EXTERNAL.publicMobile },
          ],
          checkItems: [
            { id: 'choose', label: 'Choisir un forfait adapté au budget étudiant.' },
            { id: 'activate', label: 'Activer la SIM/eSIM et tester appels + données.' },
          ],
        },
        // ── Étape 6 ──
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Renseignez-vous sur les tarifs étudiants. Beaucoup d’établissements ont des ententes avec les réseaux locaux.',
          when: 'Semaine 1–2',
          documents: ['Carte étudiante (selon réseau)'],
          links: [
            { label: 'Transports — guide étudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM — Montréal (officiel)', url: EXTERNAL.stm },
            { label: 'TTC — Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink — Vancouver (officiel)', url: EXTERNAL.translink },
            { label: 'OC Transpo — Ottawa (officiel)', url: EXTERNAL.octranspo },
            { label: 'EXO — Montréal grandes lignes (officiel)', url: EXTERNAL.exo },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le réseau et les tarifs étudiants.' },
            { id: 'card', label: 'Obtenir un abonnement ou une carte rechargeable.' },
          ],
        },
        // ── Étape 7 ──
        {
          id: 'bank',
          title: 'Ouvrir un compte bancaire',
          description: 'Gérer vos dépenses et recevoir les virements. Plusieurs banques offrent des comptes étudiants sans frais.',
          when: 'Semaine 1–2',
          documents: ['Passeport', 'Permis d’études', 'Adresse canadienne (si disponible)'],
          links: [
            { label: 'Banques — guide étudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.banks },
            { label: 'Ouvrir un compte — ACFC (officiel)', url: OFFICIAL.fcac },
            { label: 'RBC Nouveaux arrivants / étudiants', url: EXTERNAL.rbcNewcomers },
            { label: 'TD Nouveaux arrivants / étudiants', url: EXTERNAL.tdNewcomers },
            { label: 'BMO Nouveaux arrivants', url: EXTERNAL.bmoNewcomers },
            { label: 'Simplii — compte sans frais', url: EXTERNAL.simplii },
          ],
          checkItems: [
            { id: 'compare', label: 'Comparer les offres « étudiant / nouvel arrivant ».' },
            { id: 'open', label: 'Ouvrir le compte et configurer les notifications.' },
          ],
        },
        // ── Étape 8 ──
        {
          id: 'sin',
          title: 'NAS/SIN (si vous travaillez)',
          description: 'Le permis d’études autorise le travail hors campus jusqu’à 24h/semaine en session. Obtenez le NAS avant tout emploi rémunéré.',
          when: 'Semaine 1–3',
          documents: ['Passeport', 'Permis d’études'],
          links: [
            { label: 'Demander un NAS — Service Canada (officiel)', url: OFFICIAL.sinServiceCanada },
            { label: 'Trouver un bureau Service Canada', url: OFFICIAL.serviceCanadaOffices },
          ],
          checkItems: [
            { id: 'eligibility', label: 'Vérifier que le permis autorise le travail.' },
            { id: 'apply', label: 'Faire la demande de NAS auprès de Service Canada.' },
          ],
        },
        // ── Étape 9 ──
        {
          id: 'address',
          title: 'Logement stable (proche campus)',
          description: 'Sécuriser un bail ou une résidence étudiante pour l’année. Comparez : résidence campus, coloc, appartement.',
          when: 'Mois 1',
          documents: ['Pièce d’identité', 'Preuve d’inscription', 'Garant (si demandé)'],
          links: [
            { label: 'Logement — guide étudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC — Location (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'Kijiji — logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'TAL — droits locataires Québec (officiel)', url: EXTERNAL.talQC },
            { label: 'LTB — droits locataires Ontario (officiel)', url: EXTERNAL.ltbON },
          ],
          checkItems: [
            { id: 'budget', label: 'Fixer un budget logement (loyer + services + alimentation).' },
            { id: 'shortlist', label: 'Lister 5–10 annonces proches du campus ou du transport.' },
            { id: 'bail', label: 'Signer un bail écrit et en conserver une copie.' },
          ],
        },
        // ── Étape 10 ──
        {
          id: 'job',
          title: 'Emploi à temps partiel (si applicable)',
          description: 'Les étudiants internationaux peuvent travailler jusqu’à 24h/semaine et à temps plein lors des congés. Priorisez les offres campus.',
          when: 'Mois 1–3',
          documents: ['NAS', 'CV (format Canada)', 'Horaire de cours'],
          links: [
            { label: 'Job Bank — emplois Canada (officiel)', url: OFFICIAL.jobBank },
            { label: 'Indeed Canada (officiel)', url: EXTERNAL.indeed },
            { label: 'LinkedIn Canada (officiel)', url: EXTERNAL.linkedin },
          ],
          checkItems: [
            { id: 'cv', label: 'Préparer le CV (format canadien, 1 page).' },
            { id: 'apply', label: 'Cibler des offres compatibles avec l’horaire de cours.' },
          ],
        },
        // ── Étape 11 ──
        {
          id: 'settlement',
          title: 'Services d’intégration (campus & organismes)',
          description: 'Les bureaux « International Students » offrent orientation et ateliers. Des organismes offrent cours de français/anglais gratuits.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d’établissement — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Ressources essentielles (CAPITUNE)', url: CAPITUNE_RESOURCES.newcomerIndex },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver les services internationaux de votre campus.' },
            { id: 'contact', label: 'Contacter un organisme d’établissement externe.' },
          ],
        },
        // ── Étape 12 ──
        {
          id: 'tax',
          title: 'Impôts & fiscalité',
          description: 'Même avec de petits revenus, déclarer peut donner droit à des crédits. Le T2202 (reçu de frais de scolarité) réduit l’impôt.',
          when: 'Mois 3 (puis annuel)',
          documents: ['NAS', 'T4 / reçus de revenus (si applicable)', 'Reçu T2202 (frais scolaires)'],
          links: [
            { label: 'Nouveaux arrivants — ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'Mon dossier CRA (officiel)', url: OFFICIAL.craMyAccount },
            { label: 'Wealthsimple Tax — déclaration gratuite', url: EXTERNAL.wealthsimpleTax },
          ],
          checkItems: [
            { id: 'understand', label: 'Comprendre les obligations (résidence fiscale, revenus).' },
            { id: 't2202', label: 'Télécharger le reçu T2202 sur le portail étudiant.' },
            { id: 'plan', label: 'Produire la déclaration ou se faire aider via le campus.' },
          ],
        },
      ];

    // ─── TRAVAILLEUR TEMPORAIRE ──────────────────────────────────────────
    case 'worker':
      return [
        // ── Étape 1 ──
        {
          id: 'airport',
          title: 'Arrivée à l’aéroport',
          description: 'Franchir le contrôle des frontières et obtenir votre permis de travail physique. Vérifiez les conditions (employeur, poste, dates).',
          when: 'Jour 0',
          documents: ['Passeport valide', 'Lettre d’introduction IRCC', 'Offre d’emploi / contrat', 'Adresse au Canada'],
          links: [
            { label: 'ASFC — Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Permis de travail — IRCC (officiel)', url: OFFICIAL.workPermitIRCC },
          ],
          checkItems: [
            { id: 'present_docs', label: 'Présenter passeport, lettre IRCC + offre/contrat.' },
            { id: 'receive_permit', label: 'Recevoir le permis de travail et vérifier les conditions.' },
          ],
        },
        // ── Étape 1b : Transport aéroport ──
        {
          id: 'airport_transport',
          title: 'Transport : aéroport → hébergement',
          description: 'Organisez votre trajet de l’aéroport au logement. Uber est disponible dans la majorité des aéroports canadiens (zone de prise en charge dédiée, distincte des taxis). Les taxis officiels sont réglementés et affichent un tarif fixe depuis les aéroports dans plusieurs villes.',
          when: 'Jour 0',
          documents: ['Téléphone chargé + internet (Wi-Fi aéroport ou SIM locale)', 'Adresse du logement temporaire'],
          links: [
            { label: 'Uber Canada — réserver un trajet', url: EXTERNAL.uber },
            { label: 'InDriver Canada — tarifs négociés', url: EXTERNAL.inDriver },
            { label: 'Transports aéroport Montréal / YUL (officiel)', url: EXTERNAL.yulTransport },
            { label: 'Transports aéroport Toronto / YYZ (officiel)', url: EXTERNAL.yyzTransport },
            { label: 'Transports aéroport Vancouver / YVR (officiel)', url: EXTERNAL.yvrTransport },
          ],
          checkItems: [
            { id: 'address_ready', label: 'Avoir l’adresse du logement disponible (message, courriel ou note).' },
            { id: 'choose_ride', label: 'Choisir Uber, InDriver, navette ou taxi officiel selon la ville.' },
            { id: 'pickup_zone', label: 'Repérer la zone de prise en charge : Uber/rideshare ≠ taxi (panneaux à la sortie baggages).' },
            { id: 'set_destination', label: 'Saisir l’adresse ou montrer la note au chauffeur.' },
          ],
        },
        // ── Étape 2 ──
        {
          id: 'temp_housing',
          title: 'Hébergement temporaire',
          description: 'Stabiliser un premier toit (Airbnb, hôtel, proches) pendant la recherche de logement. Confirmez une adresse pour les démarches.',
          when: 'Jour 1–7',
          documents: ['Pièce d’identité', 'Moyen de paiement'],
          links: [
            { label: 'Logement — guide (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'Airbnb Canada (officiel)', url: EXTERNAL.airbnb },
            { label: 'Kijiji — logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
          ],
          checkItems: [
            { id: 'choose_option', label: 'Choisir une option d’hébergement temporaire.' },
            { id: 'confirm', label: 'Confirmer et noter l’adresse.' },
          ],
        },
        // ── Étape 3 ──
        {
          id: 'work_permit',
          title: 'Comprendre votre permis de travail',
          description: 'Distinguez permis ouvert (tout employeur) et fermé (employeur spécifique). Respecter les conditions évite des problèmes de statut.',
          when: 'Semaine 1',
          documents: ['Permis de travail', 'Passeport'],
          links: [
            { label: 'Conditions du permis de travail — IRCC (officiel)', url: OFFICIAL.workPermitIRCC },
            { label: 'Renouveler / modifier le permis — IRCC (officiel)', url: OFFICIAL.workPermitRenew },
            { label: 'Travailler au Canada — IRCC (officiel)', url: OFFICIAL.workIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les conditions de votre permis (employeur, poste, lieu).' },
            { id: 'dates', label: 'Noter les dates d’expiration et prévoir le renouvellement 2 mois avant.' },
          ],
        },
        // ── Étape 4 ──
        {
          id: 'rights',
          title: 'Droits & protections au travail',
          description: 'Vous avez les mêmes droits qu’un travailleur canadien. Connaissez les recours si vos droits ne sont pas respectés.',
          when: 'Semaine 1–2',
          documents: ['Contrat de travail', 'Coordonnées de l’employeur'],
          links: [
            { label: 'Droits des travailleurs étrangers — EDSC (officiel)', url: OFFICIAL.tfwRights },
            { label: 'Programme des travailleurs étrangers — EDSC (officiel)', url: OFFICIAL.tfwESDC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les informations officielles sur vos droits.' },
            { id: 'keep_contract', label: 'Conserver le contrat, les bulletins de paie et preuves d’heures.' },
          ],
        },
        // ── Étape 5 ──
        {
          id: 'sin',
          title: 'Numéro d’assurance sociale (NAS)',
          description: 'Requis avant d’être payé. Faites la demande dans les premiers jours. Votre NAS est lié à votre permis.',
          when: 'Semaine 1',
          documents: ['Passeport', 'Permis de travail'],
          links: [
            { label: 'Demander un NAS — Service Canada (officiel)', url: OFFICIAL.sinServiceCanada },
            { label: 'Trouver un bureau Service Canada', url: OFFICIAL.serviceCanadaOffices },
          ],
          checkItems: [
            { id: 'prepare_docs', label: 'Préparer les documents requis.' },
            { id: 'apply', label: 'Faire la demande de NAS.' },
          ],
        },
        // ── Étape 6 ──
        {
          id: 'bank',
          title: 'Ouvrir un compte bancaire',
          description: 'Indispensable pour recevoir votre salaire. Plusieurs banques accueillent les travailleurs sans historique canadien.',
          when: 'Semaine 1–2',
          documents: ['Passeport', 'Permis de travail', 'Adresse canadienne'],
          links: [
            { label: 'Banques — guide (CAPITUNE)', url: CAPITUNE_RESOURCES.banks },
            { label: 'Ouvrir un compte — ACFC (officiel)', url: OFFICIAL.fcac },
            { label: 'RBC Nouveaux arrivants', url: EXTERNAL.rbcNewcomers },
            { label: 'TD Nouveaux arrivants', url: EXTERNAL.tdNewcomers },
            { label: 'Scotiabank Se lancer au Canada', url: EXTERNAL.scotiabankNewcomers },
            { label: 'BMO Nouveaux arrivants', url: EXTERNAL.bmoNewcomers },
          ],
          checkItems: [
            { id: 'compare', label: 'Comparer 2–3 banques (frais, dépôt de paie direct).' },
            { id: 'open', label: 'Ouvrir le compte et fournir les infos de dépôt direct à l’employeur.' },
          ],
        },
        // ── Étape 7 ──
        {
          id: 'health',
          title: 'Assurance maladie provinciale',
          description: 'Certaines provinces ont une période d’attente. Souscrivez une assurance privée transitoire si c’est le cas.',
          when: 'Semaine 1–3',
          documents: ['Pièce d’identité', 'Preuve de résidence (selon province)'],
          links: [
            { label: 'RAMQ — Québec (officiel)', url: EXTERNAL.ramq },
            { label: 'OHIP — Ontario (officiel)', url: EXTERNAL.ohip },
            { label: 'MSP — Colombie-Britannique (officiel)', url: EXTERNAL.mspBC },
            { label: 'AHCIP — Alberta (officiel)', url: EXTERNAL.ahcipAB },
          ],
          checkItems: [
            { id: 'identify_province', label: 'Identifier la démarche de votre province.' },
            { id: 'apply', label: 'Déposer la demande de couverture santé.' },
            { id: 'interim', label: 'Si période d’attente : souscrire une assurance temporaire.' },
          ],
        },
        // ── Étape 8 ──
        {
          id: 'phone',
          title: 'Téléphone & internet',
          description: 'Utile pour l’employeur, la banque et les démarches. Optez pour un forfait sans engagement au début.',
          when: 'Semaine 1',
          documents: ['Pièce d’identité', 'Moyen de paiement'],
          links: [
            { label: 'Téléphonie — guide (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Koodo — forfaits', url: EXTERNAL.koodo },
            { label: 'Fido — forfaits', url: EXTERNAL.fido },
            { label: 'Public Mobile — prépayé', url: EXTERNAL.publicMobile },
          ],
          checkItems: [
            { id: 'choose', label: 'Choisir un forfait et activer la ligne.' },
          ],
        },
        // ── Étape 9 ──
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Carte transport, applis officielles. Certains employeurs remboursent les frais de transport.',
          when: 'Semaine 1–2',
          documents: [],
          links: [
            { label: 'Transports — guide (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM — Montréal (officiel)', url: EXTERNAL.stm },
            { label: 'TTC — Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink — Vancouver (officiel)', url: EXTERNAL.translink },
            { label: 'OC Transpo — Ottawa (officiel)', url: EXTERNAL.octranspo },
            { label: 'EXO — Montréal grandes lignes (officiel)', url: EXTERNAL.exo },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le réseau officiel.' },
            { id: 'card', label: 'Obtenir/recharger une carte de transport.' },
          ],
        },
        // ── Étape 10 ──
        {
          id: 'housing_perm',
          title: 'Logement permanent',
          description: 'Chercher un logement stable avec un bail. Préparez un dossier locataire (preuves de revenus, ID).',
          when: 'Mois 1',
          documents: ['Pièce d’identité', 'Preuve de revenus (lettre employeur / talons de paie)'],
          links: [
            { label: 'Logement — guide (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC — Location (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'PadMapper (officiel)', url: EXTERNAL.padmapper },
            { label: 'TAL — droits locataires Québec (officiel)', url: EXTERNAL.talQC },
            { label: 'LTB — droits locataires Ontario (officiel)', url: EXTERNAL.ltbON },
          ],
          checkItems: [
            { id: 'prepare_file', label: 'Préparer le dossier locataire.' },
            { id: 'search', label: 'Shortlist et visites.' },
            { id: 'bail', label: 'Signer un bail écrit.' },
          ],
        },
        // ── Étape 11 ──
        {
          id: 'job_opportunities',
          title: 'Évolution de carrière & opportunités',
          description: 'Même avec un emploi, renseignez-vous sur vos perspectives. Certains permis permettent de changer d’employeur ou mènent à la résidence permanente.',
          when: 'Mois 1–3',
          documents: ['CV à jour', 'NAS'],
          links: [
            { label: 'Job Bank — emplois Canada (officiel)', url: OFFICIAL.jobBank },
            { label: 'LinkedIn Canada (officiel)', url: EXTERNAL.linkedin },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
            { label: 'Entrée express — IRCC (officiel)', url: OFFICIAL.expressEntry },
          ],
          checkItems: [
            { id: 'cv', label: 'Mettre à jour le CV (format canadien).' },
            { id: 'market', label: 'Repérer les offres et salaires de référence.' },
            { id: 'pr_path', label: 'Vérifier l’admissibilité à la résidence permanente.' },
          ],
        },
        // ── Étape 12 ──
        {
          id: 'settlement',
          title: 'Services d’intégration',
          description: 'Les organismes locaux aident à l’emploi, à l’apprentissage des langues et à l’intégration — utile même en statut temporaire.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d’établissement — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver un organisme d’établissement local.' },
            { id: 'contact', label: 'Prendre contact et consulter les services disponibles.' },
          ],
        },
        // ── Étape 13 ──
        {
          id: 'tax',
          title: 'Impôts & fiscalité',
          description: 'En tant que travailleur, vous êtes imposable sur vos revenus canadiens. Déclarez annuellement et vérifiez les crédits (TPS/TVH, dépenses).',
          when: 'Mois 3 (puis annuel)',
          documents: ['NAS', 'T4 (billet de paie annuel)', 'Reçus de dépenses déductibles'],
          links: [
            { label: 'Nouveaux arrivants — ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'Mon dossier CRA — en ligne (officiel)', url: OFFICIAL.craMyAccount },
            { label: 'Assurance-emploi — EDSC (officiel)', url: OFFICIAL.eiServiceCanada },
            { label: 'Wealthsimple Tax — déclaration gratuite', url: EXTERNAL.wealthsimpleTax },
          ],
          checkItems: [
            { id: 'understand', label: 'Comprendre les bases (T4, retenues, crédits).' },
            { id: 'plan', label: 'Rassembler les feuillets et préparer la déclaration.' },
            { id: 'ei', label: 'Vérifier les droits à l’assurance-emploi si applicable.' },
          ],
        },
      ];

    // ─── DEMANDEUR D'ASILE ───────────────────────────────────────────
    case 'asylum':
      return [
        // ── Étape 1 ──
        {
          id: 'airport',
          title: 'Arrivée & déclaration d’asile',
          description: 'Déclarez clairement votre intention à l’agent des services frontaliers. Un formulaire sera rempli et votre demande sera initialisée. Gardez tous vos documents.',
          when: 'Jour 0',
          documents: ['Passeport (si disponible)', 'Pièces d’identité (disponibles)', 'Preuves de persécution (si disponibles)'],
          links: [
            { label: 'ASFC — Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Demander l’asile — IRCC (officiel)', url: OFFICIAL.asylumIRCC },
            { label: 'Processus d’octroi de l’asile — IRCC (officiel)', url: OFFICIAL.asylumProcess },
          ],
          checkItems: [
            { id: 'declare', label: 'Indiquer clairement votre intention de demander la protection.' },
            { id: 'follow', label: 'Suivre les instructions de l’agent (entrevue, documents, formulaires).' },
            { id: 'keep_docs', label: 'Conserver tous les documents remis par l’ASFC.' },
          ],
        },
        // ── Étape 1b : Transport aéroport ──
        {
          id: 'airport_transport',
          title: 'Transport : aéroport → hébergement',
          description: 'Organisez votre trajet de l’aéroport au logement. Uber est disponible dans la majorité des aéroports canadiens (zone de prise en charge dédiée, distincte des taxis). Les taxis officiels sont réglementés et affichent un tarif fixe depuis les aéroports dans plusieurs villes.',
          when: 'Jour 0',
          documents: ['Téléphone chargé + internet (Wi-Fi aéroport ou SIM locale)', 'Adresse du logement temporaire'],
          links: [
            { label: 'Uber Canada — réserver un trajet', url: EXTERNAL.uber },
            { label: 'InDriver Canada — tarifs négociés', url: EXTERNAL.inDriver },
            { label: 'Transports aéroport Montréal / YUL (officiel)', url: EXTERNAL.yulTransport },
            { label: 'Transports aéroport Toronto / YYZ (officiel)', url: EXTERNAL.yyzTransport },
            { label: 'Transports aéroport Vancouver / YVR (officiel)', url: EXTERNAL.yvrTransport },
          ],
          checkItems: [
            { id: 'address_ready', label: 'Avoir l’adresse du logement disponible (message, courriel ou note).' },
            { id: 'choose_ride', label: 'Choisir Uber, InDriver, navette ou taxi officiel selon la ville.' },
            { id: 'pickup_zone', label: 'Repérer la zone de prise en charge : Uber/rideshare ≠ taxi (panneaux à la sortie baggages).' },
            { id: 'set_destination', label: 'Saisir l’adresse ou montrer la note au chauffeur.' },
          ],
        },
        // ── Étape 2 ──
        {
          id: 'temp_housing',
          title: 'Hébergement & sécurité',
          description: 'Stabiliser un hébergement sûr et obtenir une adresse de contact fiable pour recevoir les communications officielles.',
          when: 'Jour 1–7',
          documents: [],
          links: [
            { label: 'Réfugiés & asile — IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
            { label: 'S’établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Logement — ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
          ],
          checkItems: [
            { id: 'safe_place', label: 'Trouver un hébergement sûr.' },
            { id: 'contact', label: 'Avoir une adresse et un numéro pour les communications officielles.' },
          ],
        },
        // ── Étape 3 ──
        {
          id: 'health',
          title: 'Soins de santé (PFSI/IFHP)',
          description: 'Le Programme fédéral de santé intérimaire offre une couverture de base aux demandeurs d’asile. Vérifiez votre admissibilité rapidement.',
          when: 'Semaine 1',
          documents: [],
          links: [
            { label: 'Programme fédéral de santé intérimaire — IRCC (officiel)', url: OFFICIAL.ifhpIRCC },
            { label: 'Réfugiés — IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
          ],
          checkItems: [
            { id: 'check', label: 'Vérifier l’admissibilité au PFSI/IFHP.' },
            { id: 'use', label: 'Savoir comment utiliser la couverture (clinique, pharmacie).' },
          ],
        },
        // ── Étape 4 ──
        {
          id: 'phone',
          title: 'Téléphone & communication',
          description: 'Un numéro de téléphone est essentiel pour recevoir les convocations officielles (CISR, IRCC) et accéder aux services.',
          when: 'Semaine 1',
          documents: [],
          links: [
            { label: 'Téléphonie — ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Public Mobile — prépayé abordable', url: EXTERNAL.publicMobile },
            { label: 'Fizz — prépayé abordable', url: EXTERNAL.fizz },
          ],
          checkItems: [
            { id: 'line', label: 'Obtenir et activer une ligne téléphonique.' },
            { id: 'update', label: 'Communiquer le numéro aux autorités (IRCC, CISR).' },
          ],
        },
        // ── Étape 5 ──
        {
          id: 'irb',
          title: 'Processus CISR / IRB',
          description: 'La Commission de l’immigration et du statut de réfugié (CISR) étudiera votre demande lors d’une audience. Préparez-vous avec l’aide d’un avocat ou consultant.',
          when: 'Mois 1–6',
          documents: ['Documents d’identité', 'Preuves de persécution', 'Formulaire de renseignements personnels'],
          links: [
            { label: 'CISR / IRB — Site officiel', url: OFFICIAL.irb },
            { label: 'Processus SPR — CISR (officiel)', url: OFFICIAL.irbProcess },
            { label: 'Demande d’asile — IRCC (officiel)', url: OFFICIAL.asylumIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire le processus officiel et les délais.' },
            { id: 'lawyer', label: 'Consulter un avocat ou représentant accrédité.' },
            { id: 'prepare', label: 'Organiser les documents et preuves à présenter.' },
          ],
        },
        // ── Étape 6 ──
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Organiser vos déplacements pour les rendez-vous officiels, les services et les besoins quotidiens.',
          when: 'Semaine 1–2',
          documents: [],
          links: [
            { label: 'Transports — ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM — Montréal (officiel)', url: EXTERNAL.stm },
            { label: 'TTC — Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink — Vancouver (officiel)', url: EXTERNAL.translink },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le réseau local officiel.' },
            { id: 'card', label: 'Obtenir une carte ou abonnement.' },
          ],
        },
        // ── Étape 7 ──
        {
          id: 'housing_perm',
          title: 'Logement (stabilisation)',
          description: 'Chercher une solution de logement plus stable. Des organismes locaux peuvent aider à accéder à des ressources.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Logement — ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC — logement (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'S’établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'plan', label: 'Identifier une solution de logement plus stable.' },
          ],
        },
        // ── Étape 8 ──
        {
          id: 'settlement',
          title: 'Organismes d’établissement & aide locale',
          description: 'Des organismes offrent aide juridique, cours de langue, orientation, emploi et services sociaux gratuits pour les demandeurs d’asile.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d’établissement — IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Réfugiés — IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
            { label: 'COSTI — Toronto (services d’établissement)', url: EXTERNAL.costiToronto },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver un organisme local offrant aide aux réfugiés/asile.' },
            { id: 'legal', label: 'Obtenir une aide juridique si possible (pour l’audience CISR).' },
          ],
        },
        // ── Étape 9 ──
        {
          id: 'tax',
          title: 'Démarches administratives & fiscalité',
          description: 'Selon votre situation, certaines démarches administratives et fiscales peuvent s’appliquer. Consultez les ressources officielles.',
          when: 'Mois 3+',
          documents: [],
          links: [
            { label: 'Nouveaux arrivants — ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'S’établir au Canada — IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les informations officielles applicables à votre situation.' },
          ],
        },
      ];

    default:
      return [];
  }
}

export default function NouvelArrivantScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session, updateSession } = useCapiSession();
  const stage = session.arrivalStage ?? null;

  const steps = useMemo(() => (stage ? buildIntegrationSteps(stage) : []), [stage]);

  const doneKeys = useMemo(() => {
    if (!stage) return [] as string[];
    const raw = session.arrivalChecklist?.[stage];
    return Array.isArray(raw) ? raw : [];
  }, [session.arrivalChecklist, stage]);

  const doneSet = useMemo(() => new Set(doneKeys), [doneKeys]);

  const isDone = (stepId: string, itemId: string) => doneSet.has(`${stepId}:${itemId}`);

  const toggleCheckItem = (stepId: string, itemId: string) => {
    if (!stage) return;
    const key = `${stepId}:${itemId}`;
    const current = Array.isArray(session.arrivalChecklist?.[stage]) ? (session.arrivalChecklist?.[stage] as string[]) : [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    updateSession({ arrivalChecklist: { ...(session.arrivalChecklist ?? {}), [stage]: next } });
  };

  const stepStats = useMemo(() => {
    const byStep: Record<string, { done: number; total: number; allDone: boolean }> = {};
    for (const s of steps) {
      const total = s.checkItems.length;
      const done = s.checkItems.reduce((acc, ci) => (isDone(s.id, ci.id) ? acc + 1 : acc), 0);
      const allDone = total === 0 ? true : done >= total;
      byStep[s.id] = { done, total, allDone };
    }
    return byStep;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, doneKeys]);

  const overall = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const s of steps) {
      total += s.checkItems.length;
      done += s.checkItems.reduce((acc, ci) => (isDone(s.id, ci.id) ? acc + 1 : acc), 0);
    }
    return { total, done, progress: total > 0 ? done / total : 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, doneKeys]);

  const pages: Page[] = useMemo(() => {
    const out: Page[] = [{ key: 'pick', kind: 'pick' }];
    if (!stage) return out;
    for (const s of steps) {
      out.push({ key: `step:${s.id}`, kind: 'step', stepId: s.id });
    }
    out.push({ key: 'finish', kind: 'finish' });
    return out;
  }, [stage, steps]);

  const listRef = useRef<FlatList<Page>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Quand le statut change, on revient sur la page de sélection.
    setIndex(0);
    setTimeout(() => listRef.current?.scrollToIndex({ index: 0, animated: false }), 0);
  }, [stage]);


  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
    listRef.current?.scrollToIndex({ index: clamped, animated: true });
    setIndex(clamped);
  };

  const selectStage = (next: ArrivalStage) => {
    updateSession({ arrivalStage: next });
  };

  const openOfficial = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Lien indisponible', url);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir ce lien.");
    }
  };



  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (index > 0) goToIndex(index - 1);
            else router.back();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${Math.round(overall.progress * 100)}%` }]} />
        </View>
        <Text style={styles.stepLabel}>{Math.round(overall.progress * 100)}%</Text>
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(p) => p.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          const clamped = Math.max(0, Math.min(pages.length - 1, nextIndex));
          setIndex(clamped);
        }}
        renderItem={({ item }) => {
          if (item.kind === 'pick') {
            return (
              <ScrollView
                style={{ width }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                nestedScrollEnabled
              >
                <View style={styles.capiHeader}>
                  <CapiAvatar size={44} state="idle" />
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>
                      {"Choisissez votre statut d’arrivée. Ensuite, suivez une feuille de route guidée (actions à cocher + liens officiels)."}
                    </Text>
                  </View>
                </View>

                <Text style={styles.question}>Quel est votre statut d’arrivée ?</Text>

                <View style={styles.options}>
                  {STAGES.map((s) => {
                    const active = stage === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => selectStage(s.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.optionEmoji}>{s.emoji}</Text>
                        <View style={styles.optionText}>
                          <Text style={styles.optionLabel}>{s.label}</Text>
                          <Text style={styles.optionDesc}>{s.desc}</Text>
                        </View>
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'chevron-forward'}
                          size={18}
                          color={active ? Colors.success : Colors.textMuted}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {stage && steps.length > 0 && (
                  <>
                    <View style={styles.sectionRow}>
                      <Text style={styles.sectionTitle}>Timeline</Text>
                      <Text style={styles.sectionCount}>{overall.done}/{overall.total}</Text>
                    </View>

                    <View style={styles.stepsWrap}>
                      {steps.map((st) => {
                        const sst = stepStats[st.id];
                        const done = sst?.done ?? 0;
                        const total = sst?.total ?? 0;
                        const allDone = sst?.allDone ?? false;
                        return (
                          <View key={st.id} style={[styles.stepCard, allDone && styles.stepCardDone]}>
                            <View style={styles.stepMain}>
                              <Ionicons
                                name={allDone ? 'checkmark-circle' : 'ellipse-outline'}
                                size={18}
                                color={allDone ? Colors.success : Colors.textMuted}
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.stepLabelText, allDone && styles.stepLabelTextDone]}>{st.title}</Text>
                                <Text style={styles.stepDescText} numberOfLines={2}>{st.description}</Text>
                              </View>
                              <Text style={styles.sectionCount}>{total ? `${done}/${total}` : '—'}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.hintRow}>
                      <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
                      <Text style={styles.hintText}>Glissez à gauche pour commencer.</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.9}
                      onPress={() => goToIndex(1)}
                    >
                      <Text style={styles.primaryBtnText}>Commencer</Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                    </TouchableOpacity>
                  </>
                )}

                <View style={{ height: 24 }} />
              </ScrollView>
            );
          }

          if (item.kind === 'finish') {
            return (
              <ScrollView
                style={{ width }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                nestedScrollEnabled
              >
                <View style={styles.capiHeader}>
                  <CapiAvatar size={44} state="idle" />
                  <View style={styles.bubble}>
                    <Text style={styles.bubbleText}>
                      {"Super. Parcours terminé. Vous pouvez revenir sur les étapes à tout moment: vos cases cochées restent enregistrées."}
                    </Text>
                  </View>
                </View>

                <Text style={styles.question}>Fin du parcours</Text>

                <View style={styles.stepsWrap}>
                  <View style={styles.stepCard}>
                    <View style={styles.stepMain}>
                      <Ionicons name="information-circle-outline" size={18} color={Colors.orange} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepLabelText}>Progression intégration</Text>
                        <Text style={styles.stepDescText}>{Math.round(overall.progress * 100)}% — {overall.done}/{overall.total} actions complétées.</Text>
                      </View>
                    </View>
                    <View style={styles.stepLinksWrap}>
                      <TouchableOpacity
                        style={styles.stepLinkBtn}
                        activeOpacity={0.8}
                        onPress={() => openOfficial(OFFICIAL.settleIRCC)}
                      >
                        <Ionicons name="link-outline" size={14} color={Colors.orange} />
                        <Text style={styles.stepLinkText} numberOfLines={2}>S’établir au Canada (IRCC)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.stepLinkBtn}
                        activeOpacity={0.8}
                        onPress={() => openOfficial(CAPITUNE_RESOURCES.newcomerIndex)}
                      >
                        <Ionicons name="link-outline" size={14} color={Colors.orange} />
                        <Text style={styles.stepLinkText} numberOfLines={2}>Ressources essentielles (CAPITUNE)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  activeOpacity={0.9}
                  onPress={() => goToIndex(0)}
                >
                  <Ionicons name="refresh" size={18} color={Colors.text} />
                  <Text style={styles.secondaryBtnText}>Changer de statut</Text>
                </TouchableOpacity>

                <View style={styles.hintRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.hintText}>Besoin d’aide ? Ouvrez le chat CAPI.</Text>
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>
            );
          }

          const s = steps.find((x) => x.id === item.stepId);
          if (!s) return <View style={{ width }} />;

          // ── step: tout sur une seule page (badge, titre, docs, checklist, liens) ──
          const st = stepStats[s.id];
          const stepIndex = steps.findIndex((x) => x.id === s.id);
          return (
            <View style={[styles.page, { width }]}>
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.pageScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {/* Header compteur */}
                <View style={styles.stepCounterRow}>
                  <Text style={styles.stepCounterText}>Étape {stepIndex + 1} / {steps.length}</Text>
                  <Text style={styles.stepCounterDone}>{st?.done ?? 0} / {st?.total ?? 0} faits</Text>
                </View>

                {/* Titre + description */}
                <View style={styles.card}>
                  {s.when && <Text style={styles.kicker}>{s.when}</Text>}
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.description}</Text>
                </View>

                {/* Documents */}
                {(s.documents?.length ?? 0) > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Documents à avoir</Text>
                    <View style={styles.sectionBody}>
                      {s.documents!.map((d) => (
                        <View key={`${s.id}:doc:${d}`} style={styles.bulletRow}>
                          <Ionicons name="document-text-outline" size={14} color={Colors.textMuted} />
                          <Text style={styles.bulletText}>{d}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Checklist */}
                {s.checkItems.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions à compléter</Text>
                    <View style={styles.sectionBody}>
                      {s.checkItems.map((ci) => {
                        const done = isDone(s.id, ci.id);
                        return (
                          <TouchableOpacity
                            key={`${s.id}:check:${ci.id}`}
                            style={[styles.checkRow, done && styles.checkRowDone]}
                            activeOpacity={0.75}
                            onPress={() => toggleCheckItem(s.id, ci.id)}
                          >
                            <Ionicons
                              name={done ? 'checkmark-circle' : 'ellipse-outline'}
                              size={20}
                              color={done ? Colors.success : Colors.textMuted}
                            />
                            <Text style={[styles.checkLabel, done && styles.checkLabelDone]}>{ci.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Liens officiels */}
                {s.links.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ressources officielles</Text>
                    <View style={styles.sectionBody}>
                      {s.links.map((l) => (
                        <TouchableOpacity
                          key={`${s.id}:link:${l.url}`}
                          style={styles.linkBtn}
                          activeOpacity={0.85}
                          onPress={() => openOfficial(l.url)}
                        >
                          <Ionicons name="link-outline" size={14} color={Colors.primary} />
                          <Text style={styles.linkText} numberOfLines={3}>{l.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Navigation Préc / Suivant */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.navBtn}
                    activeOpacity={0.85}
                    onPress={() => goToIndex(index - 1)}
                  >
                    <Ionicons name="arrow-back" size={18} color={Colors.text} />
                    <Text style={styles.navBtnText}>Préc.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBtn, styles.navBtnPrimary]}
                    activeOpacity={0.85}
                    onPress={() => goToIndex(index + 1)}
                  >
                    <Text style={[styles.navBtnText, { color: Colors.white }]}>
                      {stepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          );
        }}
      />

      <CapiHelpFab onPress={() => router.push('/capi/agent' as any)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgLight },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  progressBarOuter: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressBarInner: { height: 4, backgroundColor: Colors.orange, borderRadius: 2 },
  stepLabel: { fontSize: 12, color: Colors.textMuted, minWidth: 32, textAlign: 'right' },

  page: { flex: 1 },
  pageScroll: { flex: 1 },
  pageScrollContent: { paddingBottom: 120 },

  capiHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 12, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 14 },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 21 },

  question: { fontSize: 20, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 16 },

  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  stepTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  itemTitle: { fontSize: 16, fontWeight: '900', color: Colors.text, marginTop: 2 },
  inlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  inlineMetaText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18, fontWeight: '700' },
  actionsRow: { marginTop: 14, flexDirection: 'row' },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  doneBtnText: { fontSize: 14, fontWeight: '900', color: Colors.text },

  stepPageBody: { paddingHorizontal: 20 },

  options: { paddingHorizontal: 20, gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...UI.cardShadow,
  },
  optionCardActive: { borderColor: Colors.success },
  optionEmoji: { fontSize: 26 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  optionDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 20, marginTop: 18, marginBottom: 10 },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: Colors.text },
  sectionCount: { fontSize: 12, fontWeight: '900', color: Colors.textMuted },
  stepsWrap: { paddingHorizontal: 20, gap: 10 },
  stepCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.offWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepCardDone: { borderColor: Colors.success },
  stepLabelText: { fontSize: 13, fontWeight: '800', color: Colors.text },
  stepLabelTextDone: { color: Colors.success },
  stepDescText: { fontSize: 12, color: Colors.textMuted, marginTop: 2, lineHeight: 16 },

  stepLinksWrap: { marginTop: 10, gap: 8 },
  stepLinkBtn: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  stepLinkText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 16, fontWeight: '600' },

  hintRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 20, marginTop: 14 },
  hintText: { fontSize: 12, color: Colors.textMuted, flex: 1 },

  primaryBtn: {
    marginTop: 14,
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...UI.cardShadow,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: '900' },

  secondaryBtn: {
    marginTop: 14,
    marginHorizontal: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryBtnText: { color: Colors.text, fontSize: 14, fontWeight: '800' },

  // Step page
  stepCounterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  stepCounterText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepCounterDone: { fontSize: 12, fontWeight: '900', color: Colors.orange },

  section: { paddingHorizontal: 20, marginTop: 14 },
  sectionBody: { marginTop: 10, gap: 10 },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.offWhite, borderWidth: 1, borderColor: Colors.border },
  checkRowDone: { borderColor: Colors.success, backgroundColor: Colors.surface },
  checkLabel: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 19, fontWeight: '600' },
  checkLabelDone: { color: Colors.success },

  navRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  navBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navBtnPrimary: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  navBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
});
