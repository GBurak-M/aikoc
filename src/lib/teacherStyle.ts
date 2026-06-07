/** Soru çözücü ve koç yanıtları için öğretmen üslubunda biçimlendirme */

export type TeacherSection = {
  title: string;
  body: string;
};

export type TeacherLessonInput = {
  subject: string;
  topic: string;
  question: string;
  /** Soruya doğrudan verilen net cevap — en üstte gösterilir */
  directAnswer?: string;
  greeting?: string;
  sections: TeacherSection[];
  summary: string;
  yksNote?: string;
  practice?: { question: string; answer: string };
};

export function formatTeacherLesson(input: TeacherLessonInput): string {
  const direct = input.directAnswer
    ? `### Cevap\n\n${input.directAnswer.trim()}\n\n`
    : '';

  const greet = input.greeting
    ? `${input.greeting.trim()}\n\n`
    : '';

  const sectionText = input.sections
    .map((s, i) => `### ${i + 1}. ${s.title}\n\n${s.body.trim()}`)
    .join('\n\n');

  const yks = input.yksNote
    ? `\n\n### Sınavda karşına nasıl çıkar?\n\n${input.yksNote.trim()}`
    : '';

  const practice = input.practice
    ? `\n\n### Kendini kontrol et\n\n**Soru:** ${input.practice.question}\n\n**Cevap:** ${input.practice.answer}`
    : '';

  return `📚 **${input.subject} — ${input.topic}**

**Sorunuz:** «${input.question}»

${direct}${greet}${sectionText}

### Özet

${input.summary.trim()}${yks}${practice}`;
}

/** «nerede», «hangi ülke/kıta» gibi konum soruları */
export function isLocationQuestion(normalized: string): boolean {
  return /nerede|neredir|hangi bolge|hangi bölge|hangi il|hangi ulke|hangi ülke|hangi kita|hangi kıta|hangi sehir|hangi şehir|konumu|konumda|haritada nerede|where is|where's|located in|konum bilgisi/.test(
    normalized,
  );
}

/** Kavramsal soru mu? (nasıl oluşur, nedir, nerede vb.) */
export function isConceptualQuestion(normalized: string): boolean {
  return /nasil|nasıl|nedir|ne demek|ne anlama|nerede|neredir|olusur|oluşur|olusma|oluşma|tanim|tanım|ozellik|özellik|farki|farkı|acikla|açıkla|anlat|yorumla/.test(
    normalized,
  );
}
