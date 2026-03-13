// /api/jobs — Scrape Guichet Emplois Canada (guichetemplois.gc.ca)
// Le HTML est rendu côté serveur — pas besoin de render=true.
// Structure réelle confirmée par inspection directe du HTML.
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
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrait le texte d'un <li class="XXX"> ou <span class="XXX">
function liText(block: string, cls: string): string {
  const re = new RegExp(
    `<li[^>]+class="${cls}"[^>]*>([\\s\\S]*?)<\\/li>`,
    'i'
  );
  const m = re.exec(block);
  return m ? decode(m[1]) : '';
}

function spanText(block: string, cls: string): string {
  const re = new RegExp(
    `<span[^>]+class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/span>`,
    'i'
  );
  const m = re.exec(block);
  return m ? decode(m[1]) : '';
}

// ── Fetch HTML via ScraperAPI ─────────────────────────────────────────────────

async function fetchGuichet(q: string, location: string, page: string): Promise<string> {
  const params = new URLSearchParams({ sort: 'M', action: 'search' });
  if (q)        params.set('searchstring',   q);
  if (page)     params.set('page', page);
  if (location) params.set('locationstring', location);

  const target = `${BASE_FR}/jobsearch/rechercheemplois?${params.toString()}`;

  const scraperParams = new URLSearchParams({
    api_key: SCRAPER_KEY,
    url:     target,
    render:  'false',   // HTML rendu serveur — JS inutile
  });

  const res = await fetch(
    `https://api.scraperapi.com/?${scraperParams.toString()}`,
    { signal: AbortSignal.timeout(25_000) }
  );
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status}`);
  return res.text();
}

// ── Parser HTML ───────────────────────────────────────────────────────────────
// Structure réelle :
//   <article id="article-49101828" class="action-buttons">
//     <a href="/rechercheemplois/offredemploi/49101828;jsessionid=…" class="resultJobItem">
//       <h3 class="title"><span class="noctitle"> Titre du poste </span></h3>
//       <ul class="list-unstyled">
//         <li class="date">13 mars 2026</li>
//         <li class="business">Nom entreprise</li>
//         <li class="location">…Ville (PROV)</li>
//         <li class="salary">…21,00 $ de l'heure</li>
//       </ul>
//     </a>
//   </article>

function parseJobs(html: string): object[] {
  const jobs: object[] = [];

  // Trouve chaque article d'offre d'emploi par son id="article-NNNNN"
  const articleRe = /<article\s+id="article-(\d+)"[^>]*>([\s\S]*?)<\/article>/gi;
  let m: RegExpExecArray | null;

  while ((m = articleRe.exec(html)) !== null) {
    const jobId = m[1];
    const block = m[2];

    // Titre
    const title = spanText(block, 'noctitle');
    if (!title) continue;

    // Champs de la liste <ul>
    const date     = liText(block, 'date');
    const company  = liText(block, 'business');
    const locRaw   = liText(block, 'location');
    const salRaw   = liText(block, 'salary');

    // Nettoyer le salaire (enlever "Salaire :")
    const salary = salRaw.replace(/^salaire\s*:\s*/i, '').trim() || null;

    jobs.push({
      id:               jobId,
      title,
      company:          company  || 'Employeur confidentiel',
      location:         locRaw   || 'Canada',
      salary,
      description_short: date ? `Publié ${date}` : 'Offre récente — Guichet Emplois',
      url_officielle:   `${BASE_FR}/rechercheemplois/offredemploi/${jobId}`,
    });

    if (jobs.length >= 25) break;
  }

  return jobs;
}

// ── Route GET /api/jobs ───────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const q        = (url.searchParams.get('q')        || '').trim();
  const location = (url.searchParams.get('location') || '').trim();
  const page     = (url.searchParams.get('page')     || '1').trim();
  const debug    = url.searchParams.get('debug') === '1';

  const headers = {
    'Content-Type':                'application/json',
    'Cache-Control':               'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const html = await fetchGuichet(q, location, page);

    // Mode debug : retourne le HTML brut (8 ko) pour inspecter la structure
    if (debug) {
      const idx   = html.indexOf('resultJobItem');
      const start = Math.max(0, idx - 100);
      return new Response(
        JSON.stringify({ snippet: html.slice(start, start + 5000), length: html.length }),
        { headers }
      );
    }

    let jobs = parseJobs(html);

    // Fallback sans localisation si 0 résultat et page = 1
    if (jobs.length === 0 && location && page === '1') {
      const html2 = await fetchGuichet(q, '', page);
      jobs = parseJobs(html2);
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
