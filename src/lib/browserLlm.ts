/** Tarayıcıda çalışan ücretsiz LLM — master prompt katmanlı fallback: WebLLM → window.ai */

import { AIKOC_WEBLLM_MODEL } from './aikocMasterPrompt';

type ProgressCallback = (text: string) => void;

type WindowAiAssistant = {
  prompt: (text: string) => Promise<string>;
};

type WindowAi = {
  assistant?: {
    create: (opts?: { systemPrompt?: string }) => Promise<WindowAiAssistant>;
  };
};

declare global {
  interface Window {
    ai?: WindowAi;
  }
}

let enginePromise: Promise<{ chat: { completions: { create: (opts: unknown) => Promise<{ choices: { message?: { content?: string } }[] }> } } }> | null =
  null;
let lastError: string | null = null;
let activeMode: 'webllm' | 'window-ai' | null = null;

export function getBrowserLlmMode(): typeof activeMode {
  return activeMode;
}

export function isBrowserLlmSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env.VITE_BROWSER_LLM_ENABLED === 'false') return false;
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return true;
  return Boolean(window.ai?.assistant);
}

export function getBrowserLlmLastError(): string | null {
  return lastError;
}

async function tryWebLlm(opts: {
  systemPrompt: string;
  userText: string;
  onProgress?: ProgressCallback;
}): Promise<string | null> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;

  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    if (!enginePromise) {
      enginePromise = CreateMLCEngine(AIKOC_WEBLLM_MODEL, {
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

    const text = reply.choices[0]?.message?.content?.trim();
    if (!text) return null;
    activeMode = 'webllm';
    return text;
  } catch (err) {
    console.warn('[BrowserLLM/WebLLM]', err);
    enginePromise = null;
    return null;
  }
}

async function tryWindowAi(opts: {
  systemPrompt: string;
  userText: string;
}): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ai?.assistant) return null;

  try {
    const session = await window.ai.assistant.create({ systemPrompt: opts.systemPrompt });
    const text = (await session.prompt(opts.userText))?.trim();
    if (!text) return null;
    activeMode = 'window-ai';
    return text;
  } catch (err) {
    console.warn('[BrowserLLM/window.ai]', err);
    return null;
  }
}

export async function askBrowserLlm(opts: {
  systemPrompt: string;
  userText: string;
  onProgress?: ProgressCallback;
}): Promise<string | null> {
  if (!isBrowserLlmSupported()) return null;

  const webllm = await tryWebLlm(opts);
  if (webllm) {
    lastError = null;
    return webllm;
  }

  const windowAi = await tryWindowAi(opts);
  if (windowAi) {
    lastError = null;
    return windowAi;
  }

  lastError = 'Tarayıcı modeli yüklenemedi (WebLLM ve window.ai kullanılamıyor)';
  return null;
}
