// ---------------------------------------------------------------------------
// Données DLI — Établissements d'enseignement désignés (IRCC)
// Source : canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada
// ---------------------------------------------------------------------------

export type DLIType = 'universite' | 'college' | 'cegep' | 'ecole_langue' | 'technique';

export interface DLIInstitution {
  id: string;
  nom: string;
  ville: string;
  province: ProvinceCode;
  type: DLIType;
  website: string;
  admissionsUrl: string;
  fraisSco?: string; // fourchette annuelle approximative
  langues: ('fr' | 'en' | 'bilingual')[];
  tags?: string[]; // domaines importants
}

export type ProvinceCode =
  | 'QC' | 'ON' | 'BC' | 'AB' | 'MB' | 'SK'
  | 'NS' | 'NB' | 'NL' | 'PE' | 'YT' | 'NT' | 'NU';

export const PROVINCE_LABELS: Record<ProvinceCode, string> = {
  QC: 'Québec', ON: 'Ontario', BC: 'Colombie-Brit.', AB: 'Alberta',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nouvelle-Écosse',
  NB: 'N.-Brunswick', NL: 'Terre-Neuve', PE: 'Î.-P.-Édouard',
  YT: 'Yukon', NT: 'T. du Nord-Ouest', NU: 'Nunavut',
};

export const TYPE_LABELS: Record<DLIType, string> = {
  universite: 'Université', college: 'Collège', cegep: 'Cégep',
  ecole_langue: 'École de langues', technique: 'Institut tech.',
};

export const TYPE_EMOJI: Record<DLIType, string> = {
  universite: '🏛️', college: '🏫', cegep: '🎓',
  ecole_langue: '🗣️', technique: '⚙️',
};

// ---------------------------------------------------------------------------
// Base de données
// ---------------------------------------------------------------------------

export const DLI_INSTITUTIONS: DLIInstitution[] = [

  // ── QUÉBEC — Universités ─────────────────────────────────────────────────
  { id: 'mcgill', nom: 'Université McGill', ville: 'Montréal', province: 'QC', type: 'universite', website: 'mcgill.ca', admissionsUrl: 'https://www.mcgill.ca/applying/', fraisSco: '20 000–30 000 $ CA', langues: ['en'], tags: ['médecine', 'droit', 'génie', 'sciences'] },
  { id: 'umontreal', nom: 'Université de Montréal', ville: 'Montréal', province: 'QC', type: 'universite', website: 'umontreal.ca', admissionsUrl: 'https://admission.umontreal.ca/admission/', fraisSco: '7 000–20 000 $ CA', langues: ['fr'], tags: ['droit', 'médecine', 'sciences sociales'] },
  { id: 'ulaval', nom: 'Université Laval', ville: 'Québec', province: 'QC', type: 'universite', website: 'ulaval.ca', admissionsUrl: 'https://www.ulaval.ca/admission', fraisSco: '6 000–18 000 $ CA', langues: ['fr'], tags: ['agronomie', 'droit', 'génie', 'médecine'] },
  { id: 'uqam', nom: 'UQAM — Université du Québec à Montréal', ville: 'Montréal', province: 'QC', type: 'universite', website: 'uqam.ca', admissionsUrl: 'https://etudier.uqam.ca/admissions', fraisSco: '6 000–16 000 $ CA', langues: ['fr'], tags: ['arts', 'communication', 'sciences sociales'] },
  { id: 'concordia', nom: 'Université Concordia', ville: 'Montréal', province: 'QC', type: 'universite', website: 'concordia.ca', admissionsUrl: 'https://www.concordia.ca/admissions.html', fraisSco: '18 000–25 000 $ CA', langues: ['en'], tags: ['arts', 'commerce', 'génie info'] },
  { id: 'ets', nom: 'École de technologie supérieure (ÉTS)', ville: 'Montréal', province: 'QC', type: 'universite', website: 'etsmtl.ca', admissionsUrl: 'https://www.etsmtl.ca/admission', fraisSco: '7 000–18 000 $ CA', langues: ['fr'], tags: ['génie', 'technologie'] },
  { id: 'hec', nom: 'HEC Montréal', ville: 'Montréal', province: 'QC', type: 'universite', website: 'hec.ca', admissionsUrl: 'https://www.hec.ca/admissions/index.html', fraisSco: '8 000–20 000 $ CA', langues: ['fr', 'en'], tags: ['gestion', 'finance', 'MBA'] },
  { id: 'polymtl', nom: 'Polytechnique Montréal', ville: 'Montréal', province: 'QC', type: 'universite', website: 'polymtl.ca', admissionsUrl: 'https://www.polymtl.ca/futurs-etudiants/admission', fraisSco: '7 000–18 000 $ CA', langues: ['fr'], tags: ['génie', 'ingénierie'] },
  { id: 'uqtr', nom: 'UQTR — Université du Québec à Trois-Rivières', ville: 'Trois-Rivières', province: 'QC', type: 'universite', website: 'uqtr.ca', admissionsUrl: 'https://www.uqtr.ca/admissions', fraisSco: '5 500–14 000 $ CA', langues: ['fr'], tags: ['génie', 'médecine', 'chiropratique'] },
  { id: 'uqac', nom: 'UQAC — Université du Québec à Chicoutimi', ville: 'Chicoutimi', province: 'QC', type: 'universite', website: 'uqac.ca', admissionsUrl: 'https://www.uqac.ca/mgestion/capsules/2-4350.pdf', fraisSco: '5 000–13 000 $ CA', langues: ['fr'], tags: ['sciences', 'arts'] },
  { id: 'bishops', nom: "Université Bishop's", ville: 'Lennoxville', province: 'QC', type: 'universite', website: 'ubishops.ca', admissionsUrl: 'https://www.ubishops.ca/future-current-students/admissions/', fraisSco: '15 000–22 000 $ CA', langues: ['en'], tags: ['arts', 'sciences'] },
  { id: 'sherbrooke', nom: 'Université de Sherbrooke', ville: 'Sherbrooke', province: 'QC', type: 'universite', website: 'usherbrooke.ca', admissionsUrl: 'https://www.usherbrooke.ca/admission/', fraisSco: '6 000–17 000 $ CA', langues: ['fr'], tags: ['droit', 'médecine', 'génie'] },

  // ── QUÉBEC — Cégeps ──────────────────────────────────────────────────────
  { id: 'vanier', nom: 'Vanier College', ville: 'Montréal', province: 'QC', type: 'cegep', website: 'vaniercollege.qc.ca', admissionsUrl: 'https://www.vaniercollege.qc.ca/admissions/', fraisSco: '3 000–7 000 $ CA', langues: ['en'], tags: ['sciences', 'arts', 'commerce'] },
  { id: 'dawson', nom: 'Dawson College', ville: 'Montréal', province: 'QC', type: 'cegep', website: 'dawsoncollege.qc.ca', admissionsUrl: 'https://www.dawsoncollege.qc.ca/admissions/', fraisSco: '3 000–7 000 $ CA', langues: ['en'], tags: ['arts', 'sciences', 'technologie'] },
  { id: 'champlain', nom: 'Champlain Regional College', ville: 'Lennoxville', province: 'QC', type: 'cegep', website: 'champlaincollege.qc.ca', admissionsUrl: 'https://www.champlaincollege.qc.ca/admissions/', fraisSco: '3 000–6 000 $ CA', langues: ['en'], tags: ['arts', 'sciences'] },
  { id: 'johnabbott', nom: 'John Abbott College', ville: 'Sainte-Anne-de-Bellevue', province: 'QC', type: 'cegep', website: 'johnabbott.qc.ca', admissionsUrl: 'https://www.johnabbott.qc.ca/international-students/', fraisSco: '3 000–6 500 $ CA', langues: ['en'], tags: ['sciences', 'arts', 'sport-études'] },
  { id: 'ahuntsic', nom: 'Collège Ahuntsic', ville: 'Montréal', province: 'QC', type: 'cegep', website: 'collegeahuntsic.qc.ca', admissionsUrl: 'https://www.collegeahuntsic.qc.ca/admissions', fraisSco: '3 000–6 500 $ CA', langues: ['fr'], tags: ['sciences', 'technique policière'] },
  { id: 'maisonneuve', nom: 'Collège de Maisonneuve', ville: 'Montréal', province: 'QC', type: 'cegep', website: 'cmaisonneuve.qc.ca', admissionsUrl: 'https://www.cmaisonneuve.qc.ca/admission/', fraisSco: '3 000–6 000 $ CA', langues: ['fr'], tags: ['arts', 'sciences'] },
  { id: 'boisdebolougne', nom: 'Collège de Bois-de-Boulogne', ville: 'Montréal', province: 'QC', type: 'cegep', website: 'bdeb.qc.ca', admissionsUrl: 'https://www.bdeb.qc.ca/admission/', fraisSco: '3 000–6 000 $ CA', langues: ['fr'], tags: ['sciences', 'langues'] },
  { id: 'centreintegre', nom: 'Institut national des mines (INM)', ville: 'Val-d\'Or', province: 'QC', type: 'technique', website: 'inm.qc.ca', admissionsUrl: 'https://inm.qc.ca/contact/', fraisSco: '4 000–9 000 $ CA', langues: ['fr'], tags: ['mines', 'géologie'] },

  // ── ONTARIO — Universités ────────────────────────────────────────────────
  { id: 'uoft', nom: 'University of Toronto', ville: 'Toronto', province: 'ON', type: 'universite', website: 'utoronto.ca', admissionsUrl: 'https://future.utoronto.ca/apply/', fraisSco: '30 000–60 000 $ CA', langues: ['en'], tags: ['médecine', 'droit', 'génie', 'IA'] },
  { id: 'yorku', nom: 'York University', ville: 'Toronto', province: 'ON', type: 'universite', website: 'yorku.ca', admissionsUrl: 'https://futurestudents.yorku.ca/apply', fraisSco: '20 000–35 000 $ CA', langues: ['en'], tags: ['droit', 'commerce', 'arts'] },
  { id: 'tmu', nom: 'Toronto Metropolitan University (TMU)', ville: 'Toronto', province: 'ON', type: 'universite', website: 'torontomu.ca', admissionsUrl: 'https://www.torontomu.ca/admissions/', fraisSco: '18 000–30 000 $ CA', langues: ['en'], tags: ['génie', 'communication', 'design'] },
  { id: 'uottawa', nom: 'Université d\'Ottawa', ville: 'Ottawa', province: 'ON', type: 'universite', website: 'uottawa.ca', admissionsUrl: 'https://www.uottawa.ca/admission/fr', fraisSco: '22 000–35 000 $ CA', langues: ['bilingual'], tags: ['droit', 'médecine', 'sciences sociales'] },
  { id: 'carleton', nom: 'Carleton University', ville: 'Ottawa', province: 'ON', type: 'universite', website: 'carleton.ca', admissionsUrl: 'https://admissions.carleton.ca/', fraisSco: '18 000–28 000 $ CA', langues: ['en'], tags: ['journalisme', 'génie', 'sciences politiques'] },
  { id: 'western', nom: 'Western University', ville: 'London', province: 'ON', type: 'universite', website: 'uwo.ca', admissionsUrl: 'https://www.uwo.ca/futurestudents/apply/', fraisSco: '25 000–40 000 $ CA', langues: ['en'], tags: ['MBA', 'médecine', 'droit'] },
  { id: 'mcmaster', nom: 'McMaster University', ville: 'Hamilton', province: 'ON', type: 'universite', website: 'mcmaster.ca', admissionsUrl: 'https://future.mcmaster.ca/apply/', fraisSco: '25 000–38 000 $ CA', langues: ['en'], tags: ['médecine', 'ingénierie', 'sciences'] },
  { id: 'queens', nom: "Queen's University", ville: 'Kingston', province: 'ON', type: 'universite', website: 'queensu.ca', admissionsUrl: 'https://www.queensu.ca/admission/', fraisSco: '24 000–42 000 $ CA', langues: ['en'], tags: ['droit', 'commerce', 'sciences'] },
  { id: 'waterloo', nom: 'University of Waterloo', ville: 'Waterloo', province: 'ON', type: 'universite', website: 'uwaterloo.ca', admissionsUrl: 'https://uwaterloo.ca/future-students/', fraisSco: '26 000–45 000 $ CA', langues: ['en'], tags: ['informatique', 'génie', 'mathématiques', 'co-op'] },
  { id: 'wlu', nom: 'Wilfrid Laurier University', ville: 'Waterloo', province: 'ON', type: 'universite', website: 'wlu.ca', admissionsUrl: 'https://www.wlu.ca/future-students/undergraduate/index.html', fraisSco: '18 000–28 000 $ CA', langues: ['en'], tags: ['commerce', 'musique', 'sciences sociales'] },

  // ── ONTARIO — Collèges ───────────────────────────────────────────────────
  { id: 'seneca', nom: 'Seneca Polytechnic', ville: 'Toronto', province: 'ON', type: 'college', website: 'senecapolytechnic.ca', admissionsUrl: 'https://www.senecacollege.ca/international/apply.html', fraisSco: '12 000–18 000 $ CA', langues: ['en'], tags: ['TI', 'aviation', 'affaires'] },
  { id: 'georgebrown', nom: 'George Brown College', ville: 'Toronto', province: 'ON', type: 'college', website: 'georgebrown.ca', admissionsUrl: 'https://www.georgebrown.ca/admissions', fraisSco: '12 000–18 000 $ CA', langues: ['en'], tags: ['arts culinaires', 'santé', 'design'] },
  { id: 'humber', nom: 'Humber College', ville: 'Toronto', province: 'ON', type: 'college', website: 'humber.ca', admissionsUrl: 'https://humber.ca/admissions/', fraisSco: '13 000–18 000 $ CA', langues: ['en'], tags: ['médias', 'affaires', 'design'] },
  { id: 'centennial', nom: 'Centennial College', ville: 'Toronto', province: 'ON', type: 'college', website: 'centennialcollege.ca', admissionsUrl: 'https://www.centennialcollege.ca/how-to-apply/', fraisSco: '12 000–17 000 $ CA', langues: ['en'], tags: ['aviation', 'transport', 'TI'] },
  { id: 'algonquin', nom: 'Algonquin College', ville: 'Ottawa', province: 'ON', type: 'college', website: 'algonquincollege.com', admissionsUrl: 'https://www.algonquincollege.com/international/', fraisSco: '12 000–17 000 $ CA', langues: ['en', 'fr'], tags: ['TI', 'santé', 'affaires'] },
  { id: 'sheridan', nom: 'Sheridan College', ville: 'Brampton', province: 'ON', type: 'college', website: 'sheridancollege.ca', admissionsUrl: 'https://www.sheridancollege.ca/admissions', fraisSco: '14 000–20 000 $ CA', langues: ['en'], tags: ['animation', 'design', 'technologie'] },
  { id: 'mohawk', nom: 'Mohawk College', ville: 'Hamilton', province: 'ON', type: 'college', website: 'mohawkcollege.ca', admissionsUrl: 'https://www.mohawkcollege.ca/admissions', fraisSco: '11 000–16 000 $ CA', langues: ['en'], tags: ['santé', 'technologie', 'affaires'] },
  { id: 'cambrian', nom: 'Cambrian College', ville: 'Sudbury', province: 'ON', type: 'college', website: 'cambriancollege.ca', admissionsUrl: 'https://cambriancollege.ca/programs/', fraisSco: '10 000–15 000 $ CA', langues: ['en', 'fr'], tags: ['mines', 'santé'] },

  // ── COLOMBIE-BRITANNIQUE ──────────────────────────────────────────────────
  { id: 'ubc', nom: 'University of British Columbia (UBC)', ville: 'Vancouver', province: 'BC', type: 'universite', website: 'ubc.ca', admissionsUrl: 'https://you.ubc.ca/applying-ubc/', fraisSco: '28 000–45 000 $ CA', langues: ['en'], tags: ['IA', 'génie', 'médecine', 'commerce'] },
  { id: 'sfu', nom: 'Simon Fraser University (SFU)', ville: 'Burnaby', province: 'BC', type: 'universite', website: 'sfu.ca', admissionsUrl: 'https://www.sfu.ca/students/admission.html', fraisSco: '22 000–35 000 $ CA', langues: ['en'], tags: ['informatique', 'sciences', 'co-op'] },
  { id: 'uvic', nom: 'University of Victoria', ville: 'Victoria', province: 'BC', type: 'universite', website: 'uvic.ca', admissionsUrl: 'https://www.uvic.ca/registrar/admissions/', fraisSco: '20 000–32 000 $ CA', langues: ['en'], tags: ['droit', 'sciences marines', 'génie'] },
  { id: 'unbc', nom: 'University of Northern BC', ville: 'Prince George', province: 'BC', type: 'universite', website: 'unbc.ca', admissionsUrl: 'https://www.unbc.ca/admissions', fraisSco: '15 000–24 000 $ CA', langues: ['en'], tags: ['environnement', 'foresterie'] },
  { id: 'bcit', nom: 'BCIT — British Columbia Inst. of Technology', ville: 'Burnaby', province: 'BC', type: 'technique', website: 'bcit.ca', admissionsUrl: 'https://www.bcit.ca/admission/', fraisSco: '13 000–20 000 $ CA', langues: ['en'], tags: ['technologie', 'génie', 'santé'] },
  { id: 'langara', nom: 'Langara College', ville: 'Vancouver', province: 'BC', type: 'college', website: 'langara.ca', admissionsUrl: 'https://langara.ca/admissions/', fraisSco: '12 000–17 000 $ CA', langues: ['en'], tags: ['transfert université', 'TI', 'design'] },
  { id: 'douglas', nom: 'Douglas College', ville: 'New Westminster', province: 'BC', type: 'college', website: 'douglascollege.ca', admissionsUrl: 'https://www.douglascollege.ca/admissions', fraisSco: '12 000–17 000 $ CA', langues: ['en'], tags: ['criminologie', 'santé', 'musique'] },
  { id: 'kpu', nom: 'Kwantlen Polytechnic University (KPU)', ville: 'Surrey', province: 'BC', type: 'college', website: 'kpu.ca', admissionsUrl: 'https://www.kpu.ca/admissions', fraisSco: '13 000–19 000 $ CA', langues: ['en'], tags: ['design', 'affaires', 'agriculture'] },
  { id: 'vcc', nom: 'Vancouver Community College (VCC)', ville: 'Vancouver', province: 'BC', type: 'college', website: 'vcc.ca', admissionsUrl: 'https://www.vcc.ca/admissions/', fraisSco: '10 000–15 000 $ CA', langues: ['en'], tags: ['arts culinaires', 'santé', 'commerce'] },

  // ── ALBERTA ──────────────────────────────────────────────────────────────
  { id: 'ualberta', nom: 'University of Alberta', ville: 'Edmonton', province: 'AB', type: 'universite', website: 'ualberta.ca', admissionsUrl: 'https://www.ualberta.ca/admissions/', fraisSco: '20 000–35 000 $ CA', langues: ['en'], tags: ['pharmacie', 'génie', 'médecine', 'pétrole'] },
  { id: 'ucalgary', nom: 'University of Calgary', ville: 'Calgary', province: 'AB', type: 'universite', website: 'ucalgary.ca', admissionsUrl: 'https://www.ucalgary.ca/future-students/', fraisSco: '20 000–33 000 $ CA', langues: ['en'], tags: ['génie', 'médecine', 'droit', 'énergie'] },
  { id: 'uleth', nom: 'University of Lethbridge', ville: 'Lethbridge', province: 'AB', type: 'universite', website: 'uleth.ca', admissionsUrl: 'https://www.uleth.ca/admissions/', fraisSco: '14 000–22 000 $ CA', langues: ['en'], tags: ['sciences', 'arts', 'gestion'] },
  { id: 'macewan', nom: 'MacEwan University', ville: 'Edmonton', province: 'AB', type: 'universite', website: 'macewan.ca', admissionsUrl: 'https://www.macewan.ca/academics/apply/', fraisSco: '15 000–22 000 $ CA', langues: ['en'], tags: ['arts', 'sciences', 'affaires'] },
  { id: 'nait', nom: 'NAIT — Northern Alberta Inst. of Technology', ville: 'Edmonton', province: 'AB', type: 'technique', website: 'nait.ca', admissionsUrl: 'https://www.nait.ca/nait/admissions/', fraisSco: '12 000–18 000 $ CA', langues: ['en'], tags: ['technologie', 'pétrole', 'génie'] },
  { id: 'sait', nom: 'SAIT — Southern Alberta Inst. of Technology', ville: 'Calgary', province: 'AB', type: 'technique', website: 'sait.ca', admissionsUrl: 'https://www.sait.ca/admissions/', fraisSco: '12 000–18 000 $ CA', langues: ['en'], tags: ['technologie', 'aérospatiale', 'hôtellerie'] },

  // ── MANITOBA ─────────────────────────────────────────────────────────────
  { id: 'umanitoba', nom: 'University of Manitoba', ville: 'Winnipeg', province: 'MB', type: 'universite', website: 'umanitoba.ca', admissionsUrl: 'https://umanitoba.ca/admissions/', fraisSco: '14 000–22 000 $ CA', langues: ['en'], tags: ['médecine', 'agriculture', 'génie'] },
  { id: 'redrivercollege', nom: 'Red River College Polytechnic', ville: 'Winnipeg', province: 'MB', type: 'college', website: 'rrc.ca', admissionsUrl: 'https://www.rrc.ca/future-students/', fraisSco: '9 000–15 000 $ CA', langues: ['en'], tags: ['technologie', 'design', 'santé'] },

  // ── SASKATCHEWAN ─────────────────────────────────────────────────────────
  { id: 'usask', nom: 'University of Saskatchewan', ville: 'Saskatoon', province: 'SK', type: 'universite', website: 'usask.ca', admissionsUrl: 'https://admissions.usask.ca/', fraisSco: '15 000–24 000 $ CA', langues: ['en'], tags: ['agriculture', 'médecine vétérinaire', 'pharmacie'] },

  // ── NOUVELLE-ÉCOSSE ───────────────────────────────────────────────────────
  { id: 'dal', nom: 'Dalhousie University', ville: 'Halifax', province: 'NS', type: 'universite', website: 'dal.ca', admissionsUrl: 'https://www.dal.ca/admissions.html', fraisSco: '18 000–28 000 $ CA', langues: ['en'], tags: ['droit', 'médecine', 'océanographie'] },
  { id: 'smu', nom: "Saint Mary's University", ville: 'Halifax', province: 'NS', type: 'universite', website: 'smu.ca', admissionsUrl: 'https://www.smu.ca/academics/admissions.html', fraisSco: '14 000–20 000 $ CA', langues: ['en'], tags: ['commerce', 'criminologie', 'sciences'] },

  // ── NOUVEAU-BRUNSWICK ─────────────────────────────────────────────────────
  { id: 'unb', nom: 'University of New Brunswick', ville: 'Fredericton', province: 'NB', type: 'universite', website: 'unb.ca', admissionsUrl: 'https://www.unb.ca/admissions/', fraisSco: '15 000–22 000 $ CA', langues: ['en'], tags: ['génie', 'droit', 'informatique'] },
  { id: 'umoncton', nom: 'Université de Moncton', ville: 'Moncton', province: 'NB', type: 'universite', website: 'umoncton.ca', admissionsUrl: 'https://www.umoncton.ca/admission/', fraisSco: '8 000–15 000 $ CA', langues: ['fr'], tags: ['droit', 'sciences', 'administration'] },

  // ── TERRE-NEUVE ───────────────────────────────────────────────────────────
  { id: 'mun', nom: 'Memorial University of Newfoundland', ville: 'St. John\'s', province: 'NL', type: 'universite', website: 'mun.ca', admissionsUrl: 'https://www.mun.ca/applying/', fraisSco: '11 000–20 000 $ CA', langues: ['en'], tags: ['génie offshore', 'médecine', 'folklore'] },

  // ── ÎLE-DU-PRINCE-ÉDOUARD ────────────────────────────────────────────────
  { id: 'upei', nom: 'University of Prince Edward Island (UPEI)', ville: 'Charlottetown', province: 'PE', type: 'universite', website: 'upei.ca', admissionsUrl: 'https://www.upei.ca/admissions', fraisSco: '12 000–20 000 $ CA', langues: ['en'], tags: ['médecine vétérinaire', 'sciences', 'commerce'] },
];

// ---------------------------------------------------------------------------
// Fonctions de recherche
// ---------------------------------------------------------------------------

export interface DLISearchParams {
  query?: string;
  province?: ProvinceCode | null;
  type?: DLIType | null;
}

export function searchDLI({ query, province, type }: DLISearchParams): DLIInstitution[] {
  const q = query?.toLowerCase().trim() ?? '';
  return DLI_INSTITUTIONS.filter(inst => {
    if (province && inst.province !== province) return false;
    if (type && inst.type !== type) return false;
    if (!q) return true;
    return (
      inst.nom.toLowerCase().includes(q) ||
      inst.ville.toLowerCase().includes(q) ||
      inst.website.toLowerCase().includes(q) ||
      inst.tags?.some(t => t.toLowerCase().includes(q))
    );
  });
}

export function getDLIById(id: string): DLIInstitution | undefined {
  return DLI_INSTITUTIONS.find(i => i.id === id);
}

// ---------------------------------------------------------------------------
// Pays → liens dynamiques (biométrie / médecin désigné)
// ---------------------------------------------------------------------------

// ISO 3166-1 alpha-2 → code VFS Global alpha-3
const VFS_MAP: Record<string, string> = {
  // Afrique du Nord
  MA: 'mar', DZ: 'dza', TN: 'tun', EG: 'egy', LY: 'lby',
  // Afrique subsaharienne
  SN: 'sen', CM: 'cmr', CI: 'civ', CD: 'cod', CG: 'cog', GN: 'gin',
  ML: 'mli', BF: 'bfa', NE: 'ner', TD: 'tcd', GA: 'gab', TG: 'tgo',
  BJ: 'ben', MG: 'mdg', MU: 'mus', NG: 'nga', GH: 'gha', ET: 'eth',
  KE: 'ken', RW: 'rwa', TZ: 'tza', UG: 'uga',
  // Europe
  FR: 'fra', BE: 'bel', CH: 'che', DE: 'deu', ES: 'esp', IT: 'ita',
  PT: 'prt', NL: 'nld', RO: 'rou', UA: 'ukr', PL: 'pol', CZ: 'cze',
  GR: 'grc', RS: 'srb', TR: 'tur',
  // Amériques
  HT: 'hti', MX: 'mex', BR: 'bra', CO: 'col', PE: 'per', VE: 'ven',
  CL: 'chl', AR: 'arg', DO: 'dom', CU: 'cub', JM: 'jam', EC: 'ecu',
  // Asie
  CN: 'chn', IN: 'ind', PK: 'pak', BD: 'bgd', PH: 'phl', VN: 'vnm',
  KR: 'kor', JP: 'jpn', LK: 'lka', NP: 'npl', TH: 'tha', ID: 'idn',
  MM: 'mmr', KH: 'khm',
  // Moyen-Orient
  LB: 'lbn', SY: 'syr', IQ: 'irq', IR: 'irn', JO: 'jor',
  SA: 'sau', AE: 'are', KW: 'kwt', QA: 'qat',
};

/**
 * Retourne l'URL VFS Global pour prendre rendez-vous biométrique selon le pays.
 * Fallback vers la page IRCC générique.
 */
export function getBiometrieUrl(paysCode2?: string): string {
  if (!paysCode2) {
    return 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html';
  }
  const code3 = VFS_MAP[paysCode2.toUpperCase()];
  if (code3) {
    return `https://visa.vfsglobal.com/${code3}/en/can/apply-visa`;
  }
  return 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html';
}

/**
 * Retourne l'URL DMP IRCC avec pré-filtre par pays pour trouver un médecin désigné.
 */
export function getMedecinDesigneUrl(paysCode2?: string): string {
  if (paysCode2) {
    return `https://dmp.ircc.ca/?country=${paysCode2.toUpperCase()}&lang=fra`;
  }
  return 'https://dmp.ircc.ca/?lang=fra';
}

/**
 * Retourne un label de pays en français depuis le code ISO2.
 */
const PAYS_LABELS: Record<string, string> = {
  MA: 'Maroc', DZ: 'Algérie', TN: 'Tunisie', FR: 'France', BE: 'Belgique',
  SN: 'Sénégal', CM: 'Cameroun', CI: 'Côte d\'Ivoire', CD: 'R.D. Congo',
  HT: 'Haïti', MX: 'Mexique', BR: 'Brésil', CO: 'Colombie', NG: 'Nigeria',
  GH: 'Ghana', IN: 'Inde', CN: 'Chine', PH: 'Philippines', LB: 'Liban',
  EG: 'Égypte', PK: 'Pakistan', TH: 'Thaïlande', VN: 'Vietnam', KE: 'Kenya',
};
export function getPaysLabel(paysCode2?: string): string {
  if (!paysCode2) return 'votre pays';
  return PAYS_LABELS[paysCode2.toUpperCase()] ?? paysCode2.toUpperCase();
}
