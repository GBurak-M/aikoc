/** Vercel sunucu fonksiyonu — Groq API (öğretmen modu, OpenAI uyumlu) */

import { generateWithGroq } from '../server/lib/groqHandler.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const hasKey = Boolean(process.env.GROQ_API_KEY?.trim());
    return res.status(200).json({ ok: hasKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST desteklenir' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body?.userText?.trim() || !body?.systemPrompt?.trim()) {
    return res.status(400).json({ error: 'systemPrompt ve userText gerekli' });
  }

  const result = await generateWithGroq(body);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ text: result.text, model: result.model });
}
