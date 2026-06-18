const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildMessages(input) {
  const messages = [{ role: 'system', content: String(input.systemPrompt || '').trim() }];
  for (const turn of input.history ?? []) {
    const text = String(turn.text || '').trim();
    if (!text) continue;
    const role = turn.role === 'assistant' || turn.role === 'model' ? 'assistant' : 'user';
    messages.push({ role, content: text });
  }
  messages.push({ role: 'user', content: String(input.userText || '').trim() });
  return messages;
}

async function requestGroq(apiKey, model, input) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: buildMessages(input),
      temperature: 0.4,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, error: errText.slice(0, 400) || res.statusText };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) return { ok: false, status: 502, error: 'Groq boş yanıt döndü' };
  return { ok: true, text, model: data.model || model };
}

export async function generateWithGroq(input, opts = {}) {
  const apiKey = (opts.apiKey ?? process.env.GROQ_API_KEY ?? '').trim();
  if (!apiKey) {
    return { ok: false, status: 503, error: 'GROQ_API_KEY tanımlı değil' };
  }

  const primary = (opts.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL).trim();
  const first = await requestGroq(apiKey, primary, input);
  if (first.ok) return first;
  if (primary === FALLBACK_MODEL) return first;
  const second = await requestGroq(apiKey, FALLBACK_MODEL, input);
  return second.ok ? second : first;
}

export { DEFAULT_MODEL, FALLBACK_MODEL };
