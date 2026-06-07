import type { GeminiChatTurn, GeminiGenerateInput } from '../../api/lib/geminiHandler';

export type { GeminiChatTurn };

export async function askGemini(input: GeminiGenerateInput): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (res.status === 503) return null;

    if (!res.ok) {
      console.warn('[Gemini]', res.status, await res.text().catch(() => ''));
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
  return import.meta.env.VITE_GEMINI_ENABLED !== 'false';
}
