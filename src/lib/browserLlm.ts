/** Tarayıcıda çalışan ücretsiz LLM (WebLLM) — API anahtarı gerekmez, WebGPU şart */

type ProgressCallback = (text: string) => void;

let enginePromise: Promise<{ chat: { completions: { create: (opts: unknown) => Promise<{ choices: { message?: { content?: string } }[] }> } } }> | null =
  null;
let lastError: string | null = null;

const DEFAULT_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

export function isBrowserLlmSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_BROWSER_LLM_ENABLED === 'false') return false;
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export function getBrowserLlmLastError(): string | null {
  return lastError;
}

export async function askBrowserLlm(opts: {
  systemPrompt: string;
  userText: string;
  onProgress?: ProgressCallback;
}): Promise<string | null> {
  if (!isBrowserLlmSupported()) return null;

  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    if (!enginePromise) {
      enginePromise = CreateMLCEngine(DEFAULT_MODEL, {
        initProgressCallback: (report: { text: string }) => {
          opts.onProgress?.(report.text);
        },
      });
    }

    const engine = await enginePromise;
    const reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userText },
      ],
      temperature: 0.65,
      max_tokens: 2048,
    });

    lastError = null;
    const text = reply.choices[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Tarayıcı modeli yüklenemedi';
    console.warn('[BrowserLLM]', lastError);
    enginePromise = null;
    return null;
  }
}
