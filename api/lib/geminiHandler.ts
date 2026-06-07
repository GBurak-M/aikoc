export type GeminiChatTurn = { role: 'user' | 'model'; text: string };

export type GeminiImageInput = {
  mimeType: string;
  base64: string;
};

export type GeminiGenerateInput = {
  systemPrompt: string;
  userText: string;
  history?: GeminiChatTurn[];
  image?: GeminiImageInput;
};

export type GeminiHandlerResult =
  | { ok: true; text: string; model: string }
  | { ok: false; status: number; error: string };

const DEFAULT_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

function buildContents(input: GeminiGenerateInput): Array<{ role: string; parts: unknown[] }> {
  const contents: Array<{ role: string; parts: unknown[] }> = [];

  for (const turn of input.history ?? []) {
    if (!turn.text?.trim()) continue;
    contents.push({
      role: turn.role,
      parts: [{ text: turn.text }],
    });
  }

  const userParts: unknown[] = [];
  if (input.image) {
    userParts.push({
      inlineData: {
        mimeType: input.image.mimeType,
        data: input.image.base64,
      },
    });
  }
  userParts.push({ text: input.userText });
  contents.push({ role: 'user', parts: userParts });

  return contents;
}

async function requestGemini(
  apiKey: string,
  model: string,
  input: GeminiGenerateInput,
): Promise<GeminiHandlerResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    contents: buildContents(input),
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 8192,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    return {
      ok: false,
      status: res.status,
      error: errText.slice(0, 400) || res.statusText,
    };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) {
    return { ok: false, status: 502, error: 'Gemini boş yanıt döndü' };
  }

  return { ok: true, text, model };
}

export async function generateWithGemini(
  input: GeminiGenerateInput,
  options?: { apiKey?: string; model?: string },
): Promise<GeminiHandlerResult> {
  const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY ?? '';
  if (!apiKey.trim()) {
    return { ok: false, status: 503, error: 'GEMINI_API_KEY tanımlı değil' };
  }

  const primary = options?.model ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const first = await requestGemini(apiKey, primary, input);
  if (first.ok) return first;

  if (primary === FALLBACK_MODEL) return first;

  const second = await requestGemini(apiKey, FALLBACK_MODEL, input);
  return second.ok ? second : first;
}
