export type GroqChatTurn = {
  role: 'user' | 'assistant';
  text: string;
};

export type GroqGenerateInput = {
  systemPrompt: string;
  userText: string;
  history?: GroqChatTurn[];
};

const GROQ_SKIP_KEY = 'aikoc_groq_skip_until';

function markGroqUnavailable(hours = 24): void {
  try {
    sessionStorage.setItem(GROQ_SKIP_KEY, String(Date.now() + hours * 60 * 60 * 1000));
  } catch {
    /* private mode */
  }
}

function isGroqTemporarilySkipped(): boolean {
  try {
    const until = Number(sessionStorage.getItem(GROQ_SKIP_KEY) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

export async function askGroq(input: GroqGenerateInput): Promise<string | null> {
  if (!isGroqLikelyEnabled()) return null;

  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (res.status === 503) {
      markGroqUnavailable(6);
      return null;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn('[Groq]', res.status, errBody);
      if (res.status === 429 || /quota|rate.?limit/i.test(errBody)) {
        markGroqUnavailable(24);
      }
      return null;
    }

    const data = (await res.json()) as { text?: string };
    return data.text?.trim() || null;
  } catch (err) {
    console.warn('[Groq] istek hatası', err);
    return null;
  }
}

export function isGroqLikelyEnabled(): boolean {
  if (import.meta.env.VITE_GROQ_ENABLED === 'false') return false;
  return !isGroqTemporarilySkipped();
}
