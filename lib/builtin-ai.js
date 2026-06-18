/** Tarayıcıda ücretsiz Gemini Nano — LanguageModel (yeni) ve window.ai (eski) */

const LM_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['tr', 'en'] }],
  expectedOutputs: [{ type: 'text', languages: ['tr', 'en'] }],
};

function getLanguageModelCtor() {
  if (typeof globalThis.LanguageModel === 'function') return globalThis.LanguageModel;
  if (typeof window !== 'undefined' && typeof window.LanguageModel === 'function') {
    return window.LanguageModel;
  }
  return null;
}

function mapHistoryToInitialPrompts(systemPrompt, history) {
  const prompts = [];
  const sys = String(systemPrompt || '').trim();
  if (sys) prompts.push({ role: 'system', content: sys });
  for (const turn of history || []) {
    const content = String(turn.content || turn.text || '').trim();
    if (!content) continue;
    const role = turn.role === 'assistant' || turn.role === 'model' ? 'assistant' : 'user';
    prompts.push({ role, content });
  }
  return prompts;
}

function progressLabel(loaded) {
  const pct = Math.round(Math.max(0, Math.min(1, loaded)) * 100);
  if (pct >= 100) return 'Gemini Nano yükleniyor…';
  if (pct > 0) return `Gemini Nano indiriliyor… %${pct}`;
  return 'Gemini Nano hazırlanıyor…';
}

async function promptWithLanguageModel({ systemPrompt, userText, history, onProgress }) {
  const LM = getLanguageModelCtor();
  if (!LM) return null;

  try {
    const availability = await LM.availability(LM_OPTIONS);
    if (availability === 'unavailable') return null;

    const initialPrompts = mapHistoryToInitialPrompts(systemPrompt, history);
    const session = await LM.create({
      ...LM_OPTIONS,
      initialPrompts: initialPrompts.length ? initialPrompts : undefined,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          onProgress?.(progressLabel(e.loaded));
        });
      },
    });

    const text = (await session.prompt(userText))?.trim();
    return text || null;
  } catch {
    return null;
  }
}

async function promptWithLegacyLanguageModel({ systemPrompt, userText, history, onProgress }) {
  const lm = window.ai?.languageModel;
  if (!lm?.create) return null;

  try {
    const caps = await lm.capabilities?.();
    if (caps?.available === 'no') return null;
    if (caps?.available === 'after-download') {
      onProgress?.('Gemini Nano indiriliyor…');
    }

    const session = await lm.create({
      systemPrompt,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          onProgress?.(progressLabel(e.loaded));
        });
      },
    });

    if (history?.length) {
      const turns = history
        .map((m) => {
          const content = String(m.content || m.text || '').trim();
          if (!content) return null;
          return {
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content,
          };
        })
        .filter(Boolean);
      turns.push({ role: 'user', content: userText });
      const text = (await session.prompt(turns))?.trim();
      return text || null;
    }

    const text = (await session.prompt(userText))?.trim();
    return text || null;
  } catch {
    return null;
  }
}

async function promptWithAssistant({ systemPrompt, userText }) {
  const assistant = window.ai?.assistant;
  if (!assistant?.create) return null;
  try {
    const session = await assistant.create({ systemPrompt });
    const text = (await session.prompt(userText))?.trim();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{ api: string|null, availability: string }>}
 */
export async function probeBuiltinAI() {
  const LM = getLanguageModelCtor();
  if (LM) {
    try {
      const availability = await LM.availability(LM_OPTIONS);
      return { api: 'LanguageModel', availability };
    } catch {
      return { api: 'LanguageModel', availability: 'error' };
    }
  }
  if (window.ai?.languageModel) {
    try {
      const caps = await window.ai.languageModel.capabilities?.();
      const map = { readily: 'available', 'after-download': 'downloadable', no: 'unavailable' };
      return { api: 'window.ai.languageModel', availability: map[caps?.available] || 'unknown' };
    } catch {
      return { api: 'window.ai.languageModel', availability: 'unknown' };
    }
  }
  if (window.ai?.assistant) {
    return { api: 'window.ai.assistant', availability: 'available' };
  }
  return { api: null, availability: 'unavailable' };
}

export function isBuiltinAISupported() {
  return Boolean(getLanguageModelCtor() || window.ai?.languageModel || window.ai?.assistant);
}

/**
 * @returns {Promise<string|null>}
 */
export async function promptBuiltinAI({ systemPrompt, userText, history = [], onProgress }) {
  if (typeof window === 'undefined') return null;
  const text = String(userText || '').trim();
  if (!text) return null;

  onProgress?.('Gemini Nano düşünüyor…');

  const fromNew = await promptWithLanguageModel({ systemPrompt, userText: text, history, onProgress });
  if (fromNew) {
    onProgress?.('');
    return fromNew;
  }

  const fromLegacy = await promptWithLegacyLanguageModel({
    systemPrompt,
    userText: text,
    history,
    onProgress,
  });
  if (fromLegacy) {
    onProgress?.('');
    return fromLegacy;
  }

  const fromAssistant = await promptWithAssistant({ systemPrompt, userText: text });
  onProgress?.('');
  return fromAssistant;
}
