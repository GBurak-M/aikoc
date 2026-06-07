import { getCurriculumForGrade, type GradeLevel } from '../data/mebCurriculum';
import {
  getMaxQuestionsForSubject,
  getSubjectsForExamType,
  matchExamScoreSubject,
} from './examSubjects';

export type ExamType = 'TYT' | 'AYT';

export type Exam = {
  id: string;
  name: string;
  type: ExamType;
  date: string;
  notes: string;
  scores: Record<string, { correct: number; wrong: number; net: number }>;
  totalNet: number;
  accuracy: number;
};

export function parseExamDate(dateStr: string): number {
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day).getTime();
  }
  return new Date(dateStr).getTime();
}

export function sortExamsByDate<T extends { date: string }>(exams: T[]): T[] {
  return [...exams].sort((a, b) => parseExamDate(a.date) - parseExamDate(b.date));
}

export function getLatestExamByType(exams: Exam[], type: ExamType): Exam | null {
  const filtered = exams.filter((exam) => exam.type === type);
  if (filtered.length === 0) return null;
  return sortExamsByDate(filtered).at(-1) ?? null;
}

export function getExamsForChart(exams: Exam[]) {
  return sortExamsByDate(exams).map((exam) => ({
    ...exam,
    chartLabel: `${exam.date} · ${exam.name.length > 14 ? `${exam.name.slice(0, 14)}…` : exam.name}`,
  }));
}

export type SubjectAverage = {
  subject: string;
  avgNet: number;
  maxQ: number;
  percentage: number;
};

/** Her ders için ayrı ortalama — 4 gruba sıkıştırmaz */
export function getSubjectAverages(exams: Exam[]): SubjectAverage[] {
  const buckets = new Map<string, { net: number; count: number; maxTotal: number }>();

  const ensure = (subject: string, maxQ: number) => {
    if (!buckets.has(subject)) {
      buckets.set(subject, { net: 0, count: 0, maxTotal: 0 });
    }
    const b = buckets.get(subject)!;
    b.maxTotal += maxQ;
  };

  for (const exam of exams) {
    for (const [subject, score] of Object.entries(exam.scores ?? {})) {
      const maxQ = getMaxQuestionsForSubject(exam.type, subject);
      ensure(subject, maxQ);
      const b = buckets.get(subject)!;
      b.net += score.net || 0;
      b.count += 1;
    }
  }

  if (buckets.size === 0) {
    return getSubjectsForExamType('TYT').map((s) => ({
      subject: s.key,
      avgNet: 0,
      maxQ: s.maxQuestions,
      percentage: 0,
    }));
  }

  return [...buckets.entries()].map(([subject, data]) => {
    const avgNet = data.count > 0 ? parseFloat((data.net / data.count).toFixed(1)) : 0;
    const avgMax = data.count > 0 ? data.maxTotal / data.count : getMaxQuestionsForSubject('TYT', subject);
    const percentage = avgMax > 0 ? Math.round((avgNet / avgMax) * 100) : 0;
    return {
      subject,
      avgNet,
      maxQ: Math.round(avgMax),
      percentage: Math.min(100, percentage),
    };
  });
}

/** Müfredat koçu: sınav skorlarını ders bazında düzleştirir */
export function flattenExamScores(exam: Exam): Array<{ subject: string; net: number; maxQ: number; pct: number }> {
  return Object.entries(exam.scores ?? {}).map(([subject, s]) => {
    const maxQ = getMaxQuestionsForSubject(exam.type, subject);
    const pct = maxQ > 0 ? Math.round((s.net / maxQ) * 100) : 0;
    return { subject, net: s.net, maxQ, pct };
  });
}

export function findExamScoresForCurriculumSubject(
  exams: Exam[],
  subjectId: string,
  subjectName: string,
): Array<{ net: number; maxQ: number; pct: number }> {
  const rows: Array<{ net: number; maxQ: number; pct: number }> = [];
  for (const exam of exams) {
    for (const [key, val] of Object.entries(exam.scores ?? {})) {
      if (matchExamScoreSubject(key, subjectId, subjectName)) {
        const maxQ = getMaxQuestionsForSubject(exam.type, key);
        rows.push({ net: val.net, maxQ, pct: maxQ > 0 ? Math.round((val.net / maxQ) * 100) : 0 });
      }
    }
  }
  return rows;
}

/** Üyenin sınıfına göre müfredat dersleri + deneme istatistikleri */
export function getGradeSubjectAverages(exams: Exam[], grade: GradeLevel): SubjectAverage[] {
  const curriculum = getCurriculumForGrade(grade);
  const all = getSubjectAverages(exams);
  const latestType = getLatestExamByType(exams, 'TYT') ? 'TYT' : 'AYT';

  return curriculum.subjects.map((subj) => {
    const match = all.find((a) => matchExamScoreSubject(a.subject, subj.id, subj.name));
    if (match) {
      return { ...match, subject: subj.name };
    }
    const maxQ = getMaxQuestionsForSubject(latestType, subj.name);
    return { subject: subj.name, avgNet: 0, maxQ, percentage: 0 };
  });
}
