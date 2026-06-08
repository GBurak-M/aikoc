/** Günlük sohbet, duygu, iğneleme ve ders sorusu ayrımı */

export type MessageTone =
  | 'academic'
  | 'life_mood'
  | 'banter'
  | 'emotional'
  | 'casual'
  | 'social'
  | 'unknown';

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const ACADEMIC_SIGNAL =
  /\?|nedir|ne demek|nasil|nasıl|acikla|açıkla|anlat|coz|çöz|hesapla|formul|formül|deneme|net\b|tyt|ayt|sinav|sınav|konu\b|ders\b|soru\b|paragraf|turev|integral|logaritma|kimya|fizik|biyoloji|gramer|ceviri|çeviri|kutuphane|kitap|makale|plan yap|calisma plan|çalışma plan|osym|ösym|lgs|yks|kpss|ales|terim|tanim|tanım|kanun|teorem|ornek|örnek|farki|farkı/i;

const LIFE_MOOD =
  /uykum|uyuyorum|uyku\b|uykuya|gozlerim kapan|uyumam lazim|uyuyacagim|uyuyacağım|yorgunum|bitkin|tukendim|tükendim|enerjim yok|aciktim|açtım|karnim acik|karnım açık|usudum|üşüdüm|sicakim|sıcak|susadim|susadım|mutluyum|keyifli|canim sikildi|canım sıkıldı|bunaldim|bunaldım|yoruldum|gece gunduz|gece gündüz|erken kalk|gec yatt|geç yatt|kahve|mola ver|dinlen/i;

const BANTER =
  /yapay zeka|yapay zek|robot|sablon|şablon|komiksin|sacmal|saçmal|berbat|kotu cevap|kötü cevap|ne bilirsin|anlamiyorsun|anlamıyorsun|dalga|troll|igrenc|iğrenç|bok gibi|zayif ai|zayıf ai|aptal|salak|\bmal\b|\bbot\b|otomat|hep ayni|hep aynı|bos laf|boş laf|ne alaka|alakasi yok|alakası yok|sen de mi|koçmuş|kocmus|ignele|iğnele|dalga gec|dalga geç|ciddi misin|şaka mı|saka mi|inanamiyorum|inanamıyorum/i;

const EMOTIONAL =
  /stres|kayg|umutsuz|moralim bozuk|mutsuzum|uzgunum|üzgünüm|agladim|ağladım|agliyorum|ağlıyorum|korkuyorum|panik|depresif|bunaldim|bunaldım|sıkıldım|sikildim|vazgec|vazgeç|yeter artik|yeter artık/i;

/** Ders / sınav sorusu mu — günlük cümleleri dışarıda bırakır */
export function isClearlyAcademicQuery(message: string): boolean {
  const raw = message.trim();
  if (!raw || raw.length < 4) return false;
  const m = normalize(raw);

  if (LIFE_MOOD.test(m) || BANTER.test(m)) return false;
  if (EMOTIONAL.test(m) && !ACADEMIC_SIGNAL.test(m)) return false;

  if (ACADEMIC_SIGNAL.test(m)) return true;

  if (raw.length >= 12 && /\?/.test(raw)) return true;

  return false;
}

export function classifyMessageTone(message: string): MessageTone {
  const raw = message.trim();
  if (!raw) return 'unknown';
  const m = normalize(raw);

  if (BANTER.test(m)) return 'banter';
  if (LIFE_MOOD.test(m)) return 'life_mood';
  if (EMOTIONAL.test(m)) return 'emotional';
  if (ACADEMIC_SIGNAL.test(m)) return 'academic';

  if (raw.length <= 48 && !/\?/.test(raw) && !ACADEMIC_SIGNAL.test(m)) {
    return 'casual';
  }

  return 'unknown';
}

export type ToneReplyContext = {
  name: string;
  dailyTargetHours?: string;
};

/** Uyku, yorgunluk, iğneleme ve günlük sohbet — şablon ders yanıtı değil */
export function tryToneAwareReply(message: string, ctx: ToneReplyContext): string | null {
  const raw = message.trim();
  if (!raw) return null;
  const m = normalize(raw);
  const name = ctx.name?.trim() || 'arkadaşım';
  const tone = classifyMessageTone(raw);

  if (/uykum|uyuyorum|uyku\b|uykuya|gozlerim kapan|uyumam lazim|uyuyacagim/.test(m)) {
    return `${name}, uyku baskınmış — bu ders sorusu değil, insan hali. 😴

Beyin yorgunken zorlamak genelde verimsiz. İki seçenek:
• **15–20 dk şekerleme** + su, sonra hafif tekrar (paragraf veya 10 soru)
• **Bugün kapat** — uyku borcu yarın daha pahalıya patlar

Hangisine daha yakınsın? Zorlamak istemiyorsan "bugün kapatalım" yaz, planı yarın kurarız.`;
  }

  if (/yorgunum|bitkin|tukendim|tükendim|enerjim yok/.test(m)) {
    return `${name}, yorgunluk mesajı bu — anladım.

Kısa mola + su + 5 dakika esneme çoğu zaman toparlar. Hâlâ ağır geliyorsa bugün hedefi ${ctx.dailyTargetHours ?? '2'} saatten **45 dakikaya** indirelim; suçluluk değil, strateji.

Ne yordu seni — tempo mu, uyku mu, stres mi?`;
  }

  if (/aciktim|açtım|karnim acik|karnım açık/.test(m)) {
    return `${name}, aç karnına çalışmak zor. Önce kısa bir atıştırma, sonra devam — bu tamamen normal bir ihtiyaç, ders konusu değil. 🍎`;
  }

  if (/mutluyum|keyifli|iyi hissed|harika gün|super gün|süper gün/.test(m)) {
    return `${name}, enerji yüksek görünüyor — güzel! Bu modda 40–50 dakika odaklı blok iyi gider. Ne çalışmak istersin?`;
  }

  if (tone === 'banter' || /ne alaka|alakasi yok|hep ayni|sablon|robot|yapay zeka/.test(m)) {
    return `${name}, iğneleme modunda mıyız? 😄 Haklı olabilirsin — bazen şablon gibi konuşmuşumdur.

Ciddi bir ders sorusun varsa net yaz ("türev nedir", "plan yap"); sohbet etmek istiyorsan da öyle söyle — ikisini karıştırmayayım. Seni dinliyorum.`;
  }

  if (tone === 'emotional' || /stres|kayg|umutsuz|moralim bozuk|mutsuzum|uzgunum|üzgünüm|sıkıldım|sikildim|vazgec/.test(m)) {
    return `${name}, bunu hissetmen normal — bu bir sınav sorusu değil.

Bugün hedefi küçültmek bile ilerlemedir: 30–45 dakika odaklı çalışma veya tamamen dinlenmek. İkisi de meşru.

Ne seni en çok yordu — ders mi, tempo mu, başka bir şey mi?`;
  }

  if (tone === 'casual' && raw.length <= 60) {
    return `${name}, bunu sohbet gibi aldım — ders sorusu sanmadım.

Devam etmek istersen ne konuşalım: moral, plan, ya da net bir konu ("paragraf nasıl çözülür")? Kısa yazman yeterli.`;
  }

  return null;
}
