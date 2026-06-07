import type { ExamType } from './exams';

export type ExamSubjectDef = {
  key: string;
  label: string;
  maxQuestions: number;
  group?: 'fen' | 'sosyal';
};

/** TYT — ders ders giriş (4 grup yerine ayrı branşlar) */
export const TYT_EXAM_SUBJECTS: ExamSubjectDef[] = [
  { key: 'Türkçe', label: 'Türkçe', maxQuestions: 40 },
  { key: 'Matematik', label: 'Matematik', maxQuestions: 40 },
  { key: 'Fizik', label: 'Fizik', maxQuestions: 7, group: 'fen' },
  { key: 'Kimya', label: 'Kimya', maxQuestions: 7, group: 'fen' },
  { key: 'Biyoloji', label: 'Biyoloji', maxQuestions: 6, group: 'fen' },
  { key: 'Tarih', label: 'Tarih', maxQuestions: 5, group: 'sosyal' },
  { key: 'Coğrafya', label: 'Coğrafya', maxQuestions: 5, group: 'sosyal' },
  { key: 'Felsefe', label: 'Felsefe', maxQuestions: 5, group: 'sosyal' },
  { key: 'Din Kültürü', label: 'Din Kültürü', maxQuestions: 5, group: 'sosyal' },
];

/** AYT — alan dersleri ayrı ayrı */
export const AYT_EXAM_SUBJECTS: ExamSubjectDef[] = [
  { key: 'Matematik', label: 'Matematik', maxQuestions: 40 },
  { key: 'Fizik', label: 'Fizik', maxQuestions: 14 },
  { key: 'Kimya', label: 'Kimya', maxQuestions: 13 },
  { key: 'Biyoloji', label: 'Biyoloji', maxQuestions: 13 },
  { key: 'Edebiyat', label: 'Edebiyat', maxQuestions: 24 },
  { key: 'Tarih-1', label: 'Tarih-1', maxQuestions: 10 },
  { key: 'Coğrafya-1', label: 'Coğrafya-1', maxQuestions: 6 },
  { key: 'Tarih-2', label: 'Tarih-2', maxQuestions: 11 },
  { key: 'Coğrafya-2', label: 'Coğrafya-2', maxQuestions: 11 },
  { key: 'Felsefe', label: 'Felsefe', maxQuestions: 12 },
  { key: 'Din Kültürü', label: 'Din Kültürü', maxQuestions: 6 },
  { key: 'İngilizce', label: 'İngilizce (YDT)', maxQuestions: 80 },
];

export function getSubjectsForExamType(type: ExamType): ExamSubjectDef[] {
  return type === 'TYT' ? TYT_EXAM_SUBJECTS : AYT_EXAM_SUBJECTS;
}

export function getMaxQuestionsForSubject(type: ExamType, subject: string): number {
  const list = getSubjectsForExamType(type);
  const found = list.find((s) => s.key === subject);
  if (found) return found.maxQuestions;

  if (type === 'TYT') {
    if (subject === 'Fen') return 20;
    if (subject === 'Sosyal') return 20;
  }
  if (type === 'AYT') {
    if (subject === 'Fen') return 40;
    if (subject === 'Sosyal') return 40;
  }
  return 40;
}

export function createEmptyScoreMap(type: ExamType): Record<string, { correct: number; wrong: number }> {
  const map: Record<string, { correct: number; wrong: number }> = {};
  for (const s of getSubjectsForExamType(type)) {
    map[s.key] = { correct: 0, wrong: 0 };
  }
  return map;
}

/** Eski kayıtlardaki Fen/Sosyal → yeni branş anahtarları */
const LEGACY_SUBJECT_ALIASES: Record<string, string[]> = {
  Matematik: ['matematik', 'mat', 'geometri'],
  Türkçe: ['türkçe', 'turkce', 'tur'],
  Fizik: ['fizik', 'fiz', 'fen'],
  Kimya: ['kimya', 'kim'],
  Biyoloji: ['biyoloji', 'biy'],
  Tarih: ['tarih', 'sosyal'],
  Coğrafya: ['coğrafya', 'cografya', 'sosyal'],
  Felsefe: ['felsefe', 'sosyal'],
  'Din Kültürü': ['din', 'din kültürü', 'dkab'],
  Edebiyat: ['edebiyat', 'ede', 'türkçe'],
  'Tarih-1': ['tarih-1', 'tarih1', 'sosyal'],
  'Coğrafya-1': ['coğrafya-1', 'cografya-1'],
  'Tarih-2': ['tarih-2', 'tarih2'],
  'Coğrafya-2': ['coğrafya-2', 'cografya-2'],
  İngilizce: ['ingilizce', 'ydt', 'dil'],
};

export function matchExamScoreSubject(scoreKey: string, subjectId: string, subjectName: string): boolean {
  const key = scoreKey.toLowerCase();
  const aliases = LEGACY_SUBJECT_ALIASES[subjectName] ?? [subjectName.toLowerCase(), subjectId];
  return aliases.some((a) => key.includes(a) || a.includes(key));
}
