// ─────────────────────────────────────────────────────────────────────────────
// dli-service.ts — Service de données DLI avec cache AsyncStorage (24 h)
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DLI_INSTITUTIONS } from './dli-data';
import type { DLIInstitution as DLIDataInstitution } from './dli-data';
import { HIPOLABS_CANADA } from './hipolabs-canada';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://capituneweb.vercel.app';

// Convertit le format dli-data (riche) vers le format service (simplifié)
function fromStaticData(items: DLIDataInstitution[]): DLIInstitution[] {
  return items.map(i => ({
    id: i.id,
    nom: i.nom,
    ville: i.ville,
    province: i.province,
    type: i.type,
    admissionsUrl: i.admissionsUrl,
    source: 'fallback' as const,
  }));
}

const STATIC_FALLBACK: DLIInstitution[] = fromStaticData(DLI_INSTITUTIONS);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProvinceCode =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NT' | 'NS'
  | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export type DLIType =
  | 'universite' | 'cegep' | 'college' | 'technique' | 'ecole_langue';

export interface DLIInstitution {
  id: string;
  nom: string;
  ville: string;
  province: ProvinceCode | string;
  type: DLIType | string;
  admissionsUrl: string;
  source?: 'live' | 'fallback';
}

export interface DLISearchParams {
  query?: string;
  province?: ProvinceCode | string;
  city?: string;
  type?: DLIType | string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DLI_CACHE_KEY = 'dli_full_cache_v9';  // v9 = overrides d'URLs officielles (CÉGEPs / collèges) + refresh cache
const DLI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h en ms

interface DLICache {
  updatedAt: number;
  total: number;
  source: string;
  data: DLIInstitution[];
}

// ── Singleton cache en mémoire ────────────────────────────────────────────────

let _memCache: DLIInstitution[] | null = null;
let _fetchPromise: Promise<DLIInstitution[]> | null = null;

// ── Helper fetch avec timeout compatible RN ─────────────────────────────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
): Promise<Response> {
  // Sur certaines versions RN/Expo, AbortSignal.timeout() n'existe pas.
  // On utilise AbortController si dispo, sinon on fait un fetch sans timeout.
  const AbortControllerRef: typeof AbortController | undefined = (globalThis as any).AbortController;
  if (!AbortControllerRef) {
    return fetch(url, init);
  }

  const controller = new AbortControllerRef();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...(init ?? {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeInstitutionName(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const CITY_KEYWORDS: string[] = [
  'sherbrooke',
  'montreal', 'montréal',
  'quebec', 'québec',
  'ottawa',
  'toronto',
  'vancouver',
  'calgary',
  'edmonton',
  'winnipeg',
  'halifax',
  'gatineau',
  'laval',
  'longueuil',
  'brossard',
  'saguenay',
  'trois-rivieres', 'trois-rivières',
  'rimouski',
  'chicoutimi',
  'drummondville',
  'victoria',
  'kelowna',
  'saskatoon',
  'regina',
  'moncton',
  'fredericton',
  'st john', 'saint john',
  'st john\'s', 'saint john\'s',
];

function inferCityFromName(name: string): string {
  const normalized = normalizeInstitutionName(name);
  for (const k of CITY_KEYWORDS) {
    const kn = normalizeInstitutionName(k);
    if (kn && normalized.includes(kn)) {
      // Retourne une version "jolie" (sans être parfaite) : on ré-utilise k
      // en privilégiant la forme avec accents si fournie.
      return k;
    }
  }
  return '';
}

// ── Lecture / écriture cache ──────────────────────────────────────────────────

async function readCache(): Promise<DLIInstitution[] | null> {
  try {
    const raw = await AsyncStorage.getItem(DLI_CACHE_KEY);
    if (!raw) return null;
    const cached: DLICache = JSON.parse(raw);
    const age = Date.now() - cached.updatedAt;
    if (age > DLI_CACHE_TTL) return null;         // expiré
    return cached.data ?? null;
  } catch {
    return null;
  }
}

async function writeCache(data: DLIInstitution[], source: string): Promise<void> {
  try {
    const entry: DLICache = {
      updatedAt: Date.now(),
      total: data.length,
      source,
      data,
    };
    await AsyncStorage.setItem(DLI_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Silencieux — perte de cache non bloquante
  }
}

// ── Fetch depuis l'API Astro /api/dli ─────────────────────────────────────────

async function fetchFromAPI(): Promise<{ data: DLIInstitution[]; source: string }> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/api/dli`,
    { headers: { 'Accept': 'application/json' } },
    15000,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as {
    total: number;
    source: string;
    data: DLIInstitution[];
  };
  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('Réponse API DLI invalide');
  }
  return { data: json.data, source: json.source ?? 'api' };
}

// ── Fetch JSON statique pré-compilé (1 344 DLI, 102 KB) ──────────────────────
// Stocké dans public/dli.json du repo → servi par Vercel ET GitHub raw.
// Beaucoup plus rapide que le CSV IRCC de 6.8 MB.

async function fetchFromStaticJSON(): Promise<{ data: DLIInstitution[]; source: string }> {
  const URLS = [
    // Fichier statique Vercel (public/dli.json)
    `${BASE_URL}/dli.json`,
    // GitHub raw — toujours disponible même si Vercel est down
    'https://raw.githubusercontent.com/ndom2504/capitunecax/main/public/dli.json',
  ];

  for (const url of URLS) {
    try {
      const res = await fetchWithTimeout(
        url,
        { headers: { 'Accept': 'application/json' } },
        18000,
      );
      if (!res.ok) continue;

      // Le JSON a la forme [{n, p, t}, …] — champs courts pour réduire la taille
      const text = await res.text();
      const cleaned = text.replace(/^\uFEFF/, '');
      const raw = JSON.parse(cleaned) as Array<{ n: string; p: string; t: string }>;
      if (!Array.isArray(raw) || raw.length < 100) continue;

      const data: DLIInstitution[] = raw.map((entry, i) => {
        const slug = (entry.n ?? '').toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').slice(0, 36);
        const nom = entry.n ?? '';
        const ville = inferCityFromName(nom);
        return {
          id: `dli-${slug}-${i}`,
          nom,
          ville,
          province: toProvinceCode(entry.p ?? ''),
          type: toTypeCode(entry.t ?? ''),
          // L'IRCC ne fournit pas le site officiel par établissement.
          // On laisse vide et on gère la redirection côté UI (officiel si dispo, sinon recherche web).
          admissionsUrl: '',
          source: 'live' as const,
        };
      }).filter(i => i.nom.length > 2);

      if (data.length > 100) {
        return { data, source: `static-json (${data.length})` };
      }
    } catch { continue; }
  }
  throw new Error('JSON statique DLI inaccessible');
}

// ── Fetch hipolabs snapshot (157 URLs officielles) ──────────────────────────
// hipolabs ne supporte pas HTTPS de façon fiable, donc on versionne un snapshot
// public/hipolabs-canada.json (servi en HTTPS via Vercel/GitHub raw).

async function fetchHipolabsSnapshot(): Promise<Array<{ n: string; u: string }>> {
  // On embarque le snapshot dans le bundle RN pour garantir les URLs officielles
  // même sans réseau / si Vercel/GitHub est indisponible.
  return HIPOLABS_CANADA;
}

// ── Overrides d'URLs officielles (ex: CÉGEPs) ───────────────────────────────

type InstitutionOverride = { n: string; u: string };

const EMBEDDED_INSTITUTION_OVERRIDES: InstitutionOverride[] = [
  { n: 'Cégep de Sherbrooke', u: 'https://www.cegepsherbrooke.qc.ca/' },
  // Champlain Regional College – Lennoxville (souvent listé sous des variantes)
  { n: 'Champlain Regional College - Lennoxville', u: 'https://www.crc-lennox.qc.ca/' },
  { n: 'Champlain College Lennoxville', u: 'https://www.crc-lennox.qc.ca/' },
  { n: 'Champlain Regional College', u: 'https://www.crc-lennox.qc.ca/' },
];

async function fetchInstitutionOverrides(): Promise<InstitutionOverride[]> {
  const urls = [
    `${BASE_URL}/institution-overrides.json`,
    'https://raw.githubusercontent.com/ndom2504/capitunecax/main/public/institution-overrides.json',
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(
        url,
        { headers: { 'Accept': 'application/json' } },
        12000,
      );
      if (!res.ok) continue;
      const text = await res.text();
      const cleaned = text.replace(/^\uFEFF/, '').trim();
      const json = JSON.parse(cleaned) as unknown;
      if (!Array.isArray(json)) continue;

      const parsed = json
        .map((x: any) => ({ n: String(x?.n ?? ''), u: String(x?.u ?? '') }))
        .filter(x => x.n.length > 2 && x.u.startsWith('http'));

      if (parsed.length > 0) return parsed;
    } catch {
      continue;
    }
  }

  return EMBEDDED_INSTITUTION_OVERRIDES;
}

function findBestOverrideUrl(
  dliName: string,
  overrides: InstitutionOverride[],
): string {
  const dn = normalizeInstitutionName(dliName);
  if (!dn) return '';

  // 1) Match exact
  for (const o of overrides) {
    if (normalizeInstitutionName(o.n) === dn) return o.u;
  }

  // 2) Match "contient" (prend le plus long match)
  let bestUrl = '';
  let bestLen = 0;
  for (const o of overrides) {
    const on = normalizeInstitutionName(o.n);
    if (on.length < 8) continue;
    if (dn.includes(on) || on.includes(dn)) {
      const score = Math.min(on.length, dn.length);
      if (score > bestLen) {
        bestLen = score;
        bestUrl = o.u;
      }
    }
  }
  return bestUrl;
}

function findBestHipolabsUrl(
  dliName: string,
  hipolabs: Array<{ n: string; u: string }>,
): string {
  const dn = normalizeInstitutionName(dliName);
  if (!dn) return '';

  // 1) Match exact
  for (const h of hipolabs) {
    if (normalizeInstitutionName(h.n) === dn) return h.u;
  }

  // 2) Match "contient" (prend le plus long match)
  let bestUrl = '';
  let bestLen = 0;
  for (const h of hipolabs) {
    const hn = normalizeInstitutionName(h.n);
    if (hn.length < 8) continue;
    if (dn.includes(hn) || hn.includes(dn)) {
      const score = Math.min(hn.length, dn.length);
      if (score > bestLen) {
        bestLen = score;
        bestUrl = h.u;
      }
    }
  }
  return bestUrl;
}

// ── Fetch direct open.canada.ca CKAN (pas de CORS en React Native) ───────────

function toProvinceCode(raw: string): string {
  const MAP: Record<string, string> = {
    alberta: 'AB', 'british columbia': 'BC', 'colombie-britannique': 'BC',
    manitoba: 'MB', 'new brunswick': 'NB', 'nouveau-brunswick': 'NB',
    'newfoundland': 'NL', 'newfoundland and labrador': 'NL', 'terre-neuve': 'NL',
    'northwest territories': 'NT', 'territoires du nord-ouest': 'NT',
    'nova scotia': 'NS', 'nouvelle-écosse': 'NS',
    nunavut: 'NU', ontario: 'ON',
    'prince edward island': 'PE', 'île-du-prince-édouard': 'PE',
    québec: 'QC', quebec: 'QC',
    saskatchewan: 'SK', yukon: 'YT',
  };
  const clean = raw.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [k, v] of Object.entries(MAP)) {
    const kn = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (kn === clean || clean.includes(kn)) return v;
  }
  if (raw.trim().length === 2) return raw.trim().toUpperCase();
  return raw.trim().slice(0, 2).toUpperCase();
}

function toTypeCode(raw: string): string {
  const s = (raw ?? '').toLowerCase();
  if (s.includes('univer') || s.includes('college universitaire')) return 'universite';
  if (s.includes('cégep') || s.includes('cegep')) return 'cegep';
  if (s.includes('langue') || s.includes('language')) return 'ecole_langue';
  if (s.includes('technique') || s.includes('polytechni') || s.includes('technology')) return 'technique';
  return 'college';
}

async function fetchFromOpenCanada(): Promise<{ data: DLIInstitution[]; source: string }> {
  // L'API CKAN d'open.canada.ca est accessible sans CORS depuis React Native
  const RESOURCE_IDS = [
    'c62fcf26-dc4c-402c-aef4-cb1697f54d5a',
    '280db2d9-8b63-463c-8c60-d2d34a19c7f0',
  ];

  for (const rid of RESOURCE_IDS) {
    try {
      const url = `https://open.canada.ca/data/api/3/action/datastore_search?resource_id=${rid}&limit=3000`;
      const res = await fetchWithTimeout(
        url,
        { headers: { 'Accept': 'application/json' } },
        20000,
      );
      if (!res.ok) continue;
      const json = await res.json() as { result?: { records?: Record<string, string>[] } };
      const records = json?.result?.records;
      if (!records || records.length < 50) continue;

      const data: DLIInstitution[] = records.map((r, i) => {
        const nom = r['Institution Name'] ?? r["Nom de l'établissement"] ?? r['name'] ?? '';
        const ville = r['City'] ?? r['Ville'] ?? '';
        const prov = toProvinceCode(r['Province'] ?? r['Province/Territory'] ?? '');
        const type = toTypeCode(r['Type'] ?? r['Sector'] ?? '');
        const slug = nom.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').slice(0, 36);
        return {
          id: `oc-${slug}-${i}`,
          nom,
          ville,
          province: prov,
          type,
          admissionsUrl: 'https://www.educanada.ca/schools-ecoles/index.aspx?lang=fra',
          source: 'live' as const,
        };
      }).filter(i => i.nom.length > 2);

      if (data.length > 50) {
        return { data, source: `open.canada.ca (${data.length})` };
      }
    } catch {
      continue;
    }
  }
  throw new Error('open.canada.ca indisponible');
}

// ── Point d'entrée public ─────────────────────────────────────────────────────

/**
 * Retourne la liste complète des DLI.
 * Ordre de priorité :
 *   1. Mémoire (même session)
 *   2. AsyncStorage (< 24 h)
 *   3. JSON statique public/dli.json via Vercel (102 KB, 1 344 DLI) ou GitHub raw
 *   4. API Astro /api/dli (si Vercel disponible)
 *   5. hipolabs.com — 157 universités canadiennes (petit, fiable)
 *   6. open.canada.ca CKAN API directe → 500–3000
 *   7. Fallback statique embarqué (62 établissements)
 */
export async function fetchDLIInstitutions(): Promise<DLIInstitution[]> {
  // Cache mémoire
  if (_memCache) return _memCache;

  // Dédoublonnage des appels concurrents
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    // AsyncStorage
    const cached = await readCache();
    if (cached && cached.length > 0) {
      _memCache = cached;
      return cached;
    }

    // JSON statique pré-compilé (Vercel ou GitHub raw) → 1 344 DLI, 102 KB
    try {
      const { data, source } = await fetchFromStaticJSON();
      if (data.length > 100) {
        // Enrichissement optionnel via snapshot hipolabs (URLs officielles)
        const hipolabs = await fetchHipolabsSnapshot();
        const overrides = await fetchInstitutionOverrides();
        const seen = new Set(data.map(d => normalizeInstitutionName(d.nom).slice(0, 60)));

        // 1) Pour les établissements qui matchent, remplacer CICIC par URL officielle
        const enriched = data.map(d => {
          const url = findBestHipolabsUrl(d.nom, hipolabs);
          if (!url) return d;
          return { ...d, admissionsUrl: url };
        });

        // 2) Ajouter les entrées hipolabs absentes du dataset IRCC
        const extras: DLIInstitution[] = hipolabs
          .filter(h => !seen.has(normalizeInstitutionName(h.n).slice(0, 60)))
          .map((h, i) => {
            const nom = h.n;
            const slug = nom.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-').slice(0, 36);
            return {
              id: `hipo-${slug}-${i}`,
              nom,
              ville: inferCityFromName(nom),
              province: '',
              type: toTypeCode(nom),
              admissionsUrl: h.u,
              source: 'live' as const,
            };
          });

        // 3) Appliquer les overrides (utile pour CÉGEPs/Collèges non couverts par hipolabs)
        const merged = [...enriched, ...extras].map(d => {
          if (d.admissionsUrl && d.admissionsUrl.trim().length > 0) return d;
          const u = findBestOverrideUrl(d.nom, overrides);
          if (!u) return d;
          return { ...d, admissionsUrl: u };
        });
        _memCache = merged;
        await writeCache(merged, `${source}+hipolabs+overrides`);
        return merged;
      }
    } catch { /* continuer */ }

    // API Astro avec 1 retry
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data, source } = await fetchFromAPI();
        if (data.length > 0) {
          _memCache = data;
          await writeCache(data, source);
          return data;
        }
      } catch {
        if (attempt === 1) break;
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // hipolabs snapshot seul → URLs officielles si tout le reste échoue
    try {
      const hipolabs = await fetchHipolabsSnapshot();
      if (hipolabs.length > 50) {
        const overrides = await fetchInstitutionOverrides();
        const items: DLIInstitution[] = hipolabs.map((h, i) => {
          const nom = h.n;
          const slug = nom.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-').slice(0, 36);
          return {
            id: `hipo-${slug}-${i}`,
            nom,
            ville: inferCityFromName(nom),
            province: '',
            type: toTypeCode(nom),
            admissionsUrl: h.u,
            source: 'live' as const,
          };
        });
        const merged = items.map(d => {
          if (d.admissionsUrl && d.admissionsUrl.trim().length > 0) return d;
          const u = findBestOverrideUrl(d.nom, overrides);
          if (!u) return d;
          return { ...d, admissionsUrl: u };
        });
        _memCache = merged;
        await writeCache(merged, `hipolabs-snapshot+overrides (${merged.length})`);
        return merged;
      }
    } catch { /* continuer */ }

    // open.canada.ca CKAN direct (pas de proxy nécessaire en RN)
    try {
      const { data, source } = await fetchFromOpenCanada();
      if (data.length > 50) {
        _memCache = data;
        await writeCache(data, source);
        return data;
      }
    } catch { /* continuer vers fallback */ }

    // Fallback statique embarqué
    _memCache = STATIC_FALLBACK;
    return STATIC_FALLBACK;
  })().finally(() => {
    _fetchPromise = null;
  });

  return _fetchPromise;
}

/**
 * Invalide le cache (utile pour forcer un refresh).
 */
export async function invalidateDLICache(): Promise<void> {
  _memCache = null;
  try {
    await AsyncStorage.removeItem(DLI_CACHE_KEY);
  } catch { /* silencieux */ }
}

/**
 * Recherche asynchrone dans la liste DLI.
 * Correspondance sur nom, ville ou province.
 */
export async function searchDLIAsync(params: DLISearchParams): Promise<DLIInstitution[]> {
  const all = await fetchDLIInstitutions();
  return filterDLI(all, params);
}

/**
 * Filtre synchrone sur une liste déjà chargée.
 */
export function filterDLI(
  items: DLIInstitution[],
  params: DLISearchParams,
): DLIInstitution[] {
  let result = items;

  if (params.province) {
    result = result.filter(i => i.province === params.province);
  }

  if (params.city) {
    result = result.filter(i => i.ville === params.city);
  }

  if (params.type) {
    result = result.filter(i => i.type === params.type);
  }

  if (params.query && params.query.trim()) {
    const q = params.query.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    result = result.filter(i => {
      const nom = i.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const ville = i.ville.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nom.includes(q) || ville.includes(q);
    });
  }

  return result;
}
