import { formatTeacherLesson, type TeacherSection } from '../teacherStyle';

export type LessonSpec = {
  domain: string;
  pattern: RegExp;
  topic: string;
  directAnswer: string;
  sections: TeacherSection[];
  summary: string;
  yksNote?: string;
  practice?: { question: string; answer: string };
  greeting?: string;
  /** Çakışan eşleşmelerde öncelik (yüksek = tercih edilir) */
  priority?: number;
};

export type BuiltLesson = {
  pattern: RegExp;
  priority: number;
  build: (question: string) => string;
};

export function makeLesson(spec: LessonSpec): BuiltLesson {
  return {
    pattern: spec.pattern,
    priority: spec.priority ?? 0,
    build: (question: string) =>
      formatTeacherLesson({
        subject: spec.domain,
        topic: spec.topic,
        question,
        directAnswer: spec.directAnswer,
        greeting: spec.greeting,
        sections: spec.sections,
        summary: spec.summary,
        yksNote: spec.yksNote,
        practice: spec.practice,
      }),
  };
}

export function normalizeQuestion(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function pickLesson(lessons: BuiltLesson[], question: string): string | null {
  const q = normalizeQuestion(question);
  const hits = lessons.filter((l) => l.pattern.test(q));
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.priority - a.priority);
  return hits[0].build(question);
}
