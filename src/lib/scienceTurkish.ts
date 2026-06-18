import { translateManyToTurkish, translateToTurkish } from './translate';

const TURKISH_CHARS = /[ğüşıöçĞÜŞİÖÇ]/;
const ENGLISH_MARKERS =
  /\b(the|and|of|in|for|with|using|study|studies|research|analysis|based|effect|effects|between|among|through|this|that|these|those|abstract|introduction|results|conclusion|method|methods|journal|article|paper|review|model|data|approach|significant|findings)\b/i;

/** Metin büyük ölçüde İngilizce görünüyorsa true */
export function needsTurkishTranslation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed === 'Özet mevcut değil.') return false;
  if (TURKISH_CHARS.test(trimmed)) return false;

  if (ENGLISH_MARKERS.test(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  const latinWords = words.filter((w) => /^[a-zA-Z][a-zA-Z\-'.]*$/.test(w)).length;
  return latinWords / words.length >= 0.65;
}

async function translateWithLlm(text: string): Promise<string | null> {
  const snippet = text.trim().slice(0, 1200);
  if (!snippet) return null;

  const systemPrompt =
    'Görevin: Verilen İngilizce bilim metnini Türkçeye çevir. Yalnızca Türkçe çeviriyi döndür; açıklama, İngilizce kelime veya ön ek ekleme. TDK imlasına uy.';

  try {
    const { isGroqLikelyEnabled, askGroq } = await import('./groqClient');
    if (isGroqLikelyEnabled()) {
      const groq = await askGroq({ systemPrompt, userText: snippet });
      if (groq && !needsTurkishTranslation(groq)) return groq.trim();
    }
  } catch {
    /* gemini yok */
  }

  try {
    const { isBrowserLlmSupported, askBrowserLlm } = await import('./browserLlm');
    if (isBrowserLlmSupported()) {
      const browser = await askBrowserLlm({ systemPrompt, userText: snippet });
      if (browser && !needsTurkishTranslation(browser)) return browser.trim();
    }
  } catch {
    /* browser llm yok */
  }

  return null;
}

/** Tek bir bilim metnini Türkçeye çevirir; gerekirse LLM ile tekrar dener */
export async function ensureTurkishScienceText(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (!needsTurkishTranslation(trimmed)) return trimmed;

  let translated = await translateToTurkish(trimmed);
  if (!needsTurkishTranslation(translated)) return translated;

  const llm = await translateWithLlm(trimmed);
  if (llm) return llm;

  return translated;
}

/** Başlık ve özet listelerini Türkçeleştirir */
export async function ensureTurkishScienceTexts(
  texts: string[],
  concurrency = 3,
  delayMs = 280,
): Promise<string[]> {
  const first = await translateManyToTurkish(texts, concurrency, delayMs);
  const out = [...first];

  const retryIndexes: number[] = [];
  first.forEach((t, i) => {
    if (needsTurkishTranslation(t) || needsTurkishTranslation(texts[i])) {
      retryIndexes.push(i);
    }
  });

  for (const idx of retryIndexes.slice(0, 8)) {
    out[idx] = await ensureTurkishScienceText(texts[idx]);
  }

  return out;
}

const KIND_TR: Record<string, string> = {
  makale: 'makale',
  kitap: 'kitap',
  yayin: 'yayın',
};

/** Çeviri başarısızsa Türkçe yer tutucu özet */
export function fallbackTurkishScienceSummary(field: string, kind: string): string {
  const kindLabel = KIND_TR[kind] ?? 'yayın';
  return `${field} alanında yayımlanan güncel bir ${kindLabel}. Ayrıntılı içerik için kaynağa bakabilirsin.`;
}

/** AI bilim gündemi metnini tamamen Türkçe yap */
export async function ensureTurkishScienceBrief(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const lines = trimmed.split('\n');
  const englishHeavy = lines.filter((l) => l.trim().length > 20 && needsTurkishTranslation(l)).length;
  const ratio = englishHeavy / Math.max(lines.length, 1);

  if (ratio < 0.25 && !needsTurkishTranslation(trimmed.slice(0, 400))) {
    return trimmed;
  }

  const llm = await translateWithLlm(
    `Aşağıdaki bilim gündemi özetini tamamen Türkçe yaz. İngilizce cümle bırakma.\n\n${trimmed.slice(0, 3500)}`,
  );
  if (llm) return llm;

  const translated = await translateToTurkish(trimmed.slice(0, 3500));
  return translated + (trimmed.length > 3500 ? '\n\n(Özet kısaltıldı.)' : '');
}
