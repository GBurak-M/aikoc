import type { LibraryItem } from '../data/libraryCatalog';

export type LibraryContentResult =
  | { mode: 'html'; html: string; source: string }
  | { mode: 'iframe'; url: string; reason: string };

function wikiPageTitle(url: string): string | null {
  const m = url.match(/wikisource\.org\/wiki\/([^?#]+)/i) || url.match(/wikibooks\.org\/wiki\/([^?#]+)/i);
  return m ? decodeURIComponent(m[1].replace(/_/g, ' ')) : null;
}

function wikiApiHost(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    if (/wikisource\.org$/i.test(host) || /wikibooks\.org$/i.test(host)) return host;
  } catch {
    /* ignore */
  }
  return null;
}

async function fetchWikiHtml(url: string): Promise<string | null> {
  const host = wikiApiHost(url);
  const title = wikiPageTitle(url);
  if (!host || !title) return null;

  const api = `https://${host}/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&formatversion=2&format=json&origin=*`;
  const res = await fetch(api);
  if (!res.ok) return null;
  const data = (await res.json()) as { parse?: { text?: string } };
  return data.parse?.text ?? null;
}

async function fetchDirectHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return null;
    const raw = await res.text();
    if (raw.length < 200) return null;
    return raw;
  } catch {
    return null;
  }
}

function wrapFetchedHtml(body: string, title: string): string {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title>
<style>
body{font-family:Georgia,serif;line-height:1.65;padding:1rem 1.25rem;max-width:52rem;margin:0 auto;color:#1e293b;background:#fff}
img{max-width:100%;height:auto}
a{color:#4f46e5}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #e2e8f0;padding:.35rem .5rem}
</style></head><body>${body}</body></html>`;
}

/** Site içi okuyucu: iframe engellenen kaynaklarda içerik API ile yüklenir */
export async function resolveLibraryContent(item: LibraryItem): Promise<LibraryContentResult> {
  const wikiHtml = await fetchWikiHtml(item.url);
  if (wikiHtml) {
    return { mode: 'html', html: wrapFetchedHtml(wikiHtml, item.title), source: 'MediaWiki API' };
  }

  if (/gutenberg\.org|arxiv\.org\/html/i.test(item.url)) {
    const direct = await fetchDirectHtml(item.url);
    if (direct) {
      const bodyMatch = direct.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const inner = bodyMatch ? bodyMatch[1] : direct;
      return { mode: 'html', html: wrapFetchedHtml(inner, item.title), source: 'Doğrudan HTML' };
    }
  }

  return { mode: 'iframe', url: item.url, reason: 'Gömülü okuyucu' };
}
