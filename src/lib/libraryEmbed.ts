/** Kütüphane okuyucusunda site içi gömülebilir kaynaklar */

const EMBEDDABLE_PATTERN =
  /gutenberg\.org|wikisource\.org|wikibooks\.org|openstax\.org|arxiv\.org|ncbi\.nlm\.nih\.gov|plos\.org|frontiersin\.org|plato\.stanford\.edu|quran\.com|sunnah\.com|diyanet\.gov\.tr|kuran\.diyanet\.gov\.tr/i;

export function canEmbedInReader(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url).hostname;
    return EMBEDDABLE_PATTERN.test(host) || EMBEDDABLE_PATTERN.test(url);
  } catch {
    return EMBEDDABLE_PATTERN.test(url);
  }
}

export function embeddableDomainsHint(): string {
  return 'Vikikaynak, Gutenberg, OpenStax, arXiv, PMC, PLOS, Frontiers, Stanford Encyclopedia, Quran.com, Sunnah.com, Diyanet';
}
