import { GraduationCap, Briefcase, Home } from 'lucide-react';

// --- Constants & Helpers ---

export const CITIES_COORDS: Record<string, { lat: number, lng: number }> = {
  "Montréal": { lat: 45.5017, lng: -73.5673 },
  "Québec": { lat: 46.8139, lng: -71.2080 },
  "Sherbrooke": { lat: 45.4010, lng: -71.8824 },
  "Gatineau": { lat: 45.4765, lng: -75.7013 },
  "Trois-Rivières": { lat: 46.3427, lng: -72.5425 },
  "Laval": { lat: 45.5758, lng: -73.7531 },
  "Longueuil": { lat: 45.5369, lng: -73.5105 },
  "Lévis": { lat: 46.8033, lng: -71.1779 },
  "Saguenay": { lat: 48.4200, lng: -71.0700 },
  "Brossard": { lat: 45.4667, lng: -73.4500 },
  "Toronto": { lat: 43.6532, lng: -79.3832 },
  "Ottawa": { lat: 45.4215, lng: -75.6972 },
  "Vancouver": { lat: 49.2827, lng: -123.1207 },
  "Calgary": { lat: 51.0447, lng: -114.0719 },
  "Edmonton": { lat: 53.5461, lng: -113.4938 },
  "Halifax": { lat: 44.6488, lng: -63.5752 },
  "Winnipeg": { lat: 49.8951, lng: -97.1384 }
};

// Helper to get random coord with jitter around a city
const getCoords = (cityName: string) => {
  // Extract city name from "City, Province" string if needed
  const cleanName = cityName.split(',')[0].trim();
  const center = CITIES_COORDS[cleanName] || CITIES_COORDS["Montréal"]; // Fallback
  
  // Add random jitter (~1-3km radius)
  const jitter = 0.03; 
  return {
    lat: center.lat + (Math.random() - 0.5) * jitter,
    lng: center.lng + (Math.random() - 0.5) * jitter
  };
};

// --- Education Data ---

const EDU_PROGRAMS = ["Informatique", "Génie Civil", "Design de Mode", "Soins Infirmiers", "Droit", "Comptabilité", "Marketing", "Psychologie", "Biologie", "Arts Visuels"];
const EDU_INSTITUTIONS = [
  { name: "Université Laval", url: "https://www.ulaval.ca/admission", logo: "https://logo.clearbit.com/ulaval.ca", domain: "ulaval.ca", programDir: "https://www.ulaval.ca/etudes/programmes" },
  { name: "Université de Montréal", url: "https://admission.umontreal.ca/", logo: "https://logo.clearbit.com/umontreal.ca", domain: "umontreal.ca", programDir: "https://admission.umontreal.ca/programmes/" },
  { name: "McGill University", url: "https://www.mcgill.ca/applying/", logo: "https://logo.clearbit.com/mcgill.ca", domain: "mcgill.ca", programDir: "https://www.mcgill.ca/undergraduate-admissions/programs" },
  { name: "Concordia University", url: "https://www.concordia.ca/admissions.html", logo: "https://logo.clearbit.com/concordia.ca", domain: "concordia.ca", programDir: "https://www.concordia.ca/academics.html" },
  { name: "Cégep de Sainte-Foy", url: "https://www.csfoy.ca/admissions/", logo: "https://logo.clearbit.com/csfoy.ca", domain: "csfoy.ca", programDir: "https://www.csfoy.ca/programmes/" },
  { name: "Collège LaSalle", url: "https://www.collegelasalle.com/admissions", logo: "https://logo.clearbit.com/collegelasalle.com", domain: "collegelasalle.com", programDir: "https://www.collegelasalle.com/programmes" },
  { name: "UQAM", url: "https://etudier.uqam.ca/", logo: "https://logo.clearbit.com/uqam.ca", domain: "uqam.ca", programDir: "https://etudier.uqam.ca/programmes" },
  { name: "ETS", url: "https://www.etsmtl.ca/etudes/comment-faire-demande-admission", logo: "https://logo.clearbit.com/etsmtl.ca", domain: "etsmtl.ca", programDir: "https://www.etsmtl.ca/etudes" },
  { name: "Polytechnique Montréal", url: "https://www.polymtl.ca/admission/", logo: "https://logo.clearbit.com/polymtl.ca", domain: "polymtl.ca", programDir: "https://www.polymtl.ca/programmes/" }
];
const EDU_LOCATIONS = [
  { city: "Montréal", province: "QC" },
  { city: "Québec", province: "QC" },
  { city: "Sherbrooke", province: "QC" },
  { city: "Gatineau", province: "QC" },
  { city: "Trois-Rivières", province: "QC" },
  { city: "Toronto", province: "ON" },
  { city: "Ottawa", province: "ON" },
  { city: "Vancouver", province: "BC" },
  { city: "Calgary", province: "AB" },
  { city: "Edmonton", province: "AB" },
  { city: "Halifax", province: "NS" },
  { city: "Winnipeg", province: "MB" }
];

const PROGRAM_IMAGES: Record<string, string> = {
  "Informatique": "coding",
  "Génie Civil": "construction",
  "Design de Mode": "fashion",
  "Soins Infirmiers": "nurse",
  "Droit": "law",
  "Comptabilité": "accounting",
  "Marketing": "meeting",
  "Psychologie": "psychology",
  "Biologie": "lab",
  "Arts Visuels": "art"
};

export const ALL_SCHOOLS = Array.from({ length: 542 }, (_, i) => {
  const institution = EDU_INSTITUTIONS[Math.floor(Math.random() * EDU_INSTITUTIONS.length)];
  const loc = EDU_LOCATIONS[Math.floor(Math.random() * EDU_LOCATIONS.length)];
  const program = EDU_PROGRAMS[Math.floor(Math.random() * EDU_PROGRAMS.length)];
  
  let type = "Université";
  if (institution.name.includes("Cégep")) type = "Cégep";
  if (institution.name.includes("Collège")) type = "Collège";
  if (institution.name.includes("ETS") || institution.name.includes("Polytechnique")) type = "Université";

  const coords = getCoords(loc.city);

  return {
    id: i + 1,
    name: institution.name,
    url: institution.url,
    logo: institution.logo,
    programDir: institution.programDir,
    program: program,
    location: `${loc.city}, ${loc.province}`,
    city: loc.city,
    province: loc.province,
    tuition: `${Math.floor(Math.random() * 15 + 10)},000 CAD/an`,
    type: type,
    lat: coords.lat,
    lng: coords.lng,
    img: PROGRAM_IMAGES[program] || "campus",
    category: 'education' as const
  };
});

// --- Job Data ---

const JOB_TITLES = [
  "Développeur Full Stack", "Infirmier(ère)", "Soudeur", "Comptable", "Camionneur", 
  "Enseignant", "Électricien", "Mécanicien", "Préposé aux bénéficiaires", "Analyste de données",
  "Gérant de projet", "Cuisinier", "Serveur", "Architecte", "Ingénieur Civil"
];
const JOB_COMPANIES = [
  "TechMontreal", "Santé Québec", "Construction Nord", "Transport Robert", "Banque Nationale", 
  "Hydro-Québec", "CGI", "Desjardins", "Shopify", "Ville de Montréal", "CHUM", "Bombardier"
];
const JOB_LOCATIONS = [
  "Montréal, QC", "Québec, QC", "Laval, QC", "Gatineau, QC", "Sherbrooke, QC", 
  "Trois-Rivières, QC", "Lévis, QC", "Saguenay, QC"
];

export const ALL_JOBS = Array.from({ length: 1245 }, (_, i) => {
  const loc = JOB_LOCATIONS[Math.floor(Math.random() * JOB_LOCATIONS.length)];
  const coords = getCoords(loc);

  return {
    id: i + 1,
    title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
    company: JOB_COMPANIES[Math.floor(Math.random() * JOB_COMPANIES.length)],
    location: loc,
    salary: `${Math.floor(Math.random() * 60 + 40)}k - ${Math.floor(Math.random() * 40 + 100)}k`,
    type: Math.random() > 0.3 ? "Temps plein" : "Contrat",
    posted: `Il y a ${Math.floor(Math.random() * 14)} jours`,
    lat: coords.lat,
    lng: coords.lng,
    category: 'job' as const
  };
});

// --- Housing Data ---

const HOUSING_TYPES = ["Appartement", "Condo", "Maison", "Studio", "Colocation", "Loft"];
const HOUSING_LOCATIONS = ["Montréal", "Québec", "Laval", "Gatineau", "Sherbrooke", "Trois-Rivières", "Longueuil", "Brossard"];

const HOUSING_IMAGES: Record<string, string> = {
  "Appartement": "apartment",
  "Condo": "condo",
  "Maison": "house",
  "Studio": "studio",
  "Colocation": "room",
  "Loft": "loft"
};

export const ALL_HOUSING = Array.from({ length: 842 }, (_, i) => {
  const type = HOUSING_TYPES[Math.floor(Math.random() * HOUSING_TYPES.length)];
  const beds = type === 'Studio' ? 0 : Math.floor(Math.random() * 4) + 1;
  const city = HOUSING_LOCATIONS[Math.floor(Math.random() * HOUSING_LOCATIONS.length)];
  const coords = getCoords(city);

  return {
    id: i + 1,
    title: `${type} ${beds > 0 ? `${beds + 2} ½` : ''} ${Math.random() > 0.5 ? 'rénové' : 'lumineux'}`,
    location: `${city}, QC`,
    price: Math.floor(Math.random() * 1500 + 600),
    type,
    beds,
    img: HOUSING_IMAGES[type] || "apartment",
    lat: coords.lat,
    lng: coords.lng,
    category: 'housing' as const
  };
});
