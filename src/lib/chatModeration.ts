/** Kullanıcı ve koç mesajlarında uygunsuz içeriği filtreler */

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; reason: 'profanity' | 'hate' | 'sexual' | 'threat' | 'spam'; userMessage: string };

const PROFANITY_PATTERNS = [
  /\b(amk|aq|orospu|piç|siktir|sikeyim|göt|yarrak|amına|ananı|kahpe|pezevenk)\b/i,
  /\b(fuck|shit|bitch|asshole|damn\s+you)\b/i,
];

const HATE_PATTERNS = [
  /\b(ırkçı|irkci|nefret\s+soylemi|kafir\s+hepsi|hepsi\s+aptal)\b/i,
  /\b(nigger|nigga|kike|chink|raghead)\b/i,
  /\b(tum\s+\w+\s+insanlar\s+aptal|butun\s+\w+\s+dusuk)\b/i,
];

const SEXUAL_PATTERNS = [
  /\b(porno|porn|seks\s+sohbet|cinsel\s+icerik|masturb|sikis)\b/i,
  /\b(nude|naked\s+pic|send\s+nudes)\b/i,
];

const THREAT_PATTERNS = [
  /\b(oldur|öldür|oldurecegim|intihar\s+et|kendini\s+oldur)\b/i,
  /\b(kill\s+you|kill\s+myself|i\s+will\s+hurt)\b/i,
];

const REFUSAL_MESSAGES: Record<'profanity' | 'hate' | 'sexual' | 'threat' | 'spam', string> = {
  profanity: 'Küfürlü veya kaba ifadelerle sohbet edemem. Konuyu saygılı bir dille tekrar yazarsan yardımcı olurum.',
  hate: 'Irkçı, ayrımcı veya nefret içeren mesajlara yanıt veremem. Eğitim ve gelişim odaklı konuşalım.',
  sexual: 'Müstehcen veya cinsel içerikli sohbetlere katılmam. Ders, sınav veya kişisel gelişim konularında buradayım.',
  threat: 'Tehdit veya zarar içeren ifadeler ciddiye alınır; bu tür mesajlara yanıt veremem. Destek gerekiyorsa güvendiğin bir yetişkinle konuş.',
  spam: 'Mesaj çok uzun veya tekrarlı görünüyor. Daha kısa ve net bir soru yazarsan daha iyi yardımcı olurum.',
};

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

export function moderateUserInput(text: string): ModerationResult {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: false, reason: 'spam', userMessage: REFUSAL_MESSAGES.spam };
  if (trimmed.length > 2000) return { allowed: false, reason: 'spam', userMessage: REFUSAL_MESSAGES.spam };

  if (matchesAny(trimmed, HATE_PATTERNS)) {
    return { allowed: false, reason: 'hate', userMessage: REFUSAL_MESSAGES.hate };
  }
  if (matchesAny(trimmed, SEXUAL_PATTERNS)) {
    return { allowed: false, reason: 'sexual', userMessage: REFUSAL_MESSAGES.sexual };
  }
  if (matchesAny(trimmed, THREAT_PATTERNS)) {
    return { allowed: false, reason: 'threat', userMessage: REFUSAL_MESSAGES.threat };
  }
  if (matchesAny(trimmed, PROFANITY_PATTERNS)) {
    return { allowed: false, reason: 'profanity', userMessage: REFUSAL_MESSAGES.profanity };
  }

  return { allowed: true };
}

/** Koç yanıtında istenmeyen ifade kalırsa temizler */
export function sanitizeCoachOutput(text: string): string {
  let out = text;
  for (const patterns of [PROFANITY_PATTERNS, HATE_PATTERNS, SEXUAL_PATTERNS]) {
    for (const p of patterns) {
      out = out.replace(p, '***');
    }
  }
  return out;
}
