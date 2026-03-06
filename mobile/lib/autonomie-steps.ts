import type { AutonomieProject, AutonomieStep, BudgetCategorie, CapiMotif, MotifBudget } from './api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const step = (
  id: string,
  ordre: number,
  title: string,
  icon: string,
  description: string,
  checkItems: { id: string; label: string }[],
  ressources: { titre: string; description: string; url: string }[],
  action?: { label: string; url: string },
): AutonomieStep => ({
  id,
  ordre,
  title,
  icon,
  description,
  status: 'pending',
  checkItems: checkItems.map((c) => ({ ...c, done: false })),
  ressources,
  actionLabel: action?.label,
  actionUrl: action?.url,
});

// ---------------------------------------------------------------------------
// Motif : Étudier
// ---------------------------------------------------------------------------

const stepsEtudier: AutonomieStep[] = [
  step(
    'choisir-etablissement',
    1,
    'Choisir un établissement',
    '🎓',
    'Recherchez un établissement désigné (DLI) au Canada dans la province ciblée.',
    [
      { id: 'c1', label: 'Identifier 3 programmes et établissements potentiels' },
      { id: 'c2', label: 'Vérifier que l\'établissement est sur la liste DLI' },
      { id: 'c3', label: 'Comparer les frais de scolarité et conditions d\'admission' },
      { id: 'c4', label: 'Vérifier les exigences linguistiques (IELTS/TEF)' },
    ],
    [
      {
        titre: 'Liste des DLI (établissements désignés)',
        description: 'Liste officielle d\'IRCC des établissements d\'enseignement désignés.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/preparer/liste-etablissements-designes.html',
      },
      {
        titre: 'EduCanada — Annuaire d\'établissements',
        description: 'Moteur de recherche d\'établissements postsecondaires canadiens.',
        url: 'https://www.educanada.ca/schools-ecoles/index.aspx?lang=fra',
      },
    ],
  ),

  step(
    'demande-admission',
    2,
    'Faire une demande d\'admission',
    '📋',
    'Soumettez votre dossier académique à l\'établissement et obtenez une lettre d\'acceptation (LOA).',
    [
      { id: 'c1', label: 'Réunir relevés de notes, diplômes, traductions certifiées' },
      { id: 'c2', label: 'Rédiger la lettre via l\'agent CAPI + obtenir un score de chance' },
      { id: 'c3', label: 'Payer les frais de dossier d\'admission' },
      { id: 'c4', label: 'Soumettre la demande avant la date limite' },
      { id: 'c5', label: 'Recevoir et sauvegarder la Lettre d\'Acceptation (LOA)' },
    ],
    [],
  ),

  step(
    'caq-mifi',
    3,
    'Demander le CAQ (Québec uniquement)',
    '🏛️',
    'Si vous étudiez au Québec, obtenez d\'abord le Certificat d\'Acceptation du Québec (CAQ) auprès du MIFI.',
    [
      { id: 'c1', label: 'Créer un compte sur le portail Arrima' },
      { id: 'c2', label: 'Remplir le formulaire de demande de CAQ (114 $)' },
      { id: 'c3', label: 'Téléverser la LOA et les pièces justificatives' },
      { id: 'c4', label: 'Attendre la décision (délai ~50 jours)' },
      { id: 'c5', label: 'Recevoir et sauvegarder le CAQ' },
    ],
    [
      {
        titre: 'Portail Arrima — MIFI',
        description: 'Démarches d\'immigration au Québec.',
        url: 'https://arrima.immigration-quebec.gouv.qc.ca',
      },
    ],
    { label: 'Ouvrir Arrima', url: 'https://arrima.immigration-quebec.gouv.qc.ca' },
  ),

  step(
    'permis-etudes-ircc',
    4,
    'Demander le permis d\'études (IRCC)',
    '🇨🇦',
    'Soumettez la demande de permis d\'études en ligne sur le portail d\'IRCC.',
    [
      { id: 'c1', label: 'Créer un compte sur le portail IRCC (Mon dossier)' },
      { id: 'c2', label: 'Remplir le formulaire IMM 1294' },
      { id: 'c3', label: 'Payer les frais (150 $ + 85 $ biométrie)' },
      { id: 'c4', label: 'Joindre LOA, CAQ (si Québec), relevés, preuve de fonds' },
      { id: 'c5', label: 'Joindre les résultats des tests de langue (IELTS/TEF)' },
    ],
    [
      {
        titre: 'Portail IRCC — Mon dossier',
        description: 'Soumettre une demande en ligne.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/formulaires-demande-guides/imm1294.html',
      },
    ],
    { label: 'Portail IRCC', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/obtenir.html' },
  ),

  step(
    'examens-medicaux',
    5,
    'Passer l\'examen médical',
    '🏥',
    'Quasi systématiquement requis si la durée du permis dépasse 6 mois. Réalisez-le chez un médecin désigné.',
    [
      { id: 'c1', label: 'Trouver un médecin désigné IRCC dans votre pays' },
      { id: 'c2', label: 'Prendre rendez-vous et apporter passeport + photos' },
      { id: 'c3', label: 'Payer les frais médicaux (150–300 $)' },
      { id: 'c4', label: 'Les résultats sont envoyés directement à IRCC' },
    ],
    [
      {
        titre: 'Trouver un médecin désigné',
        description: 'Base de données des médecins accrédités IRCC.',
        url: 'https://dmp.ircc.ca/',
      },
    ],
    { label: 'Trouver un médecin désigné', url: 'https://dmp.ircc.ca/' },
  ),

  step(
    'biometrie',
    6,
    'Donner ses données biométriques',
    '🖐️',
    'Vous recevrez une lettre d\'IRCC vous invitant à vous rendre dans un centre VFS Global ou IRCC.',
    [
      { id: 'c1', label: 'Recevoir la lettre d\'invitation pour la biométrie' },
      { id: 'c2', label: 'Prendre rendez-vous au centre VFS Global ou IRCC' },
      { id: 'c3', label: 'Apporter passeport original + letter d\'invitation' },
      { id: 'c4', label: 'Confirmer la soumission des données biométriques' },
    ],
    [
      {
        titre: 'Centres de collecte biométrique',
        description: 'Trouver le centre le plus proche.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html',
      },
    ],
    { label: 'Trouver un centre biométrie', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html' },
  ),

  step(
    'attente-decision',
    7,
    'Attendre la décision',
    '⏳',
    'IRCC traite votre demande. Vérifiez régulièrement votre portail pour les mises à jour.',
    [
      { id: 'c1', label: 'Activer les notifications sur le portail IRCC' },
      { id: 'c2', label: 'Vérifier régulièrement l\'état de la demande' },
      { id: 'c3', label: 'Répondre rapidement si IRCC demande des documents supplémentaires' },
    ],
    [
      {
        titre: 'Vérifier les délais de traitement',
        description: 'Temps de traitement estimé en temps réel.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/verifier-delais-traitement.html',
      },
    ],
    { label: 'Vérifier le statut', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/verifier-delais-traitement.html' },
  ),

  step(
    'preparer-arrivee',
    8,
    'Préparer l\'arrivée au Canada',
    '✈️',
    'Une fois le permis approuvé, préparez votre voyage et votre installation.',
    [
      { id: 'c1', label: 'Télécharger le visa / eTA (si applicable)' },
      { id: 'c2', label: 'Réserver vol et hébergement temporaire' },
      { id: 'c3', label: 'Préparer les documents à avoir en main à l\'arrivée' },
      { id: 'c4', label: 'Confirmer l\'inscription à l\'établissement' },
      { id: 'c5', label: 'Récupérer le permis d\'études en arrivant au port d\'entrée' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Travailler
// ---------------------------------------------------------------------------

const stepsTravailler: AutonomieStep[] = [
  step(
    'offre-emploi',
    1,
    'Obtenir une offre d\'emploi',
    '💼',
    'Trouvez un employeur canadien prêt à vous embaucher. L\'offre d\'emploi est généralement indispensable.',
    [
      { id: 'c1', label: 'Créer un profil sur LinkedIn, Indeed Canada, Job Bank' },
      { id: 'c2', label: 'Cibler les employeurs pouvant parrainer des étrangers' },
      { id: 'c3', label: 'Obtenir une offre d\'emploi écrite (code CNP inclus)' },
      { id: 'c4', label: 'Vérifier la classification CNP du poste (TEER 0-3 pour PET)' },
    ],
    [
      {
        titre: 'Job Bank Canada',
        description: 'Offres d\'emploi officielles du gouvernement canadien.',
        url: 'https://www.jobbank.gc.ca',
      },
    ],
    { label: 'Explorer Job Bank', url: 'https://www.jobbank.gc.ca' },
  ),

  step(
    'lmia-eimt',
    2,
    'EIMT / LMIA (si applicable)',
    '📄',
    'L\'employeur doit obtenir une Étude d\'Impact sur le Marché du Travail (EIMT) auprès d\'EDSC, sauf dispense.',
    [
      { id: 'c1', label: 'Vérifier si le poste est exempté d\'EIMT (ALENA, IEC, PVT)' },
      { id: 'c2', label: 'Confirmer que l\'employeur a démarré la démarche EIMT' },
      { id: 'c3', label: 'Recevoir le numéro d\'EIMT approuvé de l\'employeur' },
    ],
    [
      {
        titre: 'Programme des travailleurs étrangers temporaires',
        description: 'Conditions et processus EIMT.',
        url: 'https://www.canada.ca/fr/emploi-developpement-social/services/travailleurs-etrangers.html',
      },
    ],
  ),

  step(
    'permis-travail',
    3,
    'Demander le permis de travail',
    '🇨🇦',
    'Soumettez la demande de permis de travail fermé (ou ouvert) sur le portail IRCC.',
    [
      { id: 'c1', label: 'Créer ou accéder à votre compte IRCC' },
      { id: 'c2', label: 'Identifier le bon formulaire (IMM 1295 ou autre)' },
      { id: 'c3', label: 'Payer les frais (255 $ + 85 $ biométrie)' },
      { id: 'c4', label: 'Joindre offre emploi, EIMT, passeport, photos' },
      { id: 'c5', label: 'Soumettre la demande et noter le numéro de dossier' },
    ],
    [
      {
        titre: 'Demander un permis de travail',
        description: 'Guide officiel IRCC.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
      },
    ],
    { label: 'Portail IRCC', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html' },
  ),

  step(
    'biometrie-travail',
    4,
    'Donner ses données biométriques',
    '🖐️',
    'Rendez-vous dans un centre VFS Global avec votre lettre d\'invitation IRCC.',
    [
      { id: 'c1', label: 'Recevoir la lettre d\'invitation pour la biométrie' },
      { id: 'c2', label: 'Prendre rendez-vous au centre VFS Global ou IRCC' },
      { id: 'c3', label: 'Apporter passeport original + lettre d\'invitation' },
    ],
    [
      {
        titre: 'Centres de collecte biométrique',
        description: 'Trouver le centre le plus proche.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html',
      },
    ],
    { label: 'Trouver un centre biométrie', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html' },
  ),

  step(
    'attente-decision-travail',
    5,
    'Attendre la décision',
    '⏳',
    'Suivez l\'avancement de votre demande sur le portail IRCC.',
    [
      { id: 'c1', label: 'Activer les notifications sur le portail IRCC' },
      { id: 'c2', label: 'Vérifier régulièrement l\'état de la demande' },
      { id: 'c3', label: 'Répondre rapidement si IRCC demande des informations' },
    ],
    [
      {
        titre: 'Vérifier les délais de traitement',
        description: 'Temps de traitement estimé en temps réel.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/verifier-delais-traitement.html',
      },
    ],
  ),

  step(
    'arrivee-travail',
    6,
    'Arriver au Canada',
    '✈️',
    'Préparez vos documents pour la frontière et votre installation.',
    [
      { id: 'c1', label: 'Télécharger l\'eTA si nécessaire' },
      { id: 'c2', label: 'Préparer les documents pour la frontière (lettre d\'autorisation)' },
      { id: 'c3', label: 'Récupérer le permis de travail au port d\'entrée' },
      { id: 'c4', label: 'Confirmer le début d\'emploi avec l\'employeur' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Résidence Permanente
// ---------------------------------------------------------------------------

const stepsRP: AutonomieStep[] = [
  step(
    'profil-expres',
    1,
    'Créer un profil Entrée Express',
    '📊',
    'Soumettez votre Déclaration d\'intérêt (DOI) dans le système Entrée Express d\'IRCC.',
    [
      { id: 'c1', label: 'Évaluer votre score CRS (outil officiel IRCC)' },
      { id: 'c2', label: 'Identifier le bon programme (FCE, TQF, CEC)' },
      { id: 'c3', label: 'Passer IELTS/TEF et faire évaluer diplômes (ECA/DCE)' },
      { id: 'c4', label: 'Créer profil Entrée Express et le valider' },
    ],
    [
      {
        titre: 'Calculateur de pointage CRS',
        description: 'Estimez votre score avant de créer votre profil.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/admissibilite/systeme-classement-global.html',
      },
      {
        titre: 'Portail Entrée Express',
        description: 'Créer ou gérer votre profil.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html',
      },
    ],
    { label: 'Calculer mon score CRS', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/admissibilite/systeme-classement-global.html' },
  ),

  step(
    'pnp-province',
    2,
    'Candidater à un PNP (optionnel)',
    '🏙️',
    'Une nomination provinciale peut augmenter votre score CRS de 600 points et vous garantir une invitation.',
    [
      { id: 'c1', label: 'Identifier la province qui correspond à votre profil' },
      { id: 'c2', label: 'Créer un profil dans le programme provincial (Arrima, AINP, OINP…)' },
      { id: 'c3', label: 'Attendre une nomination ou déposer une EOI' },
      { id: 'c4', label: 'Accepter la nomination et mettre à jour le profil Entrée Express' },
    ],
    [
      {
        titre: 'Programmes des candidats des provinces',
        description: 'Liste complète des PNP par province.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/admissibilite/candidats-provinces.html',
      },
    ],
  ),

  step(
    'invitation-ircc',
    3,
    'Recevoir une invitation (ITI)',
    '📬',
    'IRCC envoie des invitations à déposer lors des tirages réguliers. Maintenez votre profil actif.',
    [
      { id: 'c1', label: 'Garder le profil à jour (emploi, langue, études)' },
      { id: 'c2', label: 'Surveiller les tirages Entrée Express (site IRCC)' },
      { id: 'c3', label: 'Accepter l\'invitation dès réception (délai 90 jours)' },
    ],
    [
      {
        titre: 'Résultats des tirages Entrée Express',
        description: 'Suivez les rounds passés et les seuils CRS.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/soumission-demande/invitation-etat/tours-invitation.html',
      },
    ],
  ),

  step(
    'demande-rp',
    4,
    'Soumettre la demande de RP',
    '📦',
    'Après l\'ITI, soumettez votre demande complète de résidence permanente dans les 60 jours.',
    [
      { id: 'c1', label: 'Rassembler tous les documents requis (police, ECA, photos)' },
      { id: 'c2', label: 'Remplir tous les formulaires IRCC' },
      { id: 'c3', label: 'Payer les frais (1 365 $ adulte + frais RD 515 $)' },
      { id: 'c4', label: 'Soumettre avant l\'expiration de l\'invitation (60 jours)' },
    ],
    [],
  ),

  step(
    'exam-medical-rp',
    5,
    'Examen médical d\'immigration',
    '🏥',
    'Effectuez l\'examen médical chez un médecin désigné IRCC.',
    [
      { id: 'c1', label: 'Trouver un médecin désigné IRCC' },
      { id: 'c2', label: 'Effectuer l\'examen (passeport + photos requis)' },
      { id: 'c3', label: 'Le rapport est transmis directement à IRCC' },
    ],
    [
      {
        titre: 'Trouver un médecin désigné',
        description: 'Base de données des médecins accrédités.',
        url: 'https://dmp.ircc.ca/',
      },
    ],
    { label: 'Trouver un médecin désigné', url: 'https://dmp.ircc.ca/' },
  ),

  step(
    'biometrie-rp',
    6,
    'Données biométriques',
    '🖐️',
    'Fournissez vos données biométriques sur invitation d\'IRCC.',
    [
      { id: 'c1', label: 'Recevoir la lettre d\'invitation biométrie' },
      { id: 'c2', label: 'Prendre rendez-vous (VFS Global ou centre IRCC)' },
      { id: 'c3', label: 'Apporter passeport + lettre d\'invitation' },
    ],
    [
      {
        titre: 'Centres biométriques',
        description: 'Trouver le centre le plus proche.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html',
      },
    ],
  ),

  step(
    'decision-rp',
    7,
    'Attendre la décision et obtenir le PR',
    '🎉',
    'IRCC émet la décision. En cas d\'approbation, vous recevrez la Confirmation de RP (CoPR) et la carte RP.',
    [
      { id: 'c1', label: 'Suivre l\'état de la demande sur le portail IRCC' },
      { id: 'c2', label: 'Recevoir la CoPR (Confirmation of Permanent Residence)' },
      { id: 'c3', label: 'Se présenter à la frontière canadienne avec la CoPR' },
      { id: 'c4', label: 'Attendre la carte RP (par la poste ~8 semaines)' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Regroupement Familial
// ---------------------------------------------------------------------------

const stepsFamille: AutonomieStep[] = [
  step(
    'evaluation-eligibilite',
    1,
    'Vérifier l\'éligibilité du parrain',
    '👨‍👩‍👧',
    'Le parrain (résident permanent ou citoyen canadien) doit remplir les critères de revenu et d\'engagement.',
    [
      { id: 'c1', label: 'Vérifier le lien familial admissible (conjoint, enfant, parent)' },
      { id: 'c2', label: 'Évaluer le revenu minimum requis du parrain' },
      { id: 'c3', label: 'Vérifier l\'absence de casier judiciaire du parrain' },
    ],
    [
      {
        titre: 'Critères de parrainage famillial',
        description: 'Conditions officielles IRCC.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/regroupement-familial/parrainer-membre-famille.html',
      },
    ],
    { label: 'Vérifier les critères', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/regroupement-familial/parrainer-membre-famille.html' },
  ),

  step(
    'demande-parrainage',
    2,
    'Demande de parrainage',
    '📝',
    'Le parrain soumet la demande d\'autorisation de parrainage à IRCC (Étape 1).',
    [
      { id: 'c1', label: 'Remplir les formulaires IMM 1344, IMM 5532, etc.' },
      { id: 'c2', label: 'Payer les frais de traitement (1 050 $ = 75 $ parrainage + 975 $ RP)' },
      { id: 'c3', label: 'Joindre pièces justificatives (statut au Canada, revenus)' },
      { id: 'c4', label: 'Soumettre à IRCC (voie en ligne ou postale)' },
    ],
    [],
  ),

  step(
    'demande-beneficiaire',
    3,
    'Demande de résidence permanente (bénéficiaire)',
    '📤',
    'Le membre de la famille à l\'étranger prépare sa partie du dossier.',
    [
      { id: 'c1', label: 'Rassembler actes civils (naissance, mariage, divorce)' },
      { id: 'c2', label: 'Obtenir casier judiciaire du pays d\'origine' },
      { id: 'c3', label: 'Remplir le questionnaire sur les antécédents (IMM 5406, IMM 5669)' },
      { id: 'c4', label: 'Préparer photos conformes IRCC' },
    ],
    [],
  ),

  step(
    'exam-medical-famille',
    4,
    'Examen médical',
    '🏥',
    'Tous les bénéficiaires doivent passer un examen médical chez un médecin désigné.',
    [
      { id: 'c1', label: 'Recevoir les instructions médicales d\'IRCC' },
      { id: 'c2', label: 'Prendre rendez-vous chez un médecin désigné' },
      { id: 'c3', label: 'Passer l\'examen et attendre la transmission à IRCC' },
    ],
    [
      {
        titre: 'Trouver un médecin désigné',
        description: 'Base de données des médecins accrédités.',
        url: 'https://dmp.ircc.ca/',
      },
    ],
    { label: 'Trouver un médecin désigné', url: 'https://dmp.ircc.ca/' },
  ),

  step(
    'biometrie-famille',
    5,
    'Données biométriques',
    '🖐️',
    'Le bénéficiaire fournit ses données biométriques sur invitation d\'IRCC.',
    [
      { id: 'c1', label: 'Recevoir la lettre d\'invitation biométrie' },
      { id: 'c2', label: 'Prendre rendez-vous dans un centre de collecte biométrique' },
      { id: 'c3', label: 'Apporter passeport + lettre d\'invitation' },
    ],
    [
      {
        titre: 'Centres biométriques',
        description: 'Trouver le centre le plus proche.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html',
      },
    ],
  ),

  step(
    'decision-famille',
    6,
    'Décision et arrivée au Canada',
    '🎉',
    'En cas d\'approbation, le bénéficiaire reçoit la CoPR et peut entrer au Canada.',
    [
      { id: 'c1', label: 'Surveiller les mises à jour sur le portail IRCC' },
      { id: 'c2', label: 'Recevoir la CoPR et le visa (si applicable)' },
      { id: 'c3', label: 'Planifier l\'arrivée au Canada (port d\'entrée)' },
      { id: 'c4', label: 'Attendre la carte RP par la poste' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Entreprendre (visa entrepreneur/SUV)
// ---------------------------------------------------------------------------

const stepsEntreprendre: AutonomieStep[] = [
  step(
    'eligibilite-suv',
    1,
    'Évaluer l\'éligibilité au visa entrepreneur',
    '🚀',
    'Le programme Visa pour démarrage d\'entreprise (SUV) exige une idée innovante et une organisation désignée.',
    [
      { id: 'c1', label: 'Vérifier les critères: idée nouvelle, viabilité, compétences langagières CLB 5+' },
      { id: 'c2', label: 'Identifier les organisations désignées potentielles' },
      { id: 'c3', label: 'Préparer le pitch et plan d\'affaires résumé' },
    ],
    [
      {
        titre: 'Programme Visa pour démarrage d\'entreprise',
        description: 'Critères et processus officiels.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/visa-demarrage-entreprise.html',
      },
    ],
    { label: 'Lire les critères SUV', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/visa-demarrage-entreprise.html' },
  ),

  step(
    'organisation-designee',
    2,
    'Contacter une organisation désignée',
    '🏢',
    'Obtenez une lettre de soutien d\'un fonds de capital-risque, d\'un ange investisseur ou d\'un incubateur désigné.',
    [
      { id: 'c1', label: 'Consulter la liste des organisations désignées IRCC' },
      { id: 'c2', label: 'Préparer présentation de l\'entreprise (pitch deck)' },
      { id: 'c3', label: 'Contacter et présenter le projet' },
      { id: 'c4', label: 'Recevoir une Lettre de Soutien' },
    ],
    [
      {
        titre: 'Organisations désignées SUV',
        description: 'Liste officielle des organisations acceptées.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/visa-demarrage-entreprise/organismes-designes.html',
      },
    ],
  ),

  step(
    'demande-suv',
    3,
    'Déposer la demande SUV',
    '📋',
    'Soumettez votre demande de résidence permanente via le SUV sur le portail IRCC.',
    [
      { id: 'c1', label: 'Préparer formulaires IMM 0008, IMM 5406, IMM 5669' },
      { id: 'c2', label: 'Joindre Lettre de Soutien, plan d\'affaires, preuves linguistiques' },
      { id: 'c3', label: 'Payer les frais de traitement et RD' },
      { id: 'c4', label: 'Soumettre la demande en ligne' },
    ],
    [],
  ),

  step(
    'permis-travail-suv',
    4,
    'Permis de travail provisoire (SUV)',
    '💼',
    'Optionnel: demandez un permis de travail ouvert pour travailler pendant le traitement de la demande de RP.',
    [
      { id: 'c1', label: 'Évaluer si un permis de travail est nécessaire' },
      { id: 'c2', label: 'Remplir le formulaire additionnel' },
      { id: 'c3', label: 'Joindre la Lettre de Soutien de l\'organisation désignée' },
    ],
    [],
  ),

  step(
    'exam-medical-entreprendre',
    5,
    'Examen médical',
    '🏥',
    'Effectuez l\'examen médical chez un médecin désigné IRCC.',
    [
      { id: 'c1', label: 'Trouver un médecin désigné IRCC' },
      { id: 'c2', label: 'Effectuer l\'examen' },
      { id: 'c3', label: 'Résultats transmis à IRCC' },
    ],
    [
      {
        titre: 'Trouver un médecin désigné',
        description: 'Base de données des médecins accrédités.',
        url: 'https://dmp.ircc.ca/',
      },
    ],
  ),

  step(
    'decision-entreprendre',
    6,
    'Décision et établissement au Canada',
    '🎉',
    'Après approbation, commencez les démarches d\'établissement et d\'enregistrement de l\'entreprise.',
    [
      { id: 'c1', label: 'Recevoir la CoPR et le cas échéant le visa' },
      { id: 'c2', label: 'Arriver au Canada et activer le statut RP' },
      { id: 'c3', label: 'Enregistrer l\'entreprise au registre provincial' },
      { id: 'c4', label: 'Ouvrir un compte bancaire d\'entreprise' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Régularisation
// ---------------------------------------------------------------------------

const stepsRegularisation: AutonomieStep[] = [
  step(
    'evaluation-situation',
    1,
    'Évaluer votre situation',
    '⚖️',
    'Identifiez votre voie de régularisation: statut expiré, permissionnaire, protection, CERP, etc.',
    [
      { id: 'c1', label: 'Déterminer votre statut actuel (permis, étudiant, TET…)' },
      { id: 'c2', label: 'Vérifier la date d\'expiration de votre statut' },
      { id: 'c3', label: 'Consulter les voies disponibles (CERP, H&C, POTP, etc.)' },
    ],
    [
      {
        titre: 'Options si votre statut expire',
        description: 'Guide officiel IRCC.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/prolonger-modifier-statut.html',
      },
    ],
    { label: 'Options statut IRCC', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/prolonger-modifier-statut.html' },
  ),

  step(
    'depot-permis-restauration',
    2,
    'Restauration du statut (si applicable)',
    '🔄',
    'Si votre statut est expiré depuis moins de 90 jours, vous pouvez demander la restauration.',
    [
      { id: 'c1', label: 'Vérifier le délai de 90 jours depuis l\'expiration' },
      { id: 'c2', label: 'Remplir le formulaire IMM 5708 (restauration de statut)' },
      { id: 'c3', label: 'Payer les frais de restauration' },
      { id: 'c4', label: 'Soumettre rapidement' },
    ],
    [],
  ),

  step(
    'motifs-hc',
    3,
    'Motifs d\'ordre humanitaire (H&C)',
    '❤️',
    'Si vous êtes établi au Canada, une demande H&C peut être envisagée.',
    [
      { id: 'c1', label: 'Évaluer les critères H&C: établissement, intérêt des enfants' },
      { id: 'c2', label: 'Rassembler les preuves d\'établissement (emploi, école, communauté)' },
      { id: 'c3', label: 'Consulter un conseiller en immigration ou un avocat' },
    ],
    [
      {
        titre: 'Demande pour motifs humanitaires',
        description: 'Guide et formulaires IRCC.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/motifs-humanitaires.html',
      },
    ],
  ),

  step(
    'documents-regularisation',
    4,
    'Rassembler les documents',
    '📂',
    'Constituez votre dossier avec toutes les pièces justificatives.',
    [
      { id: 'c1', label: 'Passeport en cours de validité' },
      { id: 'c2', label: 'Historique de tous les statuts au Canada' },
      { id: 'c3', label: 'Preuves d\'établissement (loyer, emploi, impôts)' },
      { id: 'c4', label: 'Casier judiciaire du pays d\'origine' },
    ],
    [],
  ),

  step(
    'soumission-regularisation',
    5,
    'Soumettre la demande',
    '📤',
    'Soumettez votre demande en ligne ou par courrier selon la voie choisie.',
    [
      { id: 'c1', label: 'Vérifier la liste de contrôle IRCC' },
      { id: 'c2', label: 'Payer les frais applicables' },
      { id: 'c3', label: 'Soumettre la demande et conserver la confirmation' },
    ],
    [],
  ),

  step(
    'suivi-regularisation',
    6,
    'Suivi et décision',
    '⏳',
    'Suivez votre dossier et répondez promptement aux demandes d\'IRCC.',
    [
      { id: 'c1', label: 'Surveiller le portail IRCC' },
      { id: 'c2', label: 'Mettre à jour l\'adresse si déménagement' },
      { id: 'c3', label: 'Répondre aux demandes de renseignements supplémentaires' },
      { id: 'c4', label: 'Recevoir et analyser la décision' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Motif : Visiter
// ---------------------------------------------------------------------------

const stepsVisiter: AutonomieStep[] = [
  step(
    'verif-visa-visiter',
    1,
    'Vérifier si un visa est requis',
    '🔍',
    'Selon votre nationalité, vous pourriez avoir besoin d\'un visa de visiteur ou d\'une AVE.',
    [
      { id: 'c1', label: 'Consulter l\'outil IRCC de vérification de visa' },
      { id: 'c2', label: 'Déterminer si vous avez besoin d\'un visa ou d\'une AVE (eTA)' },
      { id: 'c3', label: 'Vérifier la validité de votre passeport (6 mois min)' },
    ],
    [
      {
        titre: 'Avez-vous besoin d\'un visa pour visiter le Canada ?',
        description: 'Outil officiel IRCC.',
        url: 'https://ircc.canada.ca/francais/visiter/visas.asp',
      },
    ],
    { label: 'Vérifier visa requis', url: 'https://ircc.canada.ca/francais/visiter/visas.asp' },
  ),

  step(
    'demande-visa-visiter',
    2,
    'Préparer la demande de visa',
    '📋',
    'Rassemblez les documents requis pour votre demande de visa de visiteur.',
    [
      { id: 'c1', label: 'Formulaire IMM 5257 rempli' },
      { id: 'c2', label: 'Photos conformes aux normes IRCC' },
      { id: 'c3', label: 'Preuve de fonds suffisants (relevé bancaire)' },
      { id: 'c4', label: 'Lettre d\'invitation (si applicable)' },
      { id: 'c5', label: 'Preuve d\'attaches au pays d\'origine (emploi, famille)' },
    ],
    [],
  ),

  step(
    'soumission-visa-visiter',
    3,
    'Soumettre la demande',
    '📤',
    'Soumettez la demande en ligne sur le portail IRCC ou via VFS Global.',
    [
      { id: 'c1', label: 'Créer un compte IRCC si nécessaire' },
      { id: 'c2', label: 'Téléverser tous les documents' },
      { id: 'c3', label: 'Payer les frais (100 $ par personne)' },
      { id: 'c4', label: 'Confirmer la soumission et noter le numéro de dossier' },
    ],
    [
      {
        titre: 'Demander un visa de visiteur',
        description: 'Guide officiel IRCC.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada/visa-visiteur.html',
      },
    ],
    { label: 'Portail IRCC visiteur', url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada/visa-visiteur.html' },
  ),

  step(
    'biometrie-visiter',
    4,
    'Données biométriques (si requis)',
    '🖐️',
    'La plupart des demandeurs de visa doivent fournir leurs données biométriques.',
    [
      { id: 'c1', label: 'Recevoir la lettre d\'invitation biométrie d\'IRCC' },
      { id: 'c2', label: 'Prendre rendez-vous au centre VFS Global' },
      { id: 'c3', label: 'Apporter passeport et lettre d\'invitation' },
    ],
    [
      {
        titre: 'Centres biométriques',
        description: 'Trouver le centre le plus proche.',
        url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html',
      },
    ],
  ),

  step(
    'arrivee-visiter',
    5,
    'Arriver au Canada',
    '✈️',
    'Préparez vos documents pour la frontière et le port d\'entrée.',
    [
      { id: 'c1', label: 'Porter le visa original collé dans le passeport' },
      { id: 'c2', label: 'Avoir les preuves de fonds et retour' },
      { id: 'c3', label: 'Connaître l\'adresse de séjour au Canada' },
      { id: 'c4', label: 'Ne pas dépasser 6 mois de séjour (sauf autorisation)' },
    ],
    [],
  ),
];

// ---------------------------------------------------------------------------
// Builder principal
// ---------------------------------------------------------------------------

const STEPS_BY_MOTIF: Record<CapiMotif, AutonomieStep[]> = {
  etudier: stepsEtudier,
  travailler: stepsTravailler,
  residence_permanente: stepsRP,
  famille: stepsFamille,
  entreprendre: stepsEntreprendre,
  regularisation: stepsRegularisation,
  visiter: stepsVisiter,
};

function computeScore(steps: AutonomieStep[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.status === 'done').length;
  return Math.round((done / steps.length) * 100);
}

export function buildAutonomieProject(motif: CapiMotif): AutonomieProject {
  // Deep clone to avoid mutation between sessions
  const rawSteps = STEPS_BY_MOTIF[motif] ?? stepsVisiter;
  const steps: AutonomieStep[] = rawSteps.map((s) => ({
    ...s,
    status: 'pending' as const,
    checkItems: s.checkItems.map((c) => ({ ...c, done: false })),
  }));

  return {
    motif,
    steps,
    createdAt: new Date().toISOString(),
    scorePreparation: computeScore(steps),
  };
}

/** Recalcule le score et retourne un nouveau projet mis à jour */
export function updateAutonomieScore(project: AutonomieProject): AutonomieProject {
  const steps = project.steps.map((s) => {
    const allDone = s.checkItems.length > 0 && s.checkItems.every((c) => c.done);
    const anyDone = s.checkItems.some((c) => c.done);
    const status: AutonomieStep['status'] = allDone ? 'done' : anyDone ? 'in_progress' : 'pending';
    return { ...s, status };
  });
  return { ...project, steps, scorePreparation: computeScore(steps) };
}

// ---------------------------------------------------------------------------
// Budget par motif
// ---------------------------------------------------------------------------

const cat = (
  label: string,
  icon: string,
  montant: number,
  description: string,
  fourchette?: string,
): BudgetCategorie => ({ label, icon, montant, description, fourchette });

const BUDGETS: Record<CapiMotif, MotifBudget> = {
  etudier: {
    motif: 'etudier',
    devise: 'CAD',
    totalEstime: 30235,
    totalFourchette: '25 000 – 40 000',
    notesBudget: 'Budget pour 1 année d’études au Québec. Les frais d’études varient selon l’établissement. Un solde bancaire de 15 000 CAD minimum est exigé par IRCC.',
    categories: [
      cat('Frais de scolarité', '🎓', 16000, 'Frais annuels dans un établissement désigné (DLI)', '8 000 – 28 000'),
      cat('Logement', '🏠', 10800, 'Chambre ou appartement (900 CAD/mois)', '700 – 1 500/mois'),
      cat('Alimentation', '🍽️', 3600, 'Coût de vie courant (300 CAD/mois)'),
      cat('Transport', '🚍', 960, 'Laissez-passer mensuel (80 CAD/mois)'),
      cat('Billet d’avion', '✈️', 900, 'Aller simple depuis l’Afrique', '600 – 1 500'),
      cat('Frais IRCC', '🇨🇦', 574, 'Permis 150 $ + Biométrie 85 $ + Médical 300 $ + CAQ 114 $', '460 – 574'),
      cat('Assurance santé', '🏥', 800, 'Couverture annuelle (RAMQ ou privée)'),
      cat('Imprévus', '💰', 600, 'Réserve recommandée : 5 % du budget total'),
    ],
  },

  travailler: {
    motif: 'travailler',
    devise: 'CAD',
    totalEstime: 6540,
    totalFourchette: '3 000 – 10 000',
    notesBudget: 'Principalement les frais IRCC et les coûts d’installation initiale. Votre salaire couvre rapidement les dépenses courantes.',
    categories: [
      cat('Frais IRCC', '🇨🇦', 340, 'Permis de travail 255 $ + Biométrie 85 $'),
      cat('Billet d’avion', '✈️', 900, 'Aller simple', '600 – 1 500'),
      cat('Installation initiale', '💻', 3000, 'Premier mois loyer + dépôt + mobilier de base'),
      cat('Alimentation (3 mois)', '🍽️', 900, 'Avant le premier salaire'),
      cat('Transport (3 mois)', '🚍', 240, '80 CAD/mois'),
      cat('Imprévus', '💰', 500, 'Réserve recommandée'),
      cat('Traduction/attestations', '📑', 300, 'Diplômes, références, évaluations'),
      cat('ECA (évaluation diplômes)', '🎓', 360, 'Si requis pour le PNP ou l’employeur'),
    ],
  },

  residence_permanente: {
    motif: 'residence_permanente',
    devise: 'CAD',
    totalEstime: 11200,
    totalFourchette: '8 000 – 20 000',
    notesBudget: 'Inclut les frais IRCC Entrée Express, l’examen médical et l’installation initiale. Varie selon la composition familiale.',
    categories: [
      cat('Frais IRCC (RP adulte)', '🇨🇦', 1365, 'Demande de RP — principal demandeur'),
      cat('Frais RD (droit de RP)', '🇨🇦', 515, 'Payable à l’approbation'),
      cat('Biométrie', '🪩', 85, 'Par personne'),
      cat('Examen médical', '🏥', 250, 'Par adulte, chez médecin désigné'),
      cat('Tests de langue (IELTS/TEF)', '📝', 300, 'Tests requis pour le profil EE'),
      cat('Évaluation des diplômes (ECA)', '🎓', 250, 'WES ou équivalent'),
      cat('Billet d’avion', '✈️', 900, 'Aller simple'),
      cat('Installation initiale', '🏠', 5000, 'Logement + mobilier + premières dépenses', '3 000 – 8 000'),
      cat('Imprévus', '💰', 535, 'Réserve recommandée'),
    ],
  },

  famille: {
    motif: 'famille',
    devise: 'CAD',
    totalEstime: 4350,
    totalFourchette: '3 000 – 8 000',
    notesBudget: 'Coûts pour le bénéficiaire (la personne parrainée). Les frais du parrain au Canada sont séparés.',
    categories: [
      cat('Frais traitement (parrain)', '🇨🇦', 75, 'Dossier parrainage'),
      cat('Frais traitement (RP)', '🇨🇦', 975, 'Demande de RP bénéficiaire'),
      cat('Droit de RP', '🇨🇦', 515, 'Payable à l’approbation'),
      cat('Examen médical', '🏥', 250, 'Chez médecin désigné'),
      cat('Biométrie', '🪩', 85, 'Par personne'),
      cat('Billet d’avion', '✈️', 900, 'Aller simple'),
      cat('Installation', '🏠', 1000, 'Premiers besoins à l’arrivée'),
      cat('Imprévus', '💰', 550, 'Réserve recommandée'),
    ],
  },

  entreprendre: {
    motif: 'entreprendre',
    devise: 'CAD',
    totalEstime: 32000,
    totalFourchette: '20 000 – 60 000',
    notesBudget: 'Le programme SUV exige 75 000 CAD de fonds disponibles pour les fonds de capital-risque. Ici, coûts opérationnels minimum.',
    categories: [
      cat('Frais IRCC (RP)', '🇨🇦', 1880, 'Traitement + droit de RP + biométrie'),
      cat('Examen médical', '🏥', 250, 'Chez médecin désigné'),
      cat('Plan d’affaires professionnel', '📊', 2000, 'Rédaction par expert', '1 500 – 5 000'),
      cat('Billet d’avion', '✈️', 900, 'Aller simple'),
      cat('Installation', '🏠', 5000, 'Premières dépenses'),
      cat('Enregistrement entreprise', '🏛️', 400, 'Registre provincial'),
      cat('Compte bancaire entreprise', '🏦', 0, 'Exigé par l’organisation désignée'),
      cat('Fonds d’investissement min.', '💵', 22000, 'Selon organisation désignée', '20 000 – 200 000'),
    ],
  },

  regularisation: {
    motif: 'regularisation',
    devise: 'CAD',
    totalEstime: 1550,
    totalFourchette: '500 – 5 000',
    notesBudget: 'Varie selon la voie choisie (restauration, H&C, CERP). Consultez un professionnel pour évaluer votre situation.',
    categories: [
      cat('Frais de restauration/extension', '🇨🇦', 555, 'Permis étudiant 150 $ ou travail 255 $ + restauration 300 $'),
      cat('Biométrie', '🪩', 85, 'Si non déjà fournie'),
      cat('Traduction de documents', '📑', 300, 'Actes, diplômes, historique'),
      cat('Honoraires conseiller', '🧑‍⚖️', 400, 'Consultation spécialisée fortement recommandée', '200 – 2 000'),
      cat('Casier judiciaire', '📜', 50, 'Du pays d’origine (légalisé)'),
      cat('Imprévus', '💰', 160, 'Réserve'),
    ],
  },

  visiter: {
    motif: 'visiter',
    devise: 'CAD',
    totalEstime: 4125,
    totalFourchette: '1 500 – 8 000',
    notesBudget: 'Budget pour 1 mois de séjour, 1 personne. La preuve de fonds minimale exigée est généralement de 2 500 CAD.',
    categories: [
      cat('Frais de visa', '🇨🇦', 100, 'Par personne'),
      cat('Biométrie', '🪩', 85, 'Par personne'),
      cat('Billet d’avion', '✈️', 900, 'Aller-retour', '600 – 1 800'),
      cat('Hébergement', '🏨', 1200, '40 CAD/nuit × 30 jours (estimation)', '25 – 150/nuit'),
      cat('Alimentation', '🍽️', 600, '20 CAD/jour'),
      cat('Transport local', '🚍', 120, 'Transport en commun'),
      cat('Assurance voyage', '🛡️', 80, 'Fortement recommandée'),
      cat('Imprévus', '💰', 300, 'Réserve'),
    ],
  },
};

/** Retourne le budget estimé pour un motif donné */
export function buildMotifBudget(motif: CapiMotif): MotifBudget {
  return BUDGETS[motif] ?? BUDGETS.visiter;
}
