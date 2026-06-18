/** Sunucu tarafı Groq — AI Sohbet ve Soru Çöz (öğretmen modu) */

let groqAvailableCache = null;

export async function isGroqAvailable() {
  if (groqAvailableCache !== null) return groqAvailableCache;
  try {
    const res = await fetch('/api/groq', { credentials: 'same-origin' });
    if (!res.ok) {
      groqAvailableCache = false;
      return false;
    }
    const data = await res.json().catch(() => ({}));
    groqAvailableCache = Boolean(data.ok);
    return groqAvailableCache;
  } catch {
    groqAvailableCache = false;
    return false;
  }
}

export function resetGroqAvailabilityCache() {
  groqAvailableCache = null;
}

function friendlyGroqError(status, raw) {
  const msg = String(raw || '');
  if (status === 503 && /GROQ_API_KEY/i.test(msg)) {
    return 'Yapay zeka sunucusu yapılandırılmamış (GROQ_API_KEY). Yönetici API anahtarını eklemeli.';
  }
  if (status === 429 || /quota|rate.?limit|429/i.test(msg)) {
    return 'Groq API hız sınırına ulaşıldı. Bir süre sonra tekrar dene.';
  }
  if (status >= 500) {
    return 'Yapay zeka sunucusu geçici olarak yanıt vermiyor. Birkaç dakika sonra tekrar dene.';
  }
  return null;
}

/**
 * @returns {Promise<{ text: string|null, error: string|null, status: number|null }>}
 */
export async function askGroq({ systemPrompt, userText, history = [] }) {
  const sys = String(systemPrompt || '').trim();
  const text = String(userText || '').trim();
  if (!sys || !text) return { text: null, error: null, status: null };

  try {
    const res = await fetch('/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ systemPrompt: sys, userText: text, history }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const friendly = friendlyGroqError(res.status, data.error);
      return { text: null, error: friendly || data.error || 'Groq isteği başarısız.', status: res.status };
    }
    return { text: data.text?.trim() || null, error: null, status: res.status };
  } catch {
    return { text: null, error: 'Ağ hatası: Groq API’ye ulaşılamadı.', status: null };
  }
}
