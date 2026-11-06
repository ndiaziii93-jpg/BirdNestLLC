// Firecrawl gives the logo finder eyes on the live web: it renders a company's page the way a
// browser does (so logos drawn by JavaScript are seen), reports the page's brand logo, and searches
// the web for a company's official site. Used when FIRECRAWL_API_KEY is set; otherwise the finder
// reads pages with a plain request.
const API = 'https://api.firecrawl.dev/v2';

export const hasFirecrawl = () => !!process.env.FIRECRAWL_API_KEY;

async function call<T>(path: string, body: unknown, timeoutMs: number): Promise<T | null> {
  try {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

interface ScrapeResponse {
  success?: boolean;
  data?: {
    rawHtml?: string;
    metadata?: { url?: string; sourceURL?: string; statusCode?: number };
    branding?: { logo?: string | null; images?: { logo?: string | null; favicon?: string | null; ogImage?: string | null } | null } | null;
  };
}

export interface SitePage { html: string; finalUrl: string; brandLogos: string[] }

/** The live page, rendered, plus the brand logo Firecrawl detected on it. */
export async function scrapeSite(url: string): Promise<SitePage | null> {
  const j = await call<ScrapeResponse>('/scrape', { url, formats: ['rawHtml', 'branding'], onlyMainContent: false, maxAge: 0, timeout: 30000 }, 40000);
  const d = j?.data;
  if (!j?.success || !d) return null;
  const b = d.branding || null;
  const brandLogos = [b?.logo, b?.images?.logo].filter((x): x is string => !!x && /^https?:\/\//i.test(x));
  return { html: d.rawHtml || '', finalUrl: d.metadata?.url || d.metadata?.sourceURL || url, brandLogos: [...new Set(brandLogos)] };
}

export interface SearchHit { url: string; title: string; description: string }

/** Web search results for a query. */
export async function searchWeb(query: string, limit = 6): Promise<SearchHit[]> {
  const j = await call<{ success?: boolean; data?: { web?: { url?: string; title?: string; description?: string }[] } }>('/search', { query, limit }, 30000);
  return (j?.data?.web || []).filter(h => h.url).map(h => ({ url: h.url!, title: h.title || '', description: h.description || '' }));
}

/** Sites that list companies rather than being the company's own site. */
export const DIRECTORY = /(^|\.)(linkedin|wikipedia|crunchbase|bloomberg|pitchbook|zoominfo|dnb|facebook|twitter|x|instagram|youtube|glassdoor|indeed|craft|cbinsights|globaldata|tracxn|owler|rocketreach|clinicaltrials|fiercebiotech|biospace|businesswire|prnewswire|globenewswire|reuters|yahoo|google)\.[a-z.]+$/i;
