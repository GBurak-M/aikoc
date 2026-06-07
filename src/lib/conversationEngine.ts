import {
  findGrammarByKeyword,
  findVocab,
  formatGrammarReply,
  formatVocabReply,
  pickEncouragingPhrase,
  EVERYDAY_PHRASES,
} from '../data/languageKnowledge';
import { findTerm } from './academicTerms';
import type { CoachContext } from './localAi';

export type ChatTurn = { role: 'user' | 'assistant'; text: string };

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function userName(context: CoachContext): string {
  return context.profile.name?.trim() || 'arkadaşım';
}

function isMostlyEnglish(message: string): boolean {
  const words = message.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const latin = words.filter((w) => /^[a-zA-Z'-]+$/.test(w)).length;
  return latin / words.length > 0.55;
}

function lastUserTurns(history: ChatTurn[], n = 3): string[] {
  return history.filter((t) => t.role === 'user').slice(-n).map((t) => t.text);
}

/** Selam, teşekkür, dil sorusu ve doğrudan sorulara insanî yanıt */
export function tryConversationalReply(
  message: string,
  context: CoachContext,
  history: ChatTurn[] = [],
): string | null {
  const raw = message.trim();
  if (!raw) return null;
  const m = normalize(raw);
  const name = userName(context);
  const preferEn = isMostlyEnglish(raw);

  // Selamlama
  if (/^(merhaba|selam|selamlar|hey|hi|hello|good morning|good evening|günaydın|iyi akşamlar)\b/.test(m)) {
    const prev = lastUserTurns(history, 1)[0];
    if (prev && normalize(prev) === m) {
      return `Yine buradayım ${name}. Az önce yazdığın konuya devam edebiliriz — ne merak ediyorsun?`;
    }
    return preferEn
      ? `Hey ${name}! Good to see you. What's on your mind today — exams, a tough question, or just a chat?`
      : `Merhaba ${name}! Buradayım. Bugün ne konuşalım — sınav, takıldığın bir soru, plan mı?`;
  }

  // Teşekkür
  if (/^(tesekkur|sağol|sagol|eyv|thanks|thank you|thx)\b/.test(m)) {
    return preferEn
      ? `You're welcome, ${name}. Ask anytime — I'm here for you.`
      : `Rica ederim ${name}. Ne zaman istersen yaz; birlikte çözeriz.`;
  }

  // Hal hatır
  if (/nasilsin|naber|n'aber|how are you|how r u|ne haber/.test(m)) {
    return preferEn
      ? `I'm doing well, thanks for asking! More importantly — how are you holding up with your studies, ${name}?`
      : `İyiyim, sorduğun için teşekkürler. Asıl önemli olan sensin ${name} — çalışmalar nasıl gidiyor?`;
  }

  // Gramer / dil bilgisi
  if (/gramer|grammar|dil bilgisi|zaman|tense|cumle|cümle|fiil|verb|article|baglac|bağlaç/.test(m)) {
    const rule = findGrammarByKeyword(raw);
    if (rule) {
      const intro = preferEn
        ? `Sure ${name}, let me explain this clearly:`
        : `Tabii ${name}, şöyle özetleyeyim:`;
      return `${intro}\n\n${formatGrammarReply(rule, preferEn)}`;
    }
  }

  // Kelime / çeviri
  const wordMatch = raw.match(
    /(?:kelime|çeviri|ceviri|translate|meaning|anlam[ıi]|ne demek|ingilizce|english)\s*[:\-]?\s*["']?([\p{L}\-]+)["']?/iu,
  );
  const quoted = raw.match(/["']([\p{L}\s\-]+)["']/u);
  const termCandidate = wordMatch?.[1] ?? quoted?.[1] ?? null;

  if (termCandidate && termCandidate.length >= 2 && termCandidate.length <= 40) {
    const vocab = findVocab(termCandidate);
    if (vocab) {
      return `${name}, işte bu kelime:\n\n${formatVocabReply(vocab)}`;
    }
    const academic = findTerm(termCandidate);
    if (academic) {
      return `${name}, "${termCandidate}" akademik sözlükte var:\n• TR: ${academic.tr}\n• EN: ${academic.en}\n• ${academic.definition}\n• YKS: ${academic.yksTip}`;
    }
  }

  // Kim / ne / nasıl / neden — doğrudan soru
  const isQuestion = /\?|^(ne|neden|nasil|nasıl|kim|nerede|ne zaman|how|what|why|who|when|where|can you|could you|yardim|yardım)/i.test(raw);

  if (isQuestion && /kimsin|sen kimsin|who are you/.test(m)) {
    return preferEn
      ? `I'm ${name}'s study coach on aikoc — not a distant bot, more like a friend who knows exams, plans, and languages. What would you like help with?`
      : `Ben aikoc'taki çalışma arkadaşın/koçunum ${name}. Uzak bir otomat değilim; sınav, plan ve dil konularında yanınızdayım. Ne konuda konuşalım?`;
  }

  if (isQuestion && /ne yapabilirsin|neler yapabilir|what can you do/.test(m)) {
    return `Şunlarda yardımcı olurum ${name}:
• Deneme ve net analizi, çalışma planı
• Türkçe–İngilizce kelime, gramer, akademik terim
• LGS, YKS, KPSS ve diğer sınav hazırlığı
• Kütüphanedeki kitap/makale önerisi
• Motivasyon ve takılı kaldığın konular

Doğrudan sorunu yazman yeterli — hazır şablon değil, senin cümleine göre yanıt veririm.`;
  }

  // Kısa onay / devam
  if (/^(tamam|ok|peki|anladim|anladım|olur|evet|hayır|hayir|no|yes)\b/.test(m) && m.length < 30) {
    const lastAssistant = [...history].reverse().find((t) => t.role === 'assistant');
    if (lastAssistant?.text.includes('?')) {
      return `Süper ${name}. Az önce sorduğum şeyi düşünürsen iyi olur — ya da yeni bir soru yaz, oradan devam edelim.`;
    }
    return `Tamam ${name}. Devam etmek istediğin konuyu bir cümleyle yazman yeterli.`;
  }

  // Duygusal / stres (hafif — motivation intent'e de düşer)
  if (/sıkıldım|sikildim|bunaldım|bunaldim|yoruldum|stres|kayg|umutsuz|moralim bozuk/.test(m)) {
    const phrase = pickEncouragingPhrase();
    return `${name}, bunu hissetmen normal. ${phrase}

İstersen bugün hedefini küçült: ${context.profile.dailyTargetHours} saat yerine 45 dakika odaklı çalışma bile fark yaratır. Ne seni en çok yordu — ders mi, tempo mu?`;
  }

  // İngilizce pratik isteği
  if (/ingilizce (konus|konuş|practice|speaking)|english practice|ingilizce sohbet/.test(m)) {
    const sample = EVERYDAY_PHRASES[Math.floor(Math.random() * 5)];
    return `${name}, mini pratik yapalım:

**TR:** ${sample.tr}
**EN:** ${sample.en}

Sen de İngilizce bir cümle yaz; ben düzeltip açıklayayım.`;
  }

  return null;
}

/** Genel sorulara bağlama duyarlı, şablonsuz kısa yanıt */
export function buildDirectAnswerFallback(
  message: string,
  context: CoachContext,
  intent: string,
): string {
  const name = userName(context);
  const m = normalize(message);

  if (intent === 'general' && message.length < 120) {
    if (/yardim|yardım|help/.test(m)) {
      return `${name}, tabii ki. Sorunu olduğu gibi yaz — hangi ders, hangi konu, ne takıldı? Mümkün olduğunca net cevap veririm.`;
    }
    if (/ödev|odev|homework/.test(m)) {
      return `${name}, ödev konusunu biraz açar mısın? Hangi ders ve ne tür bir görev (paragraf, problem, konu özeti)? Adım adım birlikte gideriz.`;
    }
  }

  return '';
}
