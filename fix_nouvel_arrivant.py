import sys, os

path = r'c:\capitunecax\mobile\app\capi\nouvel-arrivant.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find start/end markers (using the actual Unicode apostrophe ' in the file)
start_marker = "    case 'student':"
end_marker = "    default:\n      return [];\n  }\n}"

start = content.find(start_marker)
end = content.find(end_marker)
if start == -1 or end == -1:
    print(f'MARKERS NOT FOUND: start={start}, end={end}')
    # Try alternate
    for i, line in enumerate(content.split('\n')):
        if 'student' in line or 'default' in line or 'worker' in line or 'asylum' in line:
            print(f'  Line {i}: {repr(line[:80])}')
    sys.exit(1)

print(f'Found start at {start}, end at {end}')
print(f'Length to replace: {end - start}')

new_student_worker_asylum = """    case 'student':
      return [
        // \u2500\u2500 \u00c9tape 1 \u2500\u2500
        {
          id: 'airport',
          title: 'Arriv\u00e9e \u00e0 l\u2019a\u00e9roport',
          description: 'Franchir le contr\u00f4le des fronti\u00e8res et obtenir votre permis d\u2019\u00e9tudes physique. V\u00e9rifiez attentivement les conditions inscrites sur le permis.',
          when: 'Jour 0',
          documents: ['Passeport valide', 'Lettre d\u2019introduction IRCC', 'Lettre d\u2019admission', 'Preuve de fonds', 'Adresse au Canada'],
          links: [
            { label: 'ASFC \u2014 Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Arriver avec un permis d\u2019\u00e9tudes \u2014 IRCC (officiel)', url: OFFICIAL.studyPermitConditions },
            { label: '\u00c9tudier au Canada \u2014 IRCC (officiel)', url: OFFICIAL.studyIRCC },
          ],
          checkItems: [
            { id: 'present_docs', label: 'Pr\u00e9senter passeport, lettre IRCC et lettre d\u2019admission.' },
            { id: 'receive_permit', label: 'Recevoir le permis d\u2019\u00e9tudes et v\u00e9rifier dates/conditions.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 2 \u2500\u2500
        {
          id: 'temp_housing',
          title: 'H\u00e9bergement temporaire',
          description: 'Les premiers jours, pr\u00e9f\u00e9rez une r\u00e9sidence \u00e9tudiante, un Airbnb ou une auberge proche du campus. Notez l\u2019adresse pour vos premi\u00e8res d\u00e9marches.',
          when: 'Jour 1\u20137',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Moyen de paiement'],
          links: [
            { label: 'Logement \u2014 guide \u00e9tudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'Airbnb Canada (officiel)', url: EXTERNAL.airbnb },
            { label: 'Kijiji \u2014 logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'SCHL/CMHC \u2014 Louer au Canada (officiel)', url: EXTERNAL.cmhcRent },
          ],
          checkItems: [
            { id: 'choose_option', label: 'Choisir une option d\u2019h\u00e9bergement temporaire.' },
            { id: 'confirm', label: 'Confirmer l\u2019adresse.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 3 \u2500\u2500
        {
          id: 'study_basics',
          title: 'Comprendre votre permis d\u2019\u00e9tudes',
          description: 'Le permis pr\u00e9cise si vous pouvez travailler hors campus, les heures autoris\u00e9es et l\u2019\u00e9tablissement d\u00e9sign\u00e9. Ne pas le respecter peut affecter votre statut.',
          when: 'Semaine 1',
          documents: ['Permis d\u2019\u00e9tudes', 'Passeport'],
          links: [
            { label: 'Conditions du permis d\u2019\u00e9tudes \u2014 IRCC (officiel)', url: OFFICIAL.studyPermitConditions },
            { label: 'Renouveler le permis \u2014 IRCC (officiel)', url: OFFICIAL.studyPermitRenew },
            { label: 'Liste des DLI (EED) \u2014 IRCC (officiel)', url: OFFICIAL.dliListIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire toutes les conditions inscrites sur le permis.' },
            { id: 'calendar', label: 'Noter les dates cl\u00e9s (expiration, renouvellement 2 mois avant).' },
            { id: 'work_rights', label: 'V\u00e9rifier les droits de travail autoris\u00e9s.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 4 \u2500\u2500
        {
          id: 'campus',
          title: 'Inscription & int\u00e9gration campus',
          description: 'Finaliser l\u2019inscription, obtenir la carte \u00e9tudiante, activer les outils num\u00e9riques et rep\u00e9rer les services du campus (sant\u00e9, aide, emploi).',
          when: 'Semaine 1\u20134',
          documents: ['Lettre d\u2019admission', 'Num\u00e9ro \u00e9tudiant', 'Pi\u00e8ce d\u2019identit\u00e9'],
          links: [
            { label: 'Liste officielle des \u00e9tablissements d\u00e9sign\u00e9s \u2014 IRCC', url: OFFICIAL.dliListIRCC },
            { label: '\u00c9tudier au Canada \u2014 IRCC (officiel)', url: OFFICIAL.studyIRCC },
          ],
          checkItems: [
            { id: 'register', label: 'Finaliser l\u2019inscription et payer les frais si requis.' },
            { id: 'student_card', label: 'Obtenir la carte \u00e9tudiante.' },
            { id: 'portal', label: 'Activer le portail acad\u00e9mique, le courriel et les outils num\u00e9riques.' },
            { id: 'services', label: 'Rep\u00e9rer les services campus (sant\u00e9, aide, emploi, international).' },
          ],
        },
        // \u2500\u2500 \u00c9tape 5 \u2500\u2500
        {
          id: 'phone',
          title: 'T\u00e9l\u00e9phone & internet',
          description: 'Un num\u00e9ro canadien est requis pour la banque, le logement et les d\u00e9marches du campus. Commencez par un forfait pr\u00e9pay\u00e9 ou sans engagement.',
          when: 'Semaine 1',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Moyen de paiement'],
          links: [
            { label: 'T\u00e9l\u00e9phonie \u2014 guide \u00e9tudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Koodo \u2014 forfaits abordables', url: EXTERNAL.koodo },
            { label: 'Fido \u2014 forfaits', url: EXTERNAL.fido },
            { label: 'Fizz \u2014 pr\u00e9pay\u00e9 / mensuel', url: EXTERNAL.fizz },
            { label: 'Public Mobile \u2014 pr\u00e9pay\u00e9 abordable', url: EXTERNAL.publicMobile },
          ],
          checkItems: [
            { id: 'choose', label: 'Choisir un forfait adapt\u00e9 au budget \u00e9tudiant.' },
            { id: 'activate', label: 'Activer la SIM/eSIM et tester appels + donn\u00e9es.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 6 \u2500\u2500
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Renseignez-vous sur les tarifs \u00e9tudiants. Beaucoup d\u2019\u00e9tablissements ont des ententes avec les r\u00e9seaux locaux.',
          when: 'Semaine 1\u20132',
          documents: ['Carte \u00e9tudiante (selon r\u00e9seau)'],
          links: [
            { label: 'Transports \u2014 guide \u00e9tudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM \u2014 Montr\u00e9al (officiel)', url: EXTERNAL.stm },
            { label: 'TTC \u2014 Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink \u2014 Vancouver (officiel)', url: EXTERNAL.translink },
            { label: 'OC Transpo \u2014 Ottawa (officiel)', url: EXTERNAL.octranspo },
            { label: 'EXO \u2014 Montr\u00e9al grandes lignes (officiel)', url: EXTERNAL.exo },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le r\u00e9seau et les tarifs \u00e9tudiants.' },
            { id: 'card', label: 'Obtenir un abonnement ou une carte rechargeable.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 7 \u2500\u2500
        {
          id: 'bank',
          title: 'Ouvrir un compte bancaire',
          description: 'G\u00e9rer vos d\u00e9penses et recevoir les virements. Plusieurs banques offrent des comptes \u00e9tudiants sans frais.',
          when: 'Semaine 1\u20132',
          documents: ['Passeport', 'Permis d\u2019\u00e9tudes', 'Adresse canadienne (si disponible)'],
          links: [
            { label: 'Banques \u2014 guide \u00e9tudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.banks },
            { label: 'Ouvrir un compte \u2014 ACFC (officiel)', url: OFFICIAL.fcac },
            { label: 'RBC Nouveaux arrivants / \u00e9tudiants', url: EXTERNAL.rbcNewcomers },
            { label: 'TD Nouveaux arrivants / \u00e9tudiants', url: EXTERNAL.tdNewcomers },
            { label: 'BMO Nouveaux arrivants', url: EXTERNAL.bmoNewcomers },
            { label: 'Simplii \u2014 compte sans frais', url: EXTERNAL.simplii },
          ],
          checkItems: [
            { id: 'compare', label: 'Comparer les offres \u00ab\u00a0\u00e9tudiant / nouvel arrivant\u00a0\u00bb.' },
            { id: 'open', label: 'Ouvrir le compte et configurer les notifications.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 8 \u2500\u2500
        {
          id: 'sin',
          title: 'NAS/SIN (si vous travaillez)',
          description: 'Le permis d\u2019\u00e9tudes autorise le travail hors campus jusqu\u2019\u00e0 24h/semaine en session. Obtenez le NAS avant tout emploi r\u00e9mun\u00e9r\u00e9.',
          when: 'Semaine 1\u20133',
          documents: ['Passeport', 'Permis d\u2019\u00e9tudes'],
          links: [
            { label: 'Demander un NAS \u2014 Service Canada (officiel)', url: OFFICIAL.sinServiceCanada },
            { label: 'Trouver un bureau Service Canada', url: OFFICIAL.serviceCanadaOffices },
          ],
          checkItems: [
            { id: 'eligibility', label: 'V\u00e9rifier que le permis autorise le travail.' },
            { id: 'apply', label: 'Faire la demande de NAS aupr\u00e8s de Service Canada.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 9 \u2500\u2500
        {
          id: 'address',
          title: 'Logement stable (proche campus)',
          description: 'S\u00e9curiser un bail ou une r\u00e9sidence \u00e9tudiante pour l\u2019ann\u00e9e. Comparez : r\u00e9sidence campus, coloc, appartement.',
          when: 'Mois 1',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Preuve d\u2019inscription', 'Garant (si demand\u00e9)'],
          links: [
            { label: 'Logement \u2014 guide \u00e9tudiant (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC \u2014 Location (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'Kijiji \u2014 logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'TAL \u2014 droits locataires Qu\u00e9bec (officiel)', url: EXTERNAL.talQC },
            { label: 'LTB \u2014 droits locataires Ontario (officiel)', url: EXTERNAL.ltbON },
          ],
          checkItems: [
            { id: 'budget', label: 'Fixer un budget logement (loyer + services + alimentation).' },
            { id: 'shortlist', label: 'Lister 5\u201310 annonces proches du campus ou du transport.' },
            { id: 'bail', label: 'Signer un bail \u00e9crit et en conserver une copie.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 10 \u2500\u2500
        {
          id: 'job',
          title: 'Emploi \u00e0 temps partiel (si applicable)',
          description: 'Les \u00e9tudiants internationaux peuvent travailler jusqu\u2019\u00e0 24h/semaine et \u00e0 temps plein lors des cong\u00e9s. Priorisez les offres campus.',
          when: 'Mois 1\u20133',
          documents: ['NAS', 'CV (format Canada)', 'Horaire de cours'],
          links: [
            { label: 'Job Bank \u2014 emplois Canada (officiel)', url: OFFICIAL.jobBank },
            { label: 'Indeed Canada (officiel)', url: EXTERNAL.indeed },
            { label: 'LinkedIn Canada (officiel)', url: EXTERNAL.linkedin },
          ],
          checkItems: [
            { id: 'cv', label: 'Pr\u00e9parer le CV (format canadien, 1 page).' },
            { id: 'apply', label: 'Cibler des offres compatibles avec l\u2019horaire de cours.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 11 \u2500\u2500
        {
          id: 'settlement',
          title: 'Services d\u2019int\u00e9gration (campus & organismes)',
          description: 'Les bureaux \u00ab\u00a0International Students\u00a0\u00bb offrent orientation et ateliers. Des organismes offrent cours de fran\u00e7ais/anglais gratuits.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d\u2019\u00e9tablissement \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Ressources essentielles (CAPITUNE)', url: CAPITUNE_RESOURCES.newcomerIndex },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver les services internationaux de votre campus.' },
            { id: 'contact', label: 'Contacter un organisme d\u2019\u00e9tablissement externe.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 12 \u2500\u2500
        {
          id: 'tax',
          title: 'Imp\u00f4ts & fiscalit\u00e9',
          description: 'M\u00eame avec de petits revenus, d\u00e9clarer peut donner droit \u00e0 des cr\u00e9dits. Le T2202 (re\u00e7u de frais de scolarit\u00e9) r\u00e9duit l\u2019imp\u00f4t.',
          when: 'Mois 3 (puis annuel)',
          documents: ['NAS', 'T4 / re\u00e7us de revenus (si applicable)', 'Re\u00e7u T2202 (frais scolaires)'],
          links: [
            { label: 'Nouveaux arrivants \u2014 ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'Mon dossier CRA (officiel)', url: OFFICIAL.craMyAccount },
            { label: 'Wealthsimple Tax \u2014 d\u00e9claration gratuite', url: EXTERNAL.wealthsimpleTax },
          ],
          checkItems: [
            { id: 'understand', label: 'Comprendre les obligations (r\u00e9sidence fiscale, revenus).' },
            { id: 't2202', label: 'T\u00e9l\u00e9charger le re\u00e7u T2202 sur le portail \u00e9tudiant.' },
            { id: 'plan', label: 'Produire la d\u00e9claration ou se faire aider via le campus.' },
          ],
        },
      ];

    // \u2500\u2500\u2500 TRAVAILLEUR TEMPORAIRE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case 'worker':
      return [
        // \u2500\u2500 \u00c9tape 1 \u2500\u2500
        {
          id: 'airport',
          title: 'Arriv\u00e9e \u00e0 l\u2019a\u00e9roport',
          description: 'Franchir le contr\u00f4le des fronti\u00e8res et obtenir votre permis de travail physique. V\u00e9rifiez les conditions (employeur, poste, dates).',
          when: 'Jour 0',
          documents: ['Passeport valide', 'Lettre d\u2019introduction IRCC', 'Offre d\u2019emploi / contrat', 'Adresse au Canada'],
          links: [
            { label: 'ASFC \u2014 Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Permis de travail \u2014 IRCC (officiel)', url: OFFICIAL.workPermitIRCC },
          ],
          checkItems: [
            { id: 'present_docs', label: 'Pr\u00e9senter passeport, lettre IRCC + offre/contrat.' },
            { id: 'receive_permit', label: 'Recevoir le permis de travail et v\u00e9rifier les conditions.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 2 \u2500\u2500
        {
          id: 'temp_housing',
          title: 'H\u00e9bergement temporaire',
          description: 'Stabiliser un premier toit (Airbnb, h\u00f4tel, proches) pendant la recherche de logement. Confirmez une adresse pour les d\u00e9marches.',
          when: 'Jour 1\u20137',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Moyen de paiement'],
          links: [
            { label: 'Logement \u2014 guide (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'Airbnb Canada (officiel)', url: EXTERNAL.airbnb },
            { label: 'Kijiji \u2014 logements (officiel)', url: EXTERNAL.kijiji },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
          ],
          checkItems: [
            { id: 'choose_option', label: 'Choisir une option d\u2019h\u00e9bergement temporaire.' },
            { id: 'confirm', label: 'Confirmer et noter l\u2019adresse.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 3 \u2500\u2500
        {
          id: 'work_permit',
          title: 'Comprendre votre permis de travail',
          description: 'Distinguez permis ouvert (tout employeur) et ferm\u00e9 (employeur sp\u00e9cifique). Respecter les conditions \u00e9vite des probl\u00e8mes de statut.',
          when: 'Semaine 1',
          documents: ['Permis de travail', 'Passeport'],
          links: [
            { label: 'Conditions du permis de travail \u2014 IRCC (officiel)', url: OFFICIAL.workPermitIRCC },
            { label: 'Renouveler / modifier le permis \u2014 IRCC (officiel)', url: OFFICIAL.workPermitRenew },
            { label: 'Travailler au Canada \u2014 IRCC (officiel)', url: OFFICIAL.workIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les conditions de votre permis (employeur, poste, lieu).' },
            { id: 'dates', label: 'Noter les dates d\u2019expiration et pr\u00e9voir le renouvellement 2 mois avant.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 4 \u2500\u2500
        {
          id: 'rights',
          title: 'Droits & protections au travail',
          description: 'Vous avez les m\u00eames droits qu\u2019un travailleur canadien. Connaissez les recours si vos droits ne sont pas respect\u00e9s.',
          when: 'Semaine 1\u20132',
          documents: ['Contrat de travail', 'Coordonn\u00e9es de l\u2019employeur'],
          links: [
            { label: 'Droits des travailleurs \u00e9trangers \u2014 EDSC (officiel)', url: OFFICIAL.tfwRights },
            { label: 'Programme des travailleurs \u00e9trangers \u2014 EDSC (officiel)', url: OFFICIAL.tfwESDC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les informations officielles sur vos droits.' },
            { id: 'keep_contract', label: 'Conserver le contrat, les bulletins de paie et preuves d\u2019heures.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 5 \u2500\u2500
        {
          id: 'sin',
          title: 'Num\u00e9ro d\u2019assurance sociale (NAS)',
          description: 'Requis avant d\u2019\u00eatre pay\u00e9. Faites la demande dans les premiers jours. Votre NAS est li\u00e9 \u00e0 votre permis.',
          when: 'Semaine 1',
          documents: ['Passeport', 'Permis de travail'],
          links: [
            { label: 'Demander un NAS \u2014 Service Canada (officiel)', url: OFFICIAL.sinServiceCanada },
            { label: 'Trouver un bureau Service Canada', url: OFFICIAL.serviceCanadaOffices },
          ],
          checkItems: [
            { id: 'prepare_docs', label: 'Pr\u00e9parer les documents requis.' },
            { id: 'apply', label: 'Faire la demande de NAS.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 6 \u2500\u2500
        {
          id: 'bank',
          title: 'Ouvrir un compte bancaire',
          description: 'Indispensable pour recevoir votre salaire. Plusieurs banques accueillent les travailleurs sans historique canadien.',
          when: 'Semaine 1\u20132',
          documents: ['Passeport', 'Permis de travail', 'Adresse canadienne'],
          links: [
            { label: 'Banques \u2014 guide (CAPITUNE)', url: CAPITUNE_RESOURCES.banks },
            { label: 'Ouvrir un compte \u2014 ACFC (officiel)', url: OFFICIAL.fcac },
            { label: 'RBC Nouveaux arrivants', url: EXTERNAL.rbcNewcomers },
            { label: 'TD Nouveaux arrivants', url: EXTERNAL.tdNewcomers },
            { label: 'Scotiabank Se lancer au Canada', url: EXTERNAL.scotiabankNewcomers },
            { label: 'BMO Nouveaux arrivants', url: EXTERNAL.bmoNewcomers },
          ],
          checkItems: [
            { id: 'compare', label: 'Comparer 2\u20133 banques (frais, d\u00e9p\u00f4t de paie direct).' },
            { id: 'open', label: 'Ouvrir le compte et fournir les infos de d\u00e9p\u00f4t direct \u00e0 l\u2019employeur.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 7 \u2500\u2500
        {
          id: 'health',
          title: 'Assurance maladie provinciale',
          description: 'Certaines provinces ont une p\u00e9riode d\u2019attente. Souscrivez une assurance priv\u00e9e transitoire si c\u2019est le cas.',
          when: 'Semaine 1\u20133',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Preuve de r\u00e9sidence (selon province)'],
          links: [
            { label: 'RAMQ \u2014 Qu\u00e9bec (officiel)', url: EXTERNAL.ramq },
            { label: 'OHIP \u2014 Ontario (officiel)', url: EXTERNAL.ohip },
            { label: 'MSP \u2014 Colombie-Britannique (officiel)', url: EXTERNAL.mspBC },
            { label: 'AHCIP \u2014 Alberta (officiel)', url: EXTERNAL.ahcipAB },
          ],
          checkItems: [
            { id: 'identify_province', label: 'Identifier la d\u00e9marche de votre province.' },
            { id: 'apply', label: 'D\u00e9poser la demande de couverture sant\u00e9.' },
            { id: 'interim', label: 'Si p\u00e9riode d\u2019attente : souscrire une assurance temporaire.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 8 \u2500\u2500
        {
          id: 'phone',
          title: 'T\u00e9l\u00e9phone & internet',
          description: 'Utile pour l\u2019employeur, la banque et les d\u00e9marches. Optez pour un forfait sans engagement au d\u00e9but.',
          when: 'Semaine 1',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Moyen de paiement'],
          links: [
            { label: 'T\u00e9l\u00e9phonie \u2014 guide (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Koodo \u2014 forfaits', url: EXTERNAL.koodo },
            { label: 'Fido \u2014 forfaits', url: EXTERNAL.fido },
            { label: 'Public Mobile \u2014 pr\u00e9pay\u00e9', url: EXTERNAL.publicMobile },
          ],
          checkItems: [
            { id: 'choose', label: 'Choisir un forfait et activer la ligne.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 9 \u2500\u2500
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Carte transport, applis officielles. Certains employeurs remboursent les frais de transport.',
          when: 'Semaine 1\u20132',
          documents: [],
          links: [
            { label: 'Transports \u2014 guide (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM \u2014 Montr\u00e9al (officiel)', url: EXTERNAL.stm },
            { label: 'TTC \u2014 Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink \u2014 Vancouver (officiel)', url: EXTERNAL.translink },
            { label: 'OC Transpo \u2014 Ottawa (officiel)', url: EXTERNAL.octranspo },
            { label: 'EXO \u2014 Montr\u00e9al grandes lignes (officiel)', url: EXTERNAL.exo },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le r\u00e9seau officiel.' },
            { id: 'card', label: 'Obtenir/recharger une carte de transport.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 10 \u2500\u2500
        {
          id: 'housing_perm',
          title: 'Logement permanent',
          description: 'Chercher un logement stable avec un bail. Pr\u00e9parez un dossier locataire (preuves de revenus, ID).',
          when: 'Mois 1',
          documents: ['Pi\u00e8ce d\u2019identit\u00e9', 'Preuve de revenus (lettre employeur / talons de paie)'],
          links: [
            { label: 'Logement \u2014 guide (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC \u2014 Location (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'Rentals.ca (officiel)', url: EXTERNAL.rentals },
            { label: 'PadMapper (officiel)', url: EXTERNAL.padmapper },
            { label: 'TAL \u2014 droits locataires Qu\u00e9bec (officiel)', url: EXTERNAL.talQC },
            { label: 'LTB \u2014 droits locataires Ontario (officiel)', url: EXTERNAL.ltbON },
          ],
          checkItems: [
            { id: 'prepare_file', label: 'Pr\u00e9parer le dossier locataire.' },
            { id: 'search', label: 'Shortlist et visites.' },
            { id: 'bail', label: 'Signer un bail \u00e9crit.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 11 \u2500\u2500
        {
          id: 'job_opportunities',
          title: '\u00c9volution de carri\u00e8re & opportunit\u00e9s',
          description: 'M\u00eame avec un emploi, renseignez-vous sur vos perspectives. Certains permis permettent de changer d\u2019employeur ou m\u00e8nent \u00e0 la r\u00e9sidence permanente.',
          when: 'Mois 1\u20133',
          documents: ['CV \u00e0 jour', 'NAS'],
          links: [
            { label: 'Job Bank \u2014 emplois Canada (officiel)', url: OFFICIAL.jobBank },
            { label: 'LinkedIn Canada (officiel)', url: EXTERNAL.linkedin },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
            { label: 'Entr\u00e9e express \u2014 IRCC (officiel)', url: OFFICIAL.expressEntry },
          ],
          checkItems: [
            { id: 'cv', label: 'Mettre \u00e0 jour le CV (format canadien).' },
            { id: 'market', label: 'Rep\u00e9rer les offres et salaires de r\u00e9f\u00e9rence.' },
            { id: 'pr_path', label: 'V\u00e9rifier l\u2019admissibilit\u00e9 \u00e0 la r\u00e9sidence permanente.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 12 \u2500\u2500
        {
          id: 'settlement',
          title: 'Services d\u2019int\u00e9gration',
          description: 'Les organismes locaux aident \u00e0 l\u2019emploi, \u00e0 l\u2019apprentissage des langues et \u00e0 l\u2019int\u00e9gration \u2014 utile m\u00eame en statut temporaire.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d\u2019\u00e9tablissement \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'ACCES Employment', url: EXTERNAL.acces },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver un organisme d\u2019\u00e9tablissement local.' },
            { id: 'contact', label: 'Prendre contact et consulter les services disponibles.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 13 \u2500\u2500
        {
          id: 'tax',
          title: 'Imp\u00f4ts & fiscalit\u00e9',
          description: 'En tant que travailleur, vous \u00eates imposable sur vos revenus canadiens. D\u00e9clarez annuellement et v\u00e9rifiez les cr\u00e9dits (TPS/TVH, d\u00e9penses).',
          when: 'Mois 3 (puis annuel)',
          documents: ['NAS', 'T4 (billet de paie annuel)', 'Re\u00e7us de d\u00e9penses d\u00e9ductibles'],
          links: [
            { label: 'Nouveaux arrivants \u2014 ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'Mon dossier CRA \u2014 en ligne (officiel)', url: OFFICIAL.craMyAccount },
            { label: 'Assurance-emploi \u2014 EDSC (officiel)', url: OFFICIAL.eiServiceCanada },
            { label: 'Wealthsimple Tax \u2014 d\u00e9claration gratuite', url: EXTERNAL.wealthsimpleTax },
          ],
          checkItems: [
            { id: 'understand', label: 'Comprendre les bases (T4, retenues, cr\u00e9dits).' },
            { id: 'plan', label: 'Rassembler les feuillets et pr\u00e9parer la d\u00e9claration.' },
            { id: 'ei', label: 'V\u00e9rifier les droits \u00e0 l\u2019assurance-emploi si applicable.' },
          ],
        },
      ];

    // \u2500\u2500\u2500 DEMANDEUR D'ASILE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
    case 'asylum':
      return [
        // \u2500\u2500 \u00c9tape 1 \u2500\u2500
        {
          id: 'airport',
          title: 'Arriv\u00e9e & d\u00e9claration d\u2019asile',
          description: 'D\u00e9clarez clairement votre intention \u00e0 l\u2019agent des services frontaliers. Un formulaire sera rempli et votre demande sera initialis\u00e9e. Gardez tous vos documents.',
          when: 'Jour 0',
          documents: ['Passeport (si disponible)', 'Pi\u00e8ces d\u2019identit\u00e9 (disponibles)', 'Preuves de pers\u00e9cution (si disponibles)'],
          links: [
            { label: 'ASFC \u2014 Voyager au Canada (officiel)', url: OFFICIAL.cbsaTravel },
            { label: 'Demander l\u2019asile \u2014 IRCC (officiel)', url: OFFICIAL.asylumIRCC },
            { label: 'Processus d\u2019octroi de l\u2019asile \u2014 IRCC (officiel)', url: OFFICIAL.asylumProcess },
          ],
          checkItems: [
            { id: 'declare', label: 'Indiquer clairement votre intention de demander la protection.' },
            { id: 'follow', label: 'Suivre les instructions de l\u2019agent (entrevue, documents, formulaires).' },
            { id: 'keep_docs', label: 'Conserver tous les documents remis par l\u2019ASFC.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 2 \u2500\u2500
        {
          id: 'temp_housing',
          title: 'H\u00e9bergement & s\u00e9curit\u00e9',
          description: 'Stabiliser un h\u00e9bergement s\u00fbr et obtenir une adresse de contact fiable pour recevoir les communications officielles.',
          when: 'Jour 1\u20137',
          documents: [],
          links: [
            { label: 'R\u00e9fugi\u00e9s & asile \u2014 IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
            { label: 'S\u2019\u00e9tablir au Canada \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'Logement \u2014 ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
          ],
          checkItems: [
            { id: 'safe_place', label: 'Trouver un h\u00e9bergement s\u00fbr.' },
            { id: 'contact', label: 'Avoir une adresse et un num\u00e9ro pour les communications officielles.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 3 \u2500\u2500
        {
          id: 'health',
          title: 'Soins de sant\u00e9 (PFSI/IFHP)',
          description: 'Le Programme f\u00e9d\u00e9ral de sant\u00e9 int\u00e9rimaire offre une couverture de base aux demandeurs d\u2019asile. V\u00e9rifiez votre admissibilit\u00e9 rapidement.',
          when: 'Semaine 1',
          documents: [],
          links: [
            { label: 'Programme f\u00e9d\u00e9ral de sant\u00e9 int\u00e9rimaire \u2014 IRCC (officiel)', url: OFFICIAL.ifhpIRCC },
            { label: 'R\u00e9fugi\u00e9s \u2014 IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
          ],
          checkItems: [
            { id: 'check', label: 'V\u00e9rifier l\u2019admissibilit\u00e9 au PFSI/IFHP.' },
            { id: 'use', label: 'Savoir comment utiliser la couverture (clinique, pharmacie).' },
          ],
        },
        // \u2500\u2500 \u00c9tape 4 \u2500\u2500
        {
          id: 'phone',
          title: 'T\u00e9l\u00e9phone & communication',
          description: 'Un num\u00e9ro de t\u00e9l\u00e9phone est essentiel pour recevoir les convocations officielles (CISR, IRCC) et acc\u00e9der aux services.',
          when: 'Semaine 1',
          documents: [],
          links: [
            { label: 'T\u00e9l\u00e9phonie \u2014 ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.phoneInternet },
            { label: 'Public Mobile \u2014 pr\u00e9pay\u00e9 abordable', url: EXTERNAL.publicMobile },
            { label: 'Fizz \u2014 pr\u00e9pay\u00e9 abordable', url: EXTERNAL.fizz },
          ],
          checkItems: [
            { id: 'line', label: 'Obtenir et activer une ligne t\u00e9l\u00e9phonique.' },
            { id: 'update', label: 'Communiquer le num\u00e9ro aux autorit\u00e9s (IRCC, CISR).' },
          ],
        },
        // \u2500\u2500 \u00c9tape 5 \u2500\u2500
        {
          id: 'irb',
          title: 'Processus CISR / IRB',
          description: 'La Commission de l\u2019immigration et du statut de r\u00e9fugi\u00e9 (CISR) \u00e9tudiera votre demande lors d\u2019une audience. Pr\u00e9parez-vous avec l\u2019aide d\u2019un avocat ou consultant.',
          when: 'Mois 1\u20136',
          documents: ['Documents d\u2019identit\u00e9', 'Preuves de pers\u00e9cution', 'Formulaire de renseignements personnels'],
          links: [
            { label: 'CISR / IRB \u2014 Site officiel', url: OFFICIAL.irb },
            { label: 'Processus SPR \u2014 CISR (officiel)', url: OFFICIAL.irbProcess },
            { label: 'Demande d\u2019asile \u2014 IRCC (officiel)', url: OFFICIAL.asylumIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire le processus officiel et les d\u00e9lais.' },
            { id: 'lawyer', label: 'Consulter un avocat ou repr\u00e9sentant accr\u00e9dit\u00e9.' },
            { id: 'prepare', label: 'Organiser les documents et preuves \u00e0 pr\u00e9senter.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 6 \u2500\u2500
        {
          id: 'transport',
          title: 'Transports en commun',
          description: 'Organiser vos d\u00e9placements pour les rendez-vous officiels, les services et les besoins quotidiens.',
          when: 'Semaine 1\u20132',
          documents: [],
          links: [
            { label: 'Transports \u2014 ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.transport },
            { label: 'STM \u2014 Montr\u00e9al (officiel)', url: EXTERNAL.stm },
            { label: 'TTC \u2014 Toronto (officiel)', url: EXTERNAL.ttc },
            { label: 'TransLink \u2014 Vancouver (officiel)', url: EXTERNAL.translink },
          ],
          checkItems: [
            { id: 'network', label: 'Identifier le r\u00e9seau local officiel.' },
            { id: 'card', label: 'Obtenir une carte ou abonnement.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 7 \u2500\u2500
        {
          id: 'housing_perm',
          title: 'Logement (stabilisation)',
          description: 'Chercher une solution de logement plus stable. Des organismes locaux peuvent aider \u00e0 acc\u00e9der \u00e0 des ressources.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Logement \u2014 ressources (CAPITUNE)', url: CAPITUNE_RESOURCES.housing },
            { label: 'SCHL/CMHC \u2014 logement (officiel)', url: EXTERNAL.cmhcRent },
            { label: 'S\u2019\u00e9tablir au Canada \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'plan', label: 'Identifier une solution de logement plus stable.' },
          ],
        },
        // \u2500\u2500 \u00c9tape 8 \u2500\u2500
        {
          id: 'settlement',
          title: 'Organismes d\u2019\u00e9tablissement & aide locale',
          description: 'Des organismes offrent aide juridique, cours de langue, orientation, emploi et services sociaux gratuits pour les demandeurs d\u2019asile.',
          when: 'Mois 1',
          documents: [],
          links: [
            { label: 'Services d\u2019\u00e9tablissement \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
            { label: 'R\u00e9fugi\u00e9s \u2014 IRCC (officiel)', url: OFFICIAL.refugeesIRCC },
            { label: 'COSTI \u2014 Toronto (services d\u2019\u00e9tablissement)', url: EXTERNAL.costiToronto },
            { label: 'YMCA Settlement Services', url: EXTERNAL.ymca },
          ],
          checkItems: [
            { id: 'find_org', label: 'Trouver un organisme local offrant aide aux r\u00e9fugi\u00e9s/asile.' },
            { id: 'legal', label: 'Obtenir une aide juridique si possible (pour l\u2019audience CISR).' },
          ],
        },
        // \u2500\u2500 \u00c9tape 9 \u2500\u2500
        {
          id: 'tax',
          title: 'D\u00e9marches administratives & fiscalit\u00e9',
          description: 'Selon votre situation, certaines d\u00e9marches administratives et fiscales peuvent s\u2019appliquer. Consultez les ressources officielles.',
          when: 'Mois 3+',
          documents: [],
          links: [
            { label: 'Nouveaux arrivants \u2014 ARC (officiel)', url: OFFICIAL.taxesCRA },
            { label: 'S\u2019\u00e9tablir au Canada \u2014 IRCC (officiel)', url: OFFICIAL.settleIRCC },
          ],
          checkItems: [
            { id: 'read', label: 'Lire les informations officielles applicables \u00e0 votre situation.' },
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
"""

# Replace the section
# Trim trailing duplicate content (default: block + export default function) already in content[end:]
tail_start = new_student_worker_asylum.rfind('\n    default:\n')
if tail_start != -1:
    new_student_worker_asylum = new_student_worker_asylum[:tail_start + 1]

# Replace only the student/worker/asylum cases; keep default: onwards intact
# new_student_worker_asylum ends just before 'default:' so we use content[end:]
new_content = content[:start] + new_student_worker_asylum + content[end:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done! File written successfully.')
print(f'Original length: {len(content)}, New length: {len(new_content)}')
