// /api/jobs — Scrape réel du Guichet Emplois Canada (guichetemplois.gc.ca)
// Source exacte : https://www.guichetemplois.gc.ca/jobsearch/rechercheemplois?sort=M
// Proxy via ScraperAPI (render=true pour le JS) — même clé que /api/dli.ts
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
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g,    ' ')
    .trim();
}

/** Extrait le texte brut d'un bloc HTML correspondant à l'une des classes */
function innerText(block: string, ...classes: string[]): string {
  for (const cls of classes) {
    const re = new RegExp(
      `class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/(?:span|div|li|p|td)>`,
      'i'
    );
    const m = re.exec(block);
    if (m) return m[1].replace(/<[^>]+>/g, '').trim();
  }
  return '';
}

// ── Fetch via ScraperAPI ──────────────────────────────────────────────────────

async function fetchGuichet(q: string, location: string): Promise<string> {
  const params = new URLSearchParams({ sort: 'M' });
  if (q)        params.set('searchstring',  q);
  if (location) params.set('locationstring', location);

  const target = `${BASE_FR}/jobsearch/rechercheemplois?${params.toString()}`;

  const scraperParams = new URLSearchParams({
    api_key: SCRAPER_KEY,
    url:     target,
    render:  'true',          // exécute le JS (résultats Ajax)
  });

  const scraperUrl = `https://api.scraperapi.com/?${scraperParams.toString()}`;
  const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status}`);
  return res.text();
}

// ── Parser HTML ───────────────────────────────────────────────────────────────

function parseJobs(html: string): object[] {
  const jobs: object[] = [];

  // Guichet Emplois : chaque offre est dans un <article … class="…resultJobItem…" data-id="NNN">
  const articleRe = /<article([^>]*)>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;

  while ((m = articleRe.exec(html)) !== null) {
    const attrs = m[1];
    const block = m[2];

    // Filtrer uniquement les articles d'offres d'emploi
    if (!/resultJobItem/i.test(attrs)) continue;

    // ID numérique
    const idM = /data-id="(\d+)"/.exec(attrs);
    const id  = idM ? idM[1] : Math.random().toString(36).slice(2);

    // Titre : <span class="noctitle"> ou lien ficheemploi/jobposting
    let title = innerText(block, 'noctitle', 'titre');
    if (!title) {
      const lm = /href="[^"]*(?:ficheemploi|jobposting)[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      title = lm ? lm[1].replace(/<[^>]+>/g, '').trim() : '';
    }
    if (!title) continue;

    // Entreprise
    const company   = innerText(block, 'business', 'entreprise', 'resultJobItem-businessName');
    // Lieu
    const locText   = innerText(block, 'location',  'lieu',      'resultJobItem-location');
    // Salaire  
    const salary    = innerText(block, 'salary',    'salaire',   'resultJobItem-salary');
    // Date de publication
    const dateText  = innerText(block, 'date',      'resultJobItem-date');

    // URL — priorité au lien trouvé dans le bloc
    const urlM = /href="([^"]*(?:ficheemploi|jobposting)\/(\d+)[^"]*)"/i.exec(block);
    const jobPath    = urlM ? urlM[1] : `/fr/ficheemploi/${id}`;
    const officialId = urlM ? urlM[2] : id;
    const urlOfficielle = jobPath.startsWith('http')
      ? jobPath
      : `${BASE_FR}${jobPath.startsWith('/') ? '' : '/'}${jobPath}`;

    jobs.push({
      id:               officialId,
      title:            decode(title),
      company:          decode(company)  || 'Employeur confidentiel',
      location:         decode(locText)  || 'Canada',
      salary:           decode(salary)   || null,
      description_short: dateText
        ? `Publié ${decode(dateText)}`
        : 'Offre récente — Guichet Emplois Canada',
      url_officielle:   urlOfficielle,
    });

    if (jobs.length >= 25) break;
  }

  return jobs;
}

// ── Route GET /api/jobs ───────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const q        = (url.searchParams.get('q')        || '').trim();
  const location = (url.searchParams.get('location') || '').trim();

  const headers = {
    'Content-Type':                'application/json',
    'Cache-Control':               'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const html = await fetchGuichet(q, location);
    let jobs   = parseJobs(html);

    // Fallback : retry sans localisation si aucun résultat
    if (jobs.length === 0 && location) {
      const html2 = await fetchGuichet(q, '');
      jobs = parseJobs(html2);
    }

    return new Response(JSON.stringify(jobs), { headers });

  } catch (err: any) {
    console.error('[/api/jobs] Erreur scrape:', err?.message);
    return new Response(
      JSON.stringify({ error: err?.message || 'scrape_failed', jobs: [] }),
      { status: 500, headers }
    );
  }
};
