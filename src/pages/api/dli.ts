export const prerender = false;

// ─────────────────────────────────────────────────────────────────────────────
// /api/dli — Proxy + parser de la liste DLI officielle IRCC (canada.ca)
// ─────────────────────────────────────────────────────────────────────────────
// Retourne un tableau JSON de tous les établissements désignés.
// Cache côté client recommandé : 24 h.
// Sources tentées dans l'ordre :
//   1. canada.ca HTML scraper (table wet-boew)
//   2. open.canada.ca CKAN API
//   3. dataset embarqué de secours (~150 établissements)

import type { APIRoute } from 'astro';

// ── Mapping nom province (FR/EN) → code ────────────────────────────────────

const PROV_MAP: Record<string, string> = {
  'alberta': 'AB',
  'colombie-britannique': 'BC', 'british columbia': 'BC',
  'manitoba': 'MB',
  'nouveau-brunswick': 'NB', 'new brunswick': 'NB',
  "terre-neuve-et-labrador": 'NL', 'newfoundland and labrador': 'NL', 'newfoundland': 'NL',
  "territoires du nord-ouest": 'NT', 'northwest territories': 'NT',
  "nouvelle-écosse": 'NS', 'nova scotia': 'NS',
  'nunavut': 'NU',
  'ontario': 'ON',
  "île-du-prince-édouard": 'PE', 'prince edward island': 'PE',
  'québec': 'QC', 'quebec': 'QC',
  'saskatchewan': 'SK',
  'yukon': 'YT',
};

function toProvinceCode(raw: string): string {
  const clean = raw.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Chercher dans la map
  for (const [key, val] of Object.entries(PROV_MAP)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normKey === clean || clean.includes(normKey)) return val;
  }
  return raw.trim().slice(0, 2).toUpperCase();
}

// ── Mapping type établissement ───────────────────────────────────────────────

function toType(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('univer') || s.includes('college universitaire')) return 'universite';
  if (s.includes('cégep') || s.includes('cegep')) return 'cegep';
  if (s.includes('langue') || s.includes('language')) return 'ecole_langue';
  if (s.includes('technique') || s.includes('polytechni') || s.includes('technology')) return 'technique';
  if (s.includes('coll') || s.includes('vocational') || s.includes('career')) return 'college';
  return 'college';
}

// ── Nettoyage HTML ────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à').replace(/&ecirc;/g, 'ê').replace(/&ugrave;/g, 'ù')
    .replace(/&ccedil;/g, 'ç').replace(/&ocirc;/g, 'ô').replace(/&ucirc;/g, 'û')
    .replace(/&iuml;/g, 'ï').replace(/&euml;/g, 'ë').replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü').replace(/&Eacute;/g, 'É')
    .replace(/\s+/g, ' ').trim();
}

// ── Parser HTML canada.ca (table wet-boew) ──────────────────────────────────

interface RawDLI {
  nom: string;
  ville: string;
  province: string;
  type: string;
  dliNumber?: string;
}

function parseCanadaCATable(html: string): RawDLI[] {
  const results: RawDLI[] = [];

  // Extraire le contenu du <tbody>
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const tbody = tbodyMatch[1];

  // Chaque ligne <tr>
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tbody)) !== null) {
    const rowHtml = rowMatch[1];
    // Extraire les <td>
    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(stripHtml(cellMatch[1]));
    }

    if (cells.length >= 3) {
      // Deux formats possibles dans le tableau canada.ca :
      // Format A : [Province, Ville, Nom, DLI#, Type]
      // Format B : [Nom, Province, Ville, Type, DLI#]

      // On détecte en regardant si la 1ère cellule ressemble à une province
      const firstIsProvince = Object.keys(PROV_MAP).some(k =>
        cells[0].toLowerCase().includes(k.replace(/[\u0300-\u036f]/g, ''))
      );

      let entry: RawDLI;
      if (firstIsProvince && cells.length >= 4) {
        entry = {
          province: cells[0],
          ville: cells[1],
          nom: cells[2],
          dliNumber: cells[3] || '',
          type: cells[4] || 'Collège',
        };
      } else {
        entry = {
          nom: cells[0],
          province: cells[1] || '',
          ville: cells[2] || '',
          type: cells[3] || 'Collège',
          dliNumber: cells[4] || '',
        };
      }

      if (entry.nom && entry.nom.length > 2) {
        results.push(entry);
      }
    }
  }

  return results;
}

// ── Enrichissement : URL admissions heuristique ──────────────────────────────

function guessAdmissionsUrl(nom: string, website?: string): string {
  if (website) {
    const base = website.replace(/\/$/, '');
    const n = nom.toLowerCase();
    if (n.includes('mcgill')) return `https://${base}/applying/`;
    if (n.includes('montréal') || n.includes('montreal') || n.includes('laval')) return `https://${base}/admission/`;
    if (n.includes('uqam') || n.includes('uqtr') || n.includes('uqac')) return `https://${base}/admissions`;
    if (n.includes('concordia')) return `https://${base}/admissions.html`;
    if (n.includes('toronto') || n.includes('uoft')) return `https://${base}/apply/`;
    return `https://${base}/admissions`;
  }
  return 'https://www.educanada.ca/schools-ecoles/index.aspx?lang=fra';
}

// ── Source 1 : Canada.ca DLI page via ScraperAPI (render=true) ───────────────
// La page canada.ca utilise wet-boew datatables (JavaScript obligatoire).
// render=true force ScraperAPI à exécuter le JS → tableau complet (~2000 lignes)

const SCRAPER_KEY = '624751bbf5ddc786bad6c4f31f50d41c';

async function fetchViaScraper(targetUrl: string, render = false): Promise<string> {
  const params = new URLSearchParams({
    api_key: SCRAPER_KEY,
    url: targetUrl,
    country_code: 'ca',
  });
  if (render) params.set('render', 'true');
  const scraperUrl = `https://api.scraperapi.com/?${params.toString()}`;
  const res = await fetch(scraperUrl, {
    headers: { 'Accept': 'text/html,application/json' },
    signal: AbortSignal.timeout(render ? 60000 : 20000),
  });
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status}`);
  return res.text();
}

// ── URLs officielles IRCC — liste des EED (Établissements d'enseignement désignés)
const DLI_URLS = [
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html',
  'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes/preparer/liste-etablissements-designes.html',
];

async function fetchFromCanadaCA(): Promise<RawDLI[]> {
  // Essai 1 : canada.ca DLI — render=true (wet-boew table nécessite JS)
  for (const url of DLI_URLS) {
    try {
      const html = await fetchViaScraper(url, true);
      const data = parseCanadaCATable(html);
      if (data.length > 100) return data;
    } catch { /* continuer */ }
  }

  // Essai 2 : canada.ca direct sans ScraperAPI (parfois accessible depuis Vercel Edge)
  for (const url of DLI_URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CAPI/1.0; +https://capituneweb.vercel.app)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr-CA,fr;q=0.9,en-CA;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const data = parseCanadaCATable(html);
      if (data.length > 100) return data;
    } catch { continue; }
  }

  // Essai 3 : render=false en dernier recours (peut retourner partial)
  for (const url of DLI_URLS) {
    try {
      const html = await fetchViaScraper(url, false);
      const data = parseCanadaCATable(html);
      if (data.length > 50) return data;
    } catch { /* silencieux */ }
  }

  return [];
}

// ── Source 2 : CSV officiel IRCC (aucun ScraperAPI nécessaire) ──────────────
// IRCC publie des fichiers TSV avec Province, DLI name, Type, données annuelles.
// On extrait les paires (Province, DLI) uniques → liste complète ~1400 établissements.
// Format : tab-separated, colonnes EN_DLI_PROVINCE_TERRITORY, EN_DESIGNATED_LEARNING_INSTITUTION, EN_ADMIN_TYPE

async function fetchFromOpenData(): Promise<RawDLI[]> {
  const IRCC_TSV_URLS = [
    // DLI name × Province × Institution Type (University/College/…) — meilleur typage
    'https://www.ircc.canada.ca/opendata-donneesouvertes/data/ODP-TR-Study-DLI_name_PT_Inst_type.csv',
    // DLI name × Province × Admin type (Public/Private) — couverture complémentaire
    'https://www.ircc.canada.ca/opendata-donneesouvertes/data/ODP-TR-Study-DLI_name_PT_Admin_type.csv',
  ];

  for (const tsvUrl of IRCC_TSV_URLS) {
    try {
      const res = await fetch(tsvUrl, {
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
          'User-Agent': 'Mozilla/5.0 (compatible; CAPI/1.0)',
        },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) continue;

      const text = await res.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 10) continue;

      // Header = première ligne, séparateur tabulation
      const header = lines[0].split('\t').map(h =>
        h.trim().replace(/\r/g, '').toLowerCase()
      );

      // Trouver les index des colonnes clés
      const provIdx = header.findIndex(h =>
        h === 'en_dli_province_territory' || h.includes('province')
      );
      const nameIdx = header.findIndex(h =>
        h === 'en_designated_learning_institution' ||
        h.includes('learning_institu') ||   // gère aussi le typo "instituion" dans le 2ème fichier
        h.includes('dli_name')
      );
      const typeIdx = header.findIndex(h =>
        h === 'en_admin_type' || h === 'en_institution_type' || h.includes('admin_type') || h.includes('inst_type')
      );

      if (provIdx < 0 || nameIdx < 0) continue;

      // Extraire paires uniques (nom, province)
      const seenKeys = new Set<string>();
      const results: RawDLI[] = [];

      for (const line of lines.slice(1)) {
        const cells = line.split('\t');
        if (!cells || cells.length <= Math.max(provIdx, nameIdx)) continue;

        const nom = cells[nameIdx]?.trim().replace(/\r/g, '') ?? '';
        const prov = cells[provIdx]?.trim().replace(/\r/g, '') ?? '';
        const rawType = typeIdx >= 0 ? (cells[typeIdx]?.trim().replace(/\r/g, '') ?? '') : '';
        if (nom.length < 3 || prov.length < 2) continue;

        const key = `${nom.toLowerCase().slice(0, 40)}|${prov.toLowerCase().slice(0, 10)}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        results.push({ nom, province: prov, ville: '', type: rawType });
      }

      if (results.length > 200) return results;
    } catch {
      continue;
    }
  }

  // Fallback : open.canada.ca CKAN API
  const RESOURCE_IDS = [
    'c62fcf26-dc4c-402c-aef4-cb1697f54d5a',
    '280db2d9-8b63-463c-8c60-d2d34a19c7f0',
  ];
  for (const rid of RESOURCE_IDS) {
    try {
      const url = `https://open.canada.ca/data/api/3/action/datastore_search?resource_id=${rid}&limit=3000`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) continue;
      const json = await res.json() as any;
      const records = json?.result?.records as any[] | undefined;
      if (records && records.length > 100) {
        return records.map((r: any) => ({
          nom: r['Institution Name'] || r["Nom de l'établissement"] || r.name || '',
          ville: r['City'] || r['Ville'] || '',
          province: r['Province'] || r['Province/Territory'] || '',
          type: r['Type'] || '',
          dliNumber: r['DLI number'] || r['Numéro DLI'] || '',
        }));
      }
    } catch { continue; }
  }
  return [];
}

// ── Fallback embarqué (150 institutions représentatives) ─────────────────────

const FALLBACK_RAW: RawDLI[] = [
  // Québec
  { nom: 'Université McGill', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'Université de Montréal', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'Université Laval', ville: 'Québec City', province: 'QC', type: 'universite' },
  { nom: 'UQAM — Université du Québec à Montréal', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'Université Concordia', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'HEC Montréal', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'Polytechnique Montréal', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'École de technologie supérieure (ÉTS)', ville: 'Montréal', province: 'QC', type: 'universite' },
  { nom: 'Université de Sherbrooke', ville: 'Sherbrooke', province: 'QC', type: 'universite' },
  { nom: "Université Bishop's", ville: 'Lennoxville', province: 'QC', type: 'universite' },
  { nom: 'UQTR — Université du Québec à Trois-Rivières', ville: 'Trois-Rivières', province: 'QC', type: 'universite' },
  { nom: 'UQAC — Université du Québec à Chicoutimi', ville: 'Chicoutimi', province: 'QC', type: 'universite' },
  { nom: 'Vanier College', ville: 'Montréal', province: 'QC', type: 'cegep' },
  { nom: 'Dawson College', ville: 'Montréal', province: 'QC', type: 'cegep' },
  { nom: 'Champlain Regional College', ville: 'Lennoxville', province: 'QC', type: 'cegep' },
  { nom: 'John Abbott College', ville: 'Sainte-Anne-de-Bellevue', province: 'QC', type: 'cegep' },
  { nom: 'Collège Ahuntsic', ville: 'Montréal', province: 'QC', type: 'cegep' },
  { nom: 'Collège de Maisonneuve', ville: 'Montréal', province: 'QC', type: 'cegep' },
  { nom: 'Collège de Bois-de-Boulogne', ville: 'Montréal', province: 'QC', type: 'cegep' },
  { nom: 'INRS — Institut national de la recherche scientifique', ville: 'Québec City', province: 'QC', type: 'universite' },
  // Ontario
  { nom: 'University of Toronto', ville: 'Toronto', province: 'ON', type: 'universite' },
  { nom: 'York University', ville: 'Toronto', province: 'ON', type: 'universite' },
  { nom: 'Toronto Metropolitan University', ville: 'Toronto', province: 'ON', type: 'universite' },
  { nom: "University of Ottawa", ville: 'Ottawa', province: 'ON', type: 'universite' },
  { nom: 'Carleton University', ville: 'Ottawa', province: 'ON', type: 'universite' },
  { nom: 'Western University', ville: 'London', province: 'ON', type: 'universite' },
  { nom: 'McMaster University', ville: 'Hamilton', province: 'ON', type: 'universite' },
  { nom: "Queen's University", ville: 'Kingston', province: 'ON', type: 'universite' },
  { nom: 'University of Waterloo', ville: 'Waterloo', province: 'ON', type: 'universite' },
  { nom: 'Wilfrid Laurier University', ville: 'Waterloo', province: 'ON', type: 'universite' },
  { nom: 'University of Guelph', ville: 'Guelph', province: 'ON', type: 'universite' },
  { nom: 'Brock University', ville: "St. Catharines", province: 'ON', type: 'universite' },
  { nom: 'Lakehead University', ville: 'Thunder Bay', province: 'ON', type: 'universite' },
  { nom: 'Laurentian University', ville: 'Sudbury', province: 'ON', type: 'universite' },
  { nom: 'University of Windsor', ville: 'Windsor', province: 'ON', type: 'universite' },
  { nom: 'Trent University', ville: 'Peterborough', province: 'ON', type: 'universite' },
  { nom: 'Seneca Polytechnic', ville: 'Toronto', province: 'ON', type: 'college' },
  { nom: 'George Brown College', ville: 'Toronto', province: 'ON', type: 'college' },
  { nom: 'Humber College', ville: 'Toronto', province: 'ON', type: 'college' },
  { nom: 'Centennial College', ville: 'Toronto', province: 'ON', type: 'college' },
  { nom: 'Algonquin College', ville: 'Ottawa', province: 'ON', type: 'college' },
  { nom: 'Sheridan College', ville: 'Brampton', province: 'ON', type: 'college' },
  { nom: 'Mohawk College', ville: 'Hamilton', province: 'ON', type: 'college' },
  { nom: 'Durham College', ville: 'Oshawa', province: 'ON', type: 'college' },
  { nom: 'Conestoga College', ville: 'Kitchener', province: 'ON', type: 'college' },
  { nom: 'Fanshawe College', ville: 'London', province: 'ON', type: 'college' },
  { nom: 'Cambrian College', ville: 'Sudbury', province: 'ON', type: 'college' },
  { nom: 'Niagara College', ville: 'Welland', province: 'ON', type: 'college' },
  { nom: 'Georgian College', ville: 'Barrie', province: 'ON', type: 'college' },
  { nom: 'Lambton College', ville: 'Sarnia', province: 'ON', type: 'college' },
  // BC
  { nom: 'University of British Columbia (UBC)', ville: 'Vancouver', province: 'BC', type: 'universite' },
  { nom: 'Simon Fraser University (SFU)', ville: 'Burnaby', province: 'BC', type: 'universite' },
  { nom: 'University of Victoria', ville: 'Victoria', province: 'BC', type: 'universite' },
  { nom: 'University of Northern BC', ville: 'Prince George', province: 'BC', type: 'universite' },
  { nom: 'University of the Fraser Valley', ville: 'Abbotsford', province: 'BC', type: 'universite' },
  { nom: 'Thompson Rivers University', ville: 'Kamloops', province: 'BC', type: 'universite' },
  { nom: 'BCIT — British Columbia Institute of Technology', ville: 'Burnaby', province: 'BC', type: 'technique' },
  { nom: 'Langara College', ville: 'Vancouver', province: 'BC', type: 'college' },
  { nom: 'Douglas College', ville: 'New Westminster', province: 'BC', type: 'college' },
  { nom: 'Kwantlen Polytechnic University (KPU)', ville: 'Surrey', province: 'BC', type: 'college' },
  { nom: 'Vancouver Community College (VCC)', ville: 'Vancouver', province: 'BC', type: 'college' },
  { nom: 'College of New Caledonia', ville: 'Prince George', province: 'BC', type: 'college' },
  { nom: 'Okanagan College', ville: 'Kelowna', province: 'BC', type: 'college' },
  { nom: 'Camosun College', ville: 'Victoria', province: 'BC', type: 'college' },
  { nom: 'North Island College', ville: 'Courtenay', province: 'BC', type: 'college' },
  { nom: 'College of the Rockies', ville: 'Cranbrook', province: 'BC', type: 'college' },
  { nom: 'Vancouver Island University', ville: 'Nanaimo', province: 'BC', type: 'universite' },
  { nom: 'Emily Carr University of Art + Design', ville: 'Vancouver', province: 'BC', type: 'universite' },
  // Alberta
  { nom: 'University of Alberta', ville: 'Edmonton', province: 'AB', type: 'universite' },
  { nom: 'University of Calgary', ville: 'Calgary', province: 'AB', type: 'universite' },
  { nom: 'University of Lethbridge', ville: 'Lethbridge', province: 'AB', type: 'universite' },
  { nom: 'MacEwan University', ville: 'Edmonton', province: 'AB', type: 'universite' },
  { nom: 'Athabasca University', ville: 'Athabasca', province: 'AB', type: 'universite' },
  { nom: 'NAIT — Northern Alberta Institute of Technology', ville: 'Edmonton', province: 'AB', type: 'technique' },
  { nom: 'SAIT — Southern Alberta Institute of Technology', ville: 'Calgary', province: 'AB', type: 'technique' },
  { nom: 'Bow Valley College', ville: 'Calgary', province: 'AB', type: 'college' },
  { nom: 'Grande Prairie Regional College', ville: 'Grande Prairie', province: 'AB', type: 'college' },
  { nom: 'Norquest College', ville: 'Edmonton', province: 'AB', type: 'college' },
  { nom: 'Red Deer Polytechnic', ville: 'Red Deer', province: 'AB', type: 'technique' },
  { nom: 'Lethbridge College', ville: 'Lethbridge', province: 'AB', type: 'college' },
  // Manitoba
  { nom: 'University of Manitoba', ville: 'Winnipeg', province: 'MB', type: 'universite' },
  { nom: 'University of Winnipeg', ville: 'Winnipeg', province: 'MB', type: 'universite' },
  { nom: 'Brandon University', ville: 'Brandon', province: 'MB', type: 'universite' },
  { nom: 'Red River College Polytechnic', ville: 'Winnipeg', province: 'MB', type: 'college' },
  { nom: 'Assiniboine Community College', ville: 'Brandon', province: 'MB', type: 'college' },
  // Saskatchewan
  { nom: 'University of Saskatchewan', ville: 'Saskatoon', province: 'SK', type: 'universite' },
  { nom: 'University of Regina', ville: 'Regina', province: 'SK', type: 'universite' },
  { nom: 'Saskatchewan Polytechnic', ville: 'Saskatoon', province: 'SK', type: 'technique' },
  // Nova Scotia
  { nom: 'Dalhousie University', ville: 'Halifax', province: 'NS', type: 'universite' },
  { nom: "Saint Mary's University", ville: 'Halifax', province: 'NS', type: 'universite' },
  { nom: 'Acadia University', ville: 'Wolfville', province: 'NS', type: 'universite' },
  { nom: 'Cape Breton University', ville: 'Sydney', province: 'NS', type: 'universite' },
  { nom: 'NSCC — Nova Scotia Community College', ville: 'Halifax', province: 'NS', type: 'college' },
  // New Brunswick
  { nom: 'University of New Brunswick', ville: 'Fredericton', province: 'NB', type: 'universite' },
  { nom: 'Université de Moncton', ville: 'Moncton', province: 'NB', type: 'universite' },
  { nom: "Mount Allison University", ville: 'Sackville', province: 'NB', type: 'universite' },
  { nom: "St. Thomas University", ville: 'Fredericton', province: 'NB', type: 'universite' },
  { nom: 'New Brunswick Community College (NBCC)', ville: 'Moncton', province: 'NB', type: 'college' },
  // Newfoundland
  { nom: 'Memorial University of Newfoundland', ville: "St. John's", province: 'NL', type: 'universite' },
  { nom: 'College of the North Atlantic', ville: "St. John's", province: 'NL', type: 'college' },
  // PEI
  { nom: 'University of Prince Edward Island (UPEI)', ville: 'Charlottetown', province: 'PE', type: 'universite' },
  { nom: 'Holland College', ville: 'Charlottetown', province: 'PE', type: 'college' },
];

// ── Normalisation vers format final ─────────────────────────────────────────

interface DLIResult {
  id: string;
  nom: string;
  ville: string;
  province: string;
  type: string;
  admissionsUrl: string;
  source: 'live' | 'fallback';
}

function normalize(raw: RawDLI, source: 'live' | 'fallback', idx: number): DLIResult {
  const province = toProvinceCode(raw.province);
  const type = toType(raw.type);
  const slug = raw.nom.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const id = `${slug}-${idx}`;

  return {
    id,
    nom: raw.nom.trim(),
    ville: raw.ville.trim(),
    province,
    type,
    admissionsUrl: guessAdmissionsUrl(raw.nom),
    source,
  };
}

// ── Route API ────────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24h
    'Access-Control-Allow-Origin': '*',
  };

  // Tentative 1 : CSV officiel IRCC (gratuit, ~1360 DLI uniques)
  let rawList = await fetchFromOpenData();
  let sourceUsed = 'ircc-csv';

  // Tentative 2 : canada.ca HTML via ScraperAPI render=true (si CSV échoue)
  if (rawList.length < 100) {
    const scraped = await fetchFromCanadaCA();
    if (scraped.length > rawList.length) {
      rawList = scraped;
      sourceUsed = 'canada.ca';
    }
  }

  // Fallback embarqué
  let source: 'live' | 'fallback' = 'live';
  if (rawList.length < 50) {
    rawList = FALLBACK_RAW;
    source = 'fallback';
    sourceUsed = 'fallback';
  }

  // Dédoublonnage par nom normalisé
  const seen = new Set<string>();
  const unique = rawList.filter(r => {
    const key = r.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return r.nom.length > 2;
  });

  const results = unique.map((r, i) => normalize(r, source, i));

  return new Response(
    JSON.stringify({
      total: results.length,
      source: sourceUsed,
      updatedAt: new Date().toISOString(),
      data: results,
    }),
    { status: 200, headers },
  );
};
