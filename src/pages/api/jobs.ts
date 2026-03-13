// /api/jobs — Scrape réel du Guichet Emplois Canada (jobbank.gc.ca)
// via ScraperAPI (même clé que /api/dli.ts)
import type { APIRoute } from 'astro';

const SCRAPER_KEY = '624751bbf5ddc786bad6c4f31f50d41c';
const BASE_URL    = 'https://www.jobbank.gc.ca';

// ── Helpers HTML parser (regex — compatible Cloudflare Workers) ───────────────

function extractAttr(html: string, attr: string): string {
  const re = new RegExp(`${attr}="([^"]*)"`, 'i');
  const m  = re.exec(html);
  return m ? m[1].trim() : '';
}

function extractInner(html: string, ...classNames: string[]): string {
  for (const cls of classNames) {
    // Classe exacte ou parmi plusieurs
    const re = new RegExp(
      `class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/(?:span|li|div|p)>`,
      'i'
    );
    const m = re.exec(html);
    if (m) return m[1].replace(/<[^>]+>/g, '').trim();
  }
  return '';
}

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

function formatDate(raw: string): string {
  if (!raw) return '';
  // "2025-03-12" → "12 mars 2025"
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Scrape & parse ────────────────────────────────────────────────────────────

async function fetchJobBankHTML(q: string, location: string): Promise<string> {
  const target = `${BASE_URL}/jobsearch/jobsearch?searchstring=${encodeURIComponent(q)}&locationstring=${encodeURIComponent(location)}&sort=D&action=search`;
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(target)}&render=false`;

  const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status}`);
  return res.text();
}

function parseJobBankHTML(html: string): object[] {
  const jobs: object[] = [];

  // Chaque offre est dans un <article class="resultJobItem …" data-id="…">
  const articleRe = /<article[^>]+class="[^"]*resultJobItem[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  let match: RegExpExecArray | null;

  while ((match = articleRe.exec(html)) !== null) {
    const block = match[1];

    // ID
    const idM = /data-id="(\d+)"/.exec(match[0]);
    const id = idM ? idM[1] : Math.random().toString(36).slice(2);

    // Titre  — <span class="noctitle"> ou texte du <a href="/en/jobposting/…">
    let title = extractInner(block, 'noctitle');
    if (!title) {
      const linkM = /href="[^"]*jobposting[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      title = linkM ? linkM[1].replace(/<[^>]+>/g, '').trim() : '';
    }
    if (!title) continue;

    const company  = extractInner(block, 'business', 'resultJobItem-businessName');
    const location = extractInner(block, 'location', 'resultJobItem-location');
    const salary   = extractInner(block, 'salary',   'resultJobItem-salary');
    const dateRaw  = extractInner(block, 'date',     'resultJobItem-date');

    jobs.push({
      id,
      title:             decode(title),
      company:           decode(company)  || 'Employeur confidentiel',
      location:          decode(location) || 'Canada',
      salary:            decode(salary)   || null,
      description_short: dateRaw ? `Publié le ${formatDate(dateRaw)}` : 'Offre récente sur Guichet Emplois',
      url_officielle:    `${BASE_URL}/en/jobposting/${id}`,
    });

    if (jobs.length >= 25) break;
  }

  return jobs;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const q        = (url.searchParams.get('q') || '').trim();
  const location = (url.searchParams.get('location') || '').trim();

  const headers = {
    'Content-Type':  'application/json',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const html = await fetchJobBankHTML(q, location);
    const jobs = parseJobBankHTML(html);

    if (jobs.length === 0) {
      // Fallback : essoi sans localisation
      if (location) {
        const html2 = await fetchJobBankHTML(q, '');
        const jobs2 = parseJobBankHTML(html2);
        return new Response(JSON.stringify(jobs2), { headers });
      }
    }

    return new Response(JSON.stringify(jobs), { headers });
  } catch (err: any) {
    console.error('[/api/jobs] Erreur scrape:', err?.message);
    return new Response(JSON.stringify({ error: err?.message || 'scrape_failed' }), {
      status: 500,
      headers,
    });
  }
};
