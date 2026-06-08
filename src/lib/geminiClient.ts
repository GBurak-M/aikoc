import type { GeminiChatTurn, GeminiGenerateInput } from '../../api/lib/geminiHandler';

export type { GeminiChatTurn };

const GEMINI_SKIP_KEY = 'aikoc_gemini_skip_until';

function markGeminiUnavailable(hours = 24): void {
  try {
    sessionStorage.setItem(GEMINI_SKIP_KEY, String(Date.now() + hours * 60 * 60 * 1000));
  } catch {
    /* private mode */
  }
}

function isGeminiTemporarilySkipped(): boolean {
  try {
    const until = Number(sessionStorage.getItem(GEMINI_SKIP_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

export async function askGemini(input: GeminiGenerateInput): Promise<string | null> {
  if (!isGeminiLikelyEnabled()) return null;

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (res.status === 503) {
      markGeminiUnavailable(6);
      return null;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn('[Gemini]', res.status, errBody);
      if (res.status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(errBody)) {
        markGeminiUnavailable(24);
      }
      return null;
    }

    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err) {
    console.warn('[Gemini] istek hatası', err);
    return null;
  }
}

export function isGeminiLikelyEnabled(): boolean {
  if (import.meta.env.VITE_GEMINI_ENABLED === 'false') return false;
  return !isGeminiTemporarilySkipped();
}
