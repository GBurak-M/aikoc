import { generateWithGemini, type GeminiGenerateInput } from '../server/geminiHandler';

export default async function handler(
  req: { method?: string; body?: GeminiGenerateInput },
  res: {
    status: (code: number) => { json: (body: unknown) => void };
    setHeader: (name: string, value: string) => void;
  },
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST desteklenir' });
  }

  const body = req.body;
  if (!body?.userText?.trim() || !body?.systemPrompt?.trim()) {
    return res.status(400).json({ error: 'systemPrompt ve userText gerekli' });
  }

  const result = await generateWithGemini(body);

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ text: result.text, model: result.model });
}
