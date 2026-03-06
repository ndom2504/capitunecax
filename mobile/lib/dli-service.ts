// ─────────────────────────────────────────────────────────────────────────────
// dli-service.ts — Service de données DLI avec cache AsyncStorage (24 h)
// ─────────────────────────────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { DLI_INSTITUTIONS } from './dli-data';
import type { DLIInstitution as DLIDataInstitution } from './dli-data';

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
  type?: DLIType | string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const DLI_CACHE_KEY = 'dli_full_cache_v5';  // v5 = IRCC CSV direct depuis mobile
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
  const res = await fetch(`${BASE_URL}/api/dli`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
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

// ── Fetch direct CSV IRCC (React Native, pas de CORS) ────────────────────────
// IRCC publie des TSV officiels avec ~1300 DLI uniques.
// Colonnes clés : EN_DLI_PROVINCE_TERRITORY, EN_DESIGNATED_LEARNING_INSTITU(T)ION, EN_INSTITUTION_TYPE

async function fetchFromIRCCCSV(): Promise<{ data: DLIInstitution[]; source: string }> {
  const URLS = [
    // DLI × Province × Institution Type (University / College / Language School …)
    'https://www.ircc.canada.ca/opendata-donneesouvertes/data/ODP-TR-Study-DLI_name_PT_Inst_type.csv',
    // DLI × Province × Admin type (Public / Private) — fallback
    'https://www.ircc.canada.ca/opendata-donneesouvertes/data/ODP-TR-Study-DLI_name_PT_Admin_type.csv',
  ];

  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'text/csv,text/plain,*/*', 'User-Agent': 'Capitune/1.0' },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) continue;

      const text = await res.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 10) continue;

      // Header tab-séparé
      const header = lines[0].split('\t').map(h => h.trim().replace(/\r/g, '').toLowerCase());
      const provIdx = header.findIndex(h => h === 'en_dli_province_territory' || h.includes('province'));
      const nameIdx = header.findIndex(h => h.includes('learning_institu')); // gère typo "instituion"
      const typeIdx = header.findIndex(h => h === 'en_institution_type' || h === 'en_admin_type');

      if (provIdx < 0 || nameIdx < 0) continue;

      const seen = new Set<string>();
      const data: DLIInstitution[] = [];

      for (const line of lines.slice(1)) {
        const cells = line.split('\t');
        if (cells.length <= Math.max(provIdx, nameIdx)) continue;
        const nom = cells[nameIdx]?.trim().replace(/\r/g, '') ?? '';
        const prov = cells[provIdx]?.trim().replace(/\r/g, '') ?? '';
        const rawType = typeIdx >= 0 ? (cells[typeIdx]?.trim().replace(/\r/g, '') ?? '') : '';
        if (nom.length < 3 || prov.length < 2) continue;

        const key = `${nom.toLowerCase().slice(0, 40)}|${prov.toLowerCase().slice(0, 10)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const slug = nom.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').slice(0, 36);
        data.push({
          id: `ircc-${slug}-${data.length}`,
          nom,
          ville: '',
          province: toProvinceCode(prov),
          type: toTypeCode(rawType),
          admissionsUrl: 'https://www.educanada.ca/schools-ecoles/index.aspx?lang=fra',
          source: 'live',
        });
      }

      if (data.length > 200) {
        return { data, source: `ircc-csv (${data.length})` };
      }
    } catch { continue; }
  }
  throw new Error('IRCC CSV inaccessible');
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
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'Accept': 'application/json' },
      });
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
 *   3. API Astro /api/dli (si Vercel disponible)
 *   4. CSV officiel IRCC direct (ircc.canada.ca, pas de CORS en RN) → ~1300 DLI
 *   5. open.canada.ca CKAN API directe → 500–3000
 *   6. Fallback statique embarqué (62 établissements)
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

    // CSV officiel IRCC direct (React Native, pas de CORS) → ~1300 DLI
    try {
      const { data, source } = await fetchFromIRCCCSV();
      if (data.length > 200) {
        _memCache = data;
        await writeCache(data, source);
        return data;
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
