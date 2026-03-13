// /api/jobs — Flux RSS officiel Guichet Emplois Canada (guichetemplois.gc.ca)
// Le flux RSS est XML statique (pas de JS), plus fiable que le scraping HTML.
// Pas besoin de render=true → rapidité + fiabilité maximales.
import type { APIRoute } from 'astro';

const SCRAPER_KEY = '624751bbf5ddc786bad6c4f31f50d41c';
const BASE_FR     = 'https://www.guichetemplois.gc.ca';

// ── Helpers ───────────────────────────────────────────────────────────────────

function decode(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function xmlTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m  = re.exec(xml);
  return m ? decode(m[1]) : '';
}

function formatPubDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Fetch RSS via ScraperAPI (render=false — XML statique) ────────────────────

async function fetchRSS(q: string, location: string): Promise<string> {
  // Guichet Emplois expose un flux RSS pour n'importe quelle recherche
  const rssParams = new URLSearchParams({ sort: 'M', rss: '1', action: 'search' });
  if (q)        rssParams.set('searchstring',   q);
  if (location) rssParams.set('locationstring', location);

  const target  = `${BASE_FR}/jobsearch/rechercheemplois?${rssParams.toString()}`;

  // render=false suffit pour du XML pur — beaucoup plus rapide
  const scraperParams = new URLSearchParams({
    api_key: SCRAPER_KEY,
    url:     target,
    render:  'false',
  });

  const res = await fetch(
    `https://api.scraperapi.com/?${scraperParams.toString()}`,
    { signal: AbortSignal.timeout(25_000) }
  );
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status}`);
  return res.text();
}

// ── Parser RSS/XML ─────────────────────────────────────────────────────────────

function parseRSS(xml: string): object[] {
  const jobs: object[] = [];

  // Chaque offre est dans un bloc <item>…</item>
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;

  while ((m = itemRe.exec(xml)) !== null) {
    const item = m[1];

    const title   = xmlTag(item, 'title');
    const link    = xmlTag(item, 'link');
    const pubDate = xmlTag(item, 'pubDate');
    const desc    = xmlTag(item, 'description'); // contient employeur, lieu, salaire

    if (!title || !link) continue;

    // Extraire l'ID de l'URL  ex: /fr/ficheemploi/987654321
    const idM = /\/(\d{7,12})(?:[/?#]|$)/.exec(link);
    const id  = idM ? idM[1] : Math.random().toString(36).slice(2);

    // La <description> du RSS ressemble à :
    // "Entreprise XYZ - Montréal (QC) - 25 $/h"  ou
    // "Entreprise XYZ | Montréal | Permanent | 50 000 $/an"
    let company  = '';
    let location = '';
    let salary   = '';

    if (desc) {
      // Tentative : séparer par ' - ' ou ' | '
      const sep   = desc.includes(' | ') ? ' | ' : ' - ';
      const parts = desc.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 1) company  = parts[0];
      if (parts.length >= 2) location = parts[1];
      if (parts.length >= 3) {
        // le salaire contient généralement '$', 'h', 'an', 'mois'
        const salaryPart = parts.find(p => /\$|salaire|taux/i.test(p));
        if (salaryPart) salary = salaryPart;
        else if (parts.length >= 4) salary = parts[3];
      }
    }

    jobs.push({
      id,
      title,
      company:           company  || 'Employeur confidentiel',
      location:          location || 'Canada',
      salary:            salary   || null,
      description_short: pubDate  ? `Publié ${formatPubDate(pubDate)}` : 'Offre récente',
      url_officielle:    link.startsWith('http') ? link : `${BASE_FR}${link}`,
    });

    if (jobs.length >= 25) break;
  }

  return jobs;
}

// ── Route GET /api/jobs ───────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const q        = (url.searchParams.get('q')        || '').trim();
  const location = (url.searchParams.get('location') || '').trim();
  const debug    = url.searchParams.get('debug') === '1';

  const headers = {
    'Content-Type':                'application/json',
    'Cache-Control':               'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const xml  = await fetchRSS(q, location);

    // Mode debug : retourne le XML brut pour diagnostic
    if (debug) {
      return new Response(JSON.stringify({ raw: xml.slice(0, 8000) }), { headers });
    }

    let jobs = parseRSS(xml);

    // Fallback : retry sans localisation si 0 résultat
    if (jobs.length === 0 && location) {
      const xml2 = await fetchRSS(q, '');
      jobs = parseRSS(xml2);
    }

    return new Response(JSON.stringify(jobs), { headers });

  } catch (err: any) {
    console.error('[/api/jobs] Erreur:', err?.message);
    return new Response(
      JSON.stringify({ error: err?.message || 'fetch_failed', jobs: [] }),
      { status: 500, headers }
    );
  }
};

