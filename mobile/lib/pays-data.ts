/**
 * Base de données des pays — centres biométriques (CRDV).
 *
 * Source officielle IRCC :
 * https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/biometrie/ou.html
 *
 * ATTENTION : Vérifiez toujours sur le site IRCC avant de vous déplacer.
 * Les centres VFS Global peuvent changer sans préavis.
 * Frais biométrie : 85 $ CAD / personne (2024-2025, source IRCC).
 * Frais visa visiteur : 100 $ CAD / personne (source IRCC).
 */

export type RegionCode =
  | 'afrique'
  | 'europe'
  | 'moyen_orient'
  | 'asie'
  | 'ameriques'
  | 'autre';

export interface PaysInfo {
  /** Nom complet en français */
  nom: string;
  /** Code ISO 3166-1 alpha-2 */
  code: string;
  /** Région pour estimation de billet d'avion */
  region: RegionCode;
  /**
   * Ville ou centre de collecte biométrique le plus proche.
   * Format: "Ville (prestataire)" ou "Ville — pays tiers si pas de centre local"
   */
  crdv: string;
  /**
   * true = la localisation du centre est incertaine ou susceptible de changer.
   * L'UI affichera un avertissement de vérification sur IRCC.
   */
  crdvIncertain?: boolean;
  /**
   * true = pays figurant sur la liste IRCC des « pays désignés »
   * où un examen médical peut être exigé même pour les courts séjours.
   */
  examMedicalRisque: boolean;
  /** Frais de visa visiteur standard IRCC (en CAD, par personne) */
  fraisVisa: number;
  /** Frais biométrie IRCC (en CAD, par personne) */
  fraisBiometrie: number;
  /** Note spéciale (ETA, dispense biométrie…) */
  note?: string;
}

export const PAYS_DATA: PaysInfo[] = [
  // ── AFRIQUE ──────────────────────────────────────────────────────────────
  { nom: 'Algérie', code: 'DZ', region: 'afrique', crdv: 'Alger (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Maroc', code: 'MA', region: 'afrique', crdv: 'Casablanca ou Rabat (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Tunisie', code: 'TN', region: 'afrique', crdv: 'Tunis (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Sénégal', code: 'SN', region: 'afrique', crdv: 'Dakar (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Côte d\'Ivoire', code: 'CI', region: 'afrique', crdv: 'Abidjan (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Cameroun', code: 'CM', region: 'afrique', crdv: 'Yaoundé ou Douala (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Congo (RDC)', code: 'CD', region: 'afrique', crdv: 'Kinshasa (VFS Global)', examMedicalRisque: true, fraisVisa: 100, fraisBiometrie: 85, note: 'Examen médical très souvent requis' },
  { nom: 'Mali', code: 'ML', region: 'afrique', crdv: 'Bamako (VFS Global)', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Vérifiez la disponibilité du centre sur canada.ca' },
  /* Guinée : pas de centre VFS confirmé — le plus proche est Dakar ou Abidjan */
  { nom: 'Guinée', code: 'GN', region: 'afrique', crdv: 'Dakar (Sénégal) ou Abidjan — aucun centre à Conakry', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Aucun centre VFS à Conakry confirmé. Vérifiez sur canada.ca' },
  /* Gabon : pas de centre — le plus proche est Yaoundé ou Douala */
  { nom: 'Gabon', code: 'GA', region: 'afrique', crdv: 'Yaoundé ou Douala (VFS Global — Cameroun)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Aucun centre au Gabon — déplacement au Cameroun requis' },
  /* Madagascar : incertain — certains utilisateurs rapportent un centre VFS */
  { nom: 'Madagascar', code: 'MG', region: 'afrique', crdv: 'Antananarivo (VFS Global)', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Vérifiez la disponibilité sur canada.ca' },
  { nom: 'Ghana', code: 'GH', region: 'afrique', crdv: 'Accra (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Nigeria', code: 'NG', region: 'afrique', crdv: 'Lagos ou Abuja (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Kenya', code: 'KE', region: 'afrique', crdv: 'Nairobi (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Éthiopie', code: 'ET', region: 'afrique', crdv: 'Addis-Abéba (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Égypte', code: 'EG', region: 'afrique', crdv: 'Le Caire (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  /* Togo : incertain — Abidjan ou Accra sont les alternatives connues */
  { nom: 'Togo', code: 'TG', region: 'afrique', crdv: 'Lomé (VFS Global) ou Abidjan', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Vérifiez sur canada.ca — centre Lomé non confirmé officiellement' },
  /* Bénin : pas de centre confirmé — Lagos ou Abidjan sont les plus proches */
  { nom: 'Bénin', code: 'BJ', region: 'afrique', crdv: 'Lagos (Nigeria) ou Abidjan — aucun centre à Cotonou', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Aucun centre VFS à Cotonou confirmé. Vérifiez sur canada.ca' },
  /* Burkina Faso : incertain depuis fermetures 2022-2024 */
  { nom: 'Burkina Faso', code: 'BF', region: 'afrique', crdv: 'Abidjan ou Bamako — centre Ouagadougou fermé', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Centre Ouagadougou fermé depuis 2022. Vérifiez sur canada.ca' },
  /* Niger : pas de centre confirmé */
  { nom: 'Niger', code: 'NE', region: 'afrique', crdv: 'Bamako (Mali) ou Abidjan — aucun centre à Niamey', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Aucun centre VFS à Niamey. Vérifiez sur canada.ca' },
  { nom: 'Tanzanie', code: 'TZ', region: 'afrique', crdv: 'Dar es Salaam (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Rwanda', code: 'RW', region: 'afrique', crdv: 'Kigali (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Mozambique', code: 'MZ', region: 'afrique', crdv: 'Maputo (VFS Global)', crdvIncertain: true, examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Vérifiez la disponibilité sur canada.ca' },
  { nom: 'Afrique du Sud', code: 'ZA', region: 'afrique', crdv: 'Johannesburg ou Le Cap (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  // ── EUROPE ───────────────────────────────────────────────────────────────
  { nom: 'France', code: 'FR', region: 'europe', crdv: 'Paris (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Belgique', code: 'BE', region: 'europe', crdv: 'Bruxelles (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Suisse', code: 'CH', region: 'europe', crdv: 'Berne ou Genève (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Allemagne', code: 'DE', region: 'europe', crdv: 'Berlin ou Munich (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Espagne', code: 'ES', region: 'europe', crdv: 'Madrid ou Barcelone (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Portugal', code: 'PT', region: 'europe', crdv: 'Lisbonne (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Italie', code: 'IT', region: 'europe', crdv: 'Rome ou Milan (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Roumanie', code: 'RO', region: 'europe', crdv: 'Bucarest (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Pologne', code: 'PL', region: 'europe', crdv: 'Varsovie (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Ukraine', code: 'UA', region: 'europe', crdv: 'Kiev (VFS Global) — Vérifiez disponibilité', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Certains centres temporairement limités' },
  { nom: 'Russie', code: 'RU', region: 'europe', crdv: 'Moscou ou Saint-Pétersbourg (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Serbie', code: 'RS', region: 'europe', crdv: 'Belgrade (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Croatie', code: 'HR', region: 'europe', crdv: 'Zagreb (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Grèce', code: 'GR', region: 'europe', crdv: 'Athènes (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Pays-Bas', code: 'NL', region: 'europe', crdv: 'Amsterdam (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Suède', code: 'SE', region: 'europe', crdv: 'Stockholm (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Norvège', code: 'NO', region: 'europe', crdv: 'Oslo (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Danemark', code: 'DK', region: 'europe', crdv: 'Copenhague (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Finlande', code: 'FI', region: 'europe', crdv: 'Helsinki (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Autriche', code: 'AT', region: 'europe', crdv: 'Vienne (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Hongrie', code: 'HU', region: 'europe', crdv: 'Budapest (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Bulgarie', code: 'BG', region: 'europe', crdv: 'Sofia (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  // ── MOYEN-ORIENT ─────────────────────────────────────────────────────────
  { nom: 'Liban', code: 'LB', region: 'moyen_orient', crdv: 'Beyrouth (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Syrie', code: 'SY', region: 'moyen_orient', crdv: 'Beyrouth ou Amman (VFS Global) — déplacés', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Dossier soumis depuis le pays de résidence' },
  { nom: 'Jordanie', code: 'JO', region: 'moyen_orient', crdv: 'Amman (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Turquie', code: 'TR', region: 'moyen_orient', crdv: 'Istanbul ou Ankara (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Iran', code: 'IR', region: 'moyen_orient', crdv: 'Téhéran (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Irak', code: 'IQ', region: 'moyen_orient', crdv: 'Bagdad ou Erbil (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Arabie Saoudite', code: 'SA', region: 'moyen_orient', crdv: 'Riyad ou Djeddah (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Émirats arabes unis', code: 'AE', region: 'moyen_orient', crdv: 'Dubaï ou Abu Dhabi (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Qatar', code: 'QA', region: 'moyen_orient', crdv: 'Doha (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Koweït', code: 'KW', region: 'moyen_orient', crdv: 'Koweït (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Bahreïn', code: 'BH', region: 'moyen_orient', crdv: 'Manama (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Oman', code: 'OM', region: 'moyen_orient', crdv: 'Mascate (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Yémen', code: 'YE', region: 'moyen_orient', crdv: 'Amman (VFS Global) — dépôt à distance', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Dossier traité via Amman' },
  { nom: 'Afghanistan', code: 'AF', region: 'moyen_orient', crdv: 'Islamabad ou Dubaï (VFS Global)', examMedicalRisque: true, fraisVisa: 100, fraisBiometrie: 85, note: 'Examen médical fréquemment requis' },
  // ── ASIE ─────────────────────────────────────────────────────────────────
  { nom: 'Inde', code: 'IN', region: 'asie', crdv: 'New Delhi, Mumbai, Chennai ou Chandigarh (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Pakistan', code: 'PK', region: 'asie', crdv: 'Islamabad ou Karachi (VFS Global)', examMedicalRisque: true, fraisVisa: 100, fraisBiometrie: 85, note: 'Examen médical souvent requis' },
  { nom: 'Bangladesh', code: 'BD', region: 'asie', crdv: 'Dhaka (VFS Global)', examMedicalRisque: true, fraisVisa: 100, fraisBiometrie: 85, note: 'Examen médical souvent requis' },
  { nom: 'Sri Lanka', code: 'LK', region: 'asie', crdv: 'Colombo (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Népal', code: 'NP', region: 'asie', crdv: 'Katmandou (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Chine', code: 'CN', region: 'asie', crdv: 'Pékin, Shanghai ou Guangzhou (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Japon', code: 'JP', region: 'asie', crdv: 'Tokyo (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Ressortissants japonais dispensés de visa — ATE requis' },
  { nom: 'Corée du Sud', code: 'KR', region: 'asie', crdv: 'Séoul (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Dispense de visa — ATE requis' },
  { nom: 'Philippines', code: 'PH', region: 'asie', crdv: 'Manille (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Indonésie', code: 'ID', region: 'asie', crdv: 'Jakarta (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Vietnam', code: 'VN', region: 'asie', crdv: 'Hanoi ou Ho Chi Minh Ville (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Thaïlande', code: 'TH', region: 'asie', crdv: 'Bangkok (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Malaisie', code: 'MY', region: 'asie', crdv: 'Kuala Lumpur (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Myanmar', code: 'MM', region: 'asie', crdv: 'Yangon (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Cambodge', code: 'KH', region: 'asie', crdv: 'Phnom Penh (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Kazakhstan', code: 'KZ', region: 'asie', crdv: 'Almaty ou Astana (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Ouzbékistan', code: 'UZ', region: 'asie', crdv: 'Tachkent (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  // ── AMÉRIQUES ────────────────────────────────────────────────────────────
  { nom: 'Haïti', code: 'HT', region: 'ameriques', crdv: 'Port-au-Prince (VFS Global)', examMedicalRisque: true, fraisVisa: 100, fraisBiometrie: 85, note: 'Examen médical fréquemment requis' },
  { nom: 'Mexique', code: 'MX', region: 'ameriques', crdv: 'Mexico (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Colombie', code: 'CO', region: 'ameriques', crdv: 'Bogotá (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Brésil', code: 'BR', region: 'ameriques', crdv: 'São Paulo ou Brasília (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Argentine', code: 'AR', region: 'ameriques', crdv: 'Buenos Aires (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Pérou', code: 'PE', region: 'ameriques', crdv: 'Lima (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Venezuela', code: 'VE', region: 'ameriques', crdv: 'Bogotá ou Lima (VFS Global) — attention', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Certains centres à l\'international selon situation' },
  { nom: 'Équateur', code: 'EC', region: 'ameriques', crdv: 'Quito (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Chili', code: 'CL', region: 'ameriques', crdv: 'Santiago (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Cuba', code: 'CU', region: 'ameriques', crdv: 'La Havane (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'République dominicaine', code: 'DO', region: 'ameriques', crdv: 'Saint-Domingue (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Jamaïque', code: 'JM', region: 'ameriques', crdv: 'Kingston (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Guatemala', code: 'GT', region: 'ameriques', crdv: 'Guatemala Ciudad (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'Honduras', code: 'HN', region: 'ameriques', crdv: 'Tegucigalpa (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  { nom: 'El Salvador', code: 'SV', region: 'ameriques', crdv: 'San Salvador (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85 },
  // ── AUTRE / OCÉANIE ──────────────────────────────────────────────────────
  { nom: 'Australie', code: 'AU', region: 'autre', crdv: 'Sydney ou Melbourne (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Dispense de visa — ATE requis' },
  { nom: 'Nouvelle-Zélande', code: 'NZ', region: 'autre', crdv: 'Auckland (VFS Global)', examMedicalRisque: false, fraisVisa: 100, fraisBiometrie: 85, note: 'Dispense de visa — ATE requis' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Filtre la liste par nom (insensible à la casse, accents inclus).
 */
export function searchPays(query: string): PaysInfo[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  return PAYS_DATA.filter(p => normalize(p.nom).includes(q)).slice(0, 12);
}

/**
 * Cherche un pays par code ISO.
 */
export function getPaysParCode(code: string): PaysInfo | undefined {
  return PAYS_DATA.find(p => p.code === code);
}

/**
 * Normalisation pour comparaison insensible aux accents.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
