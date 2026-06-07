import type { LibraryCategory, LibraryItem, LibraryReadFormat } from '../data/libraryCatalog';
import { getAllLibraryItems } from './library';
import { translateManyToTurkish } from './translate';

export type DiscoveredResource = {
  title: string;
  summary: string;
  author: string;
  url: string;
  format: LibraryReadFormat;
  category: LibraryCategory;
  language: string;
  source: string;
  tags: string[];
};

const TRUSTED_READ_HOSTS =
  /gutenberg\.org|wikisource\.org|wikibooks\.org|openstax\.org|arxiv\.org|ncbi\.nlm\.nih\.gov|plos\.org|frontiersin\.org|plato\.stanford\.edu|doaj\.org|europepmc\.org|hal\.science|zenodo\.org/i;

type OpenAlexWork = {
  id: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  authorships?: { author?: { display_name?: string } }[];
  open_access?: { oa_url?: string; is_oa?: boolean };
  primary_location?: {
    landing_page_url?: string;
    pdf_url?: string;
    source?: { display_name?: string };
  };
  type?: string;
};

type GutendexBook = {
  id: number;
  title: string;
  authors: { name: string }[];
  formats: Record<string, string>;
  languages: string[];
  subjects: string[];
};

function existingUrls(): Set<string> {
  return new Set(getAllLibraryItems().map((i) => i.url.toLowerCase()));
}

function pickReadUrl(work: OpenAlexWork): string | null {
  const oa = work.open_access?.oa_url;
  const pdf = work.primary_location?.pdf_url;
  const landing = work.primary_location?.landing_page_url;
  const candidate = pdf || oa || landing;
  if (!candidate) return null;
  if (!TRUSTED_READ_HOSTS.test(candidate) && !/\.pdf(\?|$)/i.test(candidate)) {
    if (landing && TRUSTED_READ_HOSTS.test(landing)) return landing;
    if (oa && TRUSTED_READ_HOSTS.test(oa)) return oa;
    return null;
  }
  return candidate;
}

function formatFromUrl(url: string): LibraryReadFormat {
  if (/\.pdf(\?|$)/i.test(url)) return 'pdf';
  if (/\.epub/i.test(url)) return 'epub';
  return 'html';
}

function mapOpenAlexWork(work: OpenAlexWork, category: LibraryCategory): DiscoveredResource | null {
  const url = pickReadUrl(work);
  if (!url) return null;

  const title = (work.title ?? work.display_name ?? 'Başlıksız yayın').replace(/<[^>]+>/g, '');
  const author =
    work.authorships
      ?.slice(0, 3)
      .map((a) => a.author?.display_name)
      .filter(Boolean)
      .join(', ') || 'Bilinmiyor';
  const source = work.primary_location?.source?.display_name ?? 'OpenAlex';

  return {
    title,
    summary: `${source} üzerinden açık erişimli ${work.type === 'book' ? 'kitap' : 'makale'}. Yıl: ${work.publication_year ?? '—'}.`,
    author,
    url,
    format: formatFromUrl(url),
    category,
    language: 'EN',
    source: `OpenAlex · ${source}`,
    tags: ['açık erişim', 'ücretsiz', work.type === 'book' ? 'kitap' : 'makale'],
  };
}

async function searchOpenAlex(query: string, category: LibraryCategory, perPage = 5): Promise<DiscoveredResource[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('search', query);
  url.searchParams.set('filter', 'is_oa:true,has_fulltext:true');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('sort', 'relevance_score:desc');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  const seen = existingUrls();
  const out: DiscoveredResource[] = [];

  for (const work of data.results ?? []) {
    const mapped = mapOpenAlexWork(work as OpenAlexWork, category);
    if (!mapped || seen.has(mapped.url.toLowerCase())) continue;
    seen.add(mapped.url.toLowerCase());
    out.push(mapped);
  }
  return out;
}

async function searchGutenberg(query: string, category: LibraryCategory): Promise<DiscoveredResource[]> {
  const url = new URL('https://gutendex.com/books/');
  url.searchParams.set('search', query);
  url.searchParams.set('languages', 'en,tr,de,fr');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  const seen = existingUrls();
  const out: DiscoveredResource[] = [];

  for (const book of (data.results ?? []) as GutendexBook[]) {
    const readUrl =
      book.formats['text/html'] ||
      book.formats['application/pdf'] ||
      book.formats['application/epub+zip'] ||
      Object.values(book.formats)[0];
    if (!readUrl || seen.has(readUrl.toLowerCase())) continue;
    seen.add(readUrl.toLowerCase());

    out.push({
      title: book.title,
      summary: (book.subjects ?? []).slice(0, 3).join(' · ') || 'Project Gutenberg kamu malı eser.',
      author: book.authors.map((a) => a.name).join(', ') || 'Bilinmiyor',
      url: readUrl,
      format: formatFromUrl(readUrl),
      category,
      language: (book.languages?.[0] ?? 'en').toUpperCase(),
      source: 'Project Gutenberg',
      tags: ['ücretsiz', 'klasik', 'gutenberg', ...(book.subjects ?? []).slice(0, 2).map((s) => s.toLowerCase())],
    });
  }
  return out;
}

/** İngilizce keşifleri site diline (Türkçe) çevirir */
export async function localizeDiscoveredResources(
  items: DiscoveredResource[],
  siteLanguage: 'tr' | 'en' = 'tr',
): Promise<DiscoveredResource[]> {
  if (siteLanguage === 'en') return items;

  const toTranslate = items.filter((i) => i.language !== 'TR');
  if (toTranslate.length === 0) return items;

  const titles = toTranslate.map((i) => i.title);
  const summaries = toTranslate.map((i) => i.summary);
  const [titlesTr, summariesTr] = await Promise.all([
    translateManyToTurkish(titles, 2, 320),
    translateManyToTurkish(summaries, 2, 350),
  ]);

  const trMap = new Map<string, { title: string; summary: string }>();
  toTranslate.forEach((item, idx) => {
    trMap.set(item.url, {
      title: titlesTr[idx] ?? item.title,
      summary: summariesTr[idx] ?? item.summary,
    });
  });

  return items.map((item) => {
    const tr = trMap.get(item.url);
    if (!tr) return item;
    return {
      ...item,
      title: tr.title,
      summary: tr.summary,
      language: 'TR',
      tags: [...item.tags, 'çevrildi'],
    };
  });
}

export async function discoverFreeResources(
  query: string,
  options?: { category?: LibraryCategory; limit?: number },
): Promise<DiscoveredResource[]> {
  const category = options?.category ?? 'bilimsel_makale';
  const limit = options?.limit ?? 8;

  const [openAlex, gutenberg] = await Promise.all([
    searchOpenAlex(query, category, 6).catch(() => []),
    searchGutenberg(query, category === 'bilimsel_makale' ? 'roman' : category).catch(() => []),
  ]);

  const merged = [...openAlex, ...gutenberg].slice(0, limit);
  return localizeDiscoveredResources(merged);
}

export const CRAWL_TOPIC_ROTATION: { query: string; category: LibraryCategory }[] = [
  { query: 'mathematics education open textbook', category: 'ders_kitabi' },
  { query: 'physics chemistry biology textbook', category: 'ders_kitabi' },
  { query: 'turkish history literature', category: 'roman' },
  { query: 'psychology self improvement', category: 'bilimsel_yayin' },
  { query: 'computer science programming', category: 'ders_kitabi' },
  { query: 'philosophy ethics', category: 'ansiklopedi' },
  { query: 'medicine public health open access', category: 'bilimsel_makale' },
  { query: 'education pedagogy', category: 'bilimsel_yayin' },
];
