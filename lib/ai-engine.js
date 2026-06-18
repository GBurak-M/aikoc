/** ROTA AI motoru — Groq öğretmen modu → kural tabanlı yedek */

import { askGroq, isGroqAvailable } from './groq-api.js';

export const DEFAULT_SYSTEM_PROMPT = `
Sen ROTA AI eğitim platformunun yapay zeka öğretmenisin. Marka: yolunu bul, hedefe yapay zeka ile var.

DİL VE ANLATIM KURALLARI (İHLAL EDİLEMEZ):
1. GRAMER: Türkçe dilbilgisi kurallarına tam uyum. Özne-yüklem uyumu, fiil
   çekimleri, ek yazımı hatasız olmalı.
2. YAZI İMLASI: TDK İmla Kılavuzu'na göre noktalama, büyük harf, bağlaçlar
   doğru kullanılmalı. "de/da" ve "ki" bağlaçları ayrı yazılmalı.
3. HİTABET: Öğrenciye saygılı, sıcak ama resmi bir dil kullan.
   "Siz" değil "sen" kullan (genç kitleye hitap). Samimi ama düzgün ol.
4. ANLATIM ÜSLUBU:
   - Konuyu kısa cümlelerle açıkla (max 20 kelime/cümle)
   - Soyut kavramları somut örneklerle destekle
   - Adım adım (1-2-3 şeklinde) yönlendirme yap
   - Türkçe terimler tercih et; yabancı terim kullanırken parantez içi
     Türkçe karşılığını ver
5. YASAKLAR:
   - İngilizce kelime karıştırma (bro, ok, cool, btw yasak)
   - Aşırı ünlem (!!!!), emoji yığma
   - "Tabii ki!", "Elbette!", "Harika soru!" gibi boş övgüler
   - Yanlış bilgi vermek yerine "Bu konuyu bilmiyorum, kaynağa bak" de

ÖĞRETİM İLKELERİ:
- Soru sormayı teşvik et
- Hatayı kınamak yerine doğruyu göster
- Övgüyü hak edildiğinde, yerinde kullan
- Motivasyon için gerçekçi, ölçülebilir hedefler ver

KONU ALANLARI: Matematik, Türkçe, Edebiyat, Fizik, Kimya, Biyoloji,
Tarih, Coğrafya, Felsefe, İngilizce, Bilgisayar.
`.trim();

export class AIEngine {
  constructor() {
    this.ready = false;
    this.mode = 'rule-based';
    this.progressText = '';
    this._listeners = new Set();
    this.groqConfigured = false;
  }

  onProgress(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _emitProgress(text) {
    this.progressText = text;
    this._listeners.forEach((cb) => cb(text));
  }

  getStatusLabel() {
    if (this.progressText) return this.progressText;
    if (!this.ready) return 'Hazırlanıyor';
    if (this.mode === 'groq-api') return 'Groq öğretmen modu';
    if (this.mode === 'offline') return 'Çevrimdışı öğretmen modu';
    if (!this.groqConfigured) return 'Groq yapılandırılmamış';
    return 'Hazır';
  }

  async init() {
    this._emitProgress('');
    const groqOk = await isGroqAvailable();
    this.groqConfigured = groqOk;
    this.mode = groqOk ? 'groq-api' : 'offline';
    this.ready = true;
  }

  _mapHistory(history) {
    return (history || [])
      .map((turn) => ({
        role: turn.role === 'assistant' || turn.role === 'model' ? 'assistant' : 'user',
        text: String(turn.content || turn.text || '').trim(),
      }))
      .filter((turn) => turn.text);
  }

  async generate(prompt, systemPrompt = '', history = []) {
    const sys = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const userText = String(prompt || '').trim();
    if (!userText) return 'Bir soru veya konu yazarsan yardımcı olurum.';

    if (await isGroqAvailable()) {
      this.groqConfigured = true;
      this._emitProgress('ROTA AI düşünüyor…');
      const { text, error } = await askGroq({
        systemPrompt: sys,
        userText,
        history: this._mapHistory(history),
      });
      this._emitProgress('');
      if (text) {
        this.mode = 'groq-api';
        return text;
      }
      if (error) {
        this.mode = 'offline';
        return error;
      }
    }

    this.groqConfigured = false;
    this.mode = 'offline';
    this._emitProgress('');
    return this.ruleBasedResponse(userText);
  }

  ruleBasedResponse(prompt) {
    const lower = prompt.toLowerCase().trim();

    if (/^(merhaba|selam|sa|hey|hello|hi|günaydın|gunaydin|iyi akşam|iyi aksam|iyi günler|iyi gunler|nasılsın|nasilsin|naber|ne haber|hosgeldin|hoş geldin)\b/.test(lower)) {
      return 'Merhaba! Ben ROTA AI öğretmenin. Ders konularında soru sorabilir, konu özetleyebilir veya sınav planı isteyebilirsin. Bugün ne üzerinde çalışmak istersin?';
    }

    if (/teşekkür|tesekkur|sağol|sagol|eyvallah|thanks/.test(lower)) {
      return 'Rica ederim. Başka bir konuda yardıma ihtiyacın olursa yazman yeterli.';
    }

    if (/uyku|uykum|yorgun|uyuyam/.test(lower)) {
      return 'Yorgun hissediyorsan kısa bir mola ver. 20 dakika dinlen, sonra 25 dakikalık tek bir derse odaklan. Uyku öncelikse çalışmayı yarına bırakmak da doğru bir tercih.';
    }

    if (
      /karekök|karekok|√/.test(lower) ||
      lower.includes('matematik') ||
      lower.includes('denklem') ||
      lower.includes('türev') ||
      lower.includes('tueriv') ||
      lower.includes('integral') ||
      lower.includes('limit') ||
      lower.includes('logaritma') ||
      lower.includes('trigonometri') ||
      lower.includes('geometri') ||
      lower.includes('olasılık') ||
      lower.includes('olasilik') ||
      lower.includes('fonksiyon')
    ) {
      return this.mathResponse(prompt);
    }

    if (lower.includes('fizik') || lower.includes('kuvvet') || lower.includes('enerji')) {
      return '1. Verilen büyüklükleri yaz.\n2. İlgili fizik yasasını seç (Newton, enerji korunumu vb.).\n3. Birimleri kontrol et.\n4. Sonucu yorumla.\nBelirli bir soru metni paylaşırsan adım adım çözerim.';
    }

    if (lower.includes('türkçe') || lower.includes('paragraf') || lower.includes('yazım')) {
      return 'Paragraf sorularında önce ana düşünceyi bul, sonra yardımcı düşünceleri ayırt et. Yazım kurallarında "de/da" ve "ki" bağlaçlarına dikkat et.';
    }

    if (lower.includes('sınav') || lower.includes('yks') || lower.includes('lgs') || lower.includes('kpss')) {
      return 'Haftalık plan: zayıf derse günde 45 dk, güçlü derse 25 dk tekrar. Haftada bir tam deneme çöz; yanlışlarını konu başlığıyla kaydet.';
    }

    if (!this.groqConfigured) {
      return 'Tam yapay zeka yanıtı için sunucuda GROQ_API_KEY tanımlanmalı. Şimdilik temel çevrimdışı yanıtlar verebilirim — ders adını ve konuyu net yaz (ör. "9. sınıf fizik — kuvvet").';
    }

    return 'Sorunu aldım. Ders adını ve konuyu net yazarsan (ör. "9. sınıf fizik — kuvvet") adım adım anlatırım. Günlük sohbet için de buradayım.';
  }

  mathResponse(prompt) {
    const lower = String(prompt || '').toLowerCase();
    const sqrtMatch = lower.match(/(\d+)\s*(?:ün|in)?\s*karekökü|karekök\s*(?:ü|u)?\s*(\d+)|√\s*(\d+)/);
    const n = sqrtMatch ? Number(sqrtMatch[1] || sqrtMatch[2] || sqrtMatch[3]) : NaN;
    if (!Number.isNaN(n) && n >= 0) {
      const root = Math.sqrt(n);
      const exact = Number.isInteger(root);
      return [
        `**Karekök — ${n}**`,
        `1. Karekök, hangi sayının kendisiyle çarpılınca ${n} eder sorusunun cevabıdır.`,
        exact
          ? `2. ${n} = ${root} × ${root}, bu yüzden √${n} = **${root}**.`
          : `2. √${n} ≈ **${root.toFixed(4)}** (yaklaşık değer).`,
        exact ? '3. Sonuç tam sayıdır.' : '3. Tam kare değilse ondalık veya köklü biçimde bırakılabilir.',
      ].join('\n');
    }
    if (lower.includes('integral')) {
      return [
        '**İntegral — kısa özet (çevrimdışı yanıt)**',
        '1. İntegral, bir fonksiyonun altında kalan alanı veya birikimli değişimi hesaplar.',
        '2. Belirsiz integral: ∫f(x)dx = F(x) + C (F′(x) = f(x)).',
        '3. Temel kurallar: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ −1), ∫eˣ dx = eˣ + C.',
        '4. Belirli integral: ∫ₐᵇ f(x)dx = F(b) − F(a).',
        '5. Örnek: ∫(2x)dx = x² + C. Belirli: ∫₀¹ 2x dx = 1² − 0² = 1.',
        '',
        'Belirli bir soru veya sınıf seviyesi yazarsan adım adım çözerim.',
      ].join('\n');
    }
    return '1. Verilenleri listele.\n2. Uygun formülü seç.\n3. Adım adım hesapla.\n4. Sonucu birimle birlikte yaz.\nÖrnek denklem: 2x + 6 = 14 → 2x = 8 → x = 4.';
  }
}

let singleton = null;

export function getAIEngine() {
  if (!singleton) singleton = new AIEngine();
  return singleton;
}

export function resetAIEngine() {
  singleton = null;
  return getAIEngine();
}
