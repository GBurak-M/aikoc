const CACHE_PREFIX = 'aikoc_tr_v1_';
const MAX_CHUNK = 450;

function cacheKey(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${CACHE_PREFIX}${h.toString(36)}_${text.length}`;
}

function readCache(text: string): string | null {
  try {
    return localStorage.getItem(cacheKey(text));
  } catch {
    return null;
  }
}

function writeCache(text: string, translated: string): void {
  try {
    localStorage.setItem(cacheKey(text), translated);
  } catch {
    /* quota */
  }
}

/** MyMemory ücretsiz EN→TR çeviri (önbellekli) */
export async function translateToTurkish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const cached = readCache(trimmed);
  if (cached) return cached;

  const chunk = trimmed.slice(0, MAX_CHUNK);
  const suffix = trimmed.length > MAX_CHUNK ? '…' : '';

  try {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', chunk);
    url.searchParams.set('langpair', 'en|tr');
    const res = await fetch(url.toString());
    if (!res.ok) return trimmed;
    const data = await res.json();
    const translated: string = data?.responseData?.translatedText ?? chunk;
    const result = translated + suffix;
    writeCache(trimmed, result);
    return result;
  } catch {
    return trimmed;
  }
}

export async function translateManyToTurkish(
  texts: string[],
  concurrency = 3,
  delayMs = 280,
): Promise<string[]> {
  const out: string[] = new Array(texts.length);
  for (let i = 0; i < texts.length; i += concurrency) {
    const slice = texts.slice(i, i + concurrency);
    const translated = await Promise.all(slice.map((t) => translateToTurkish(t)));
    slice.forEach((_, j) => {
      out[i + j] = translated[j];
    });
    if (i + concurrency < texts.length) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return out;
}
