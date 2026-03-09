import type { APIRoute } from 'astro';
import { XMLParser } from 'fast-xml-parser';

export const prerender = false;

const json = (data: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });

type OfficialNewsItem = {
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  source: 'canada.ca';
};

function clampInt(value: unknown, def: number, min: number, max: number): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function asText(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const obj = v as any;
    if (typeof obj['#text'] === 'string') return obj['#text'];
    if (typeof obj['#cdata'] === 'string') return obj['#cdata'];
  }
  return String(v ?? '');
}

function pickAtomLink(entryLink: any): string {
  if (!entryLink) return '';
  const links = Array.isArray(entryLink) ? entryLink : [entryLink];
  const alt = links.find((l: any) => String(l?.['@_rel'] ?? '').toLowerCase() === 'alternate');
  const best = alt ?? links[0];
  return String(best?.['@_href'] ?? '').trim();
}

function buildFeedUrl(lang: 'fr' | 'en', pick: number): string {
  const params = new URLSearchParams();
  // Thème: Immigration & citizenship (source officielle Canada News Centre)
  params.set('topic', 'immigrationandcitizenship');
  params.set('sort', 'publishedDate');
  params.set('orderBy', 'desc');
  params.set('pick', String(pick));
  params.set('format', 'atom');
  params.set('atomtitle', lang === 'fr' ? 'Immigration et citoyenneté' : 'Immigration and citizenship');

  return `https://api.io.canada.ca/io-server/gc/news/${lang}/v2?${params.toString()}`;
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'fr') as 'fr' | 'en';
  const pick = clampInt(url.searchParams.get('pick'), 10, 1, 25);

  const feedUrl = buildFeedUrl(lang, pick);

  let xml: string;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Capitune/1.0 (+https://www.capitune.com)' },
      signal: controller.signal,
    });
    if (!res.ok) {
      return json({ error: `Feed indisponible (HTTP ${res.status})` }, 502);
    }
    xml = await res.text();
  } catch (e) {
    return json({ error: `Feed indisponible (${String(e)})` }, 502);
  } finally {
    clearTimeout(timeoutId);
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
    const parsed = parser.parse(xml) as any;

    const entriesRaw = parsed?.feed?.entry;
    const entries = Array.isArray(entriesRaw) ? entriesRaw : (entriesRaw ? [entriesRaw] : []);

    const items: OfficialNewsItem[] = entries
      .map((e: any) => {
        const title = asText(e?.title).trim();
        const summary = asText(e?.summary ?? e?.content ?? '').trim();
        const publishedAt = String(e?.published ?? e?.updated ?? '').trim() || undefined;
        const link = pickAtomLink(e?.link);
        return {
          title,
          url: link,
          summary: summary || undefined,
          publishedAt,
          source: 'canada.ca' as const,
        };
      })
      .filter((i: OfficialNewsItem) => i.title && i.url);

    // Cache courte: ça bouge, mais pas à la seconde
    return json(
      { items, sourceUrl: feedUrl },
      200,
      { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    );
  } catch (e) {
    return json({ error: `Parsing impossible (${String(e)})` }, 500);
  }
};
