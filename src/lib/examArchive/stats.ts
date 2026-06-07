import { EXAM_PAPER_CATALOG } from './catalog';
import { getQuestionsForPaper } from './questions';
import { getAllPaperProgress } from './progress';
import type { ChoiceKey, PaperProgress } from './types';

export type SubjectScore = {
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  accuracy: number;
};

export type ArchiveSubjectStat = {
  subject: string;
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  accuracy: number;
  papersTouched: number;
};

export type ArchivePaperStat = {
  paperId: string;
  title: string;
  examType: string;
  completedAt: string;
  correct: number;
  total: number;
  accuracy: number;
  bySubject: Record<string, SubjectScore>;
};

const paperById = new Map(EXAM_PAPER_CATALOG.map((p) => [p.id, p]));

export function computeSubjectScoresFromAnswers(
  paperId: string,
  answers: Record<number, ChoiceKey>,
): Record<string, SubjectScore> {
  const paper = paperById.get(paperId);
  if (!paper) return {};
  const questions = getQuestionsForPaper(paper);
  const buckets: Record<string, { correct: number; wrong: number; blank: number }> = {};

  for (const q of questions) {
    if (!buckets[q.subject]) {
      buckets[q.subject] = { correct: 0, wrong: 0, blank: 0 };
    }
    const pick = answers[q.number];
    if (!pick) {
      buckets[q.subject].blank += 1;
    } else if (pick === q.correctKey) {
      buckets[q.subject].correct += 1;
    } else {
      buckets[q.subject].wrong += 1;
    }
  }

  const result: Record<string, SubjectScore> = {};
  for (const [subject, b] of Object.entries(buckets)) {
    const total = b.correct + b.wrong + b.blank;
    result[subject] = {
      correct: b.correct,
      wrong: b.wrong,
      blank: b.blank,
      total,
      accuracy: total > 0 ? Math.round((b.correct / total) * 100) : 0,
    };
  }
  return result;
}

function mergeSubjectStat(
  map: Map<string, ArchiveSubjectStat>,
  subject: string,
  score: SubjectScore,
  paperCounted: boolean,
) {
  const prev = map.get(subject) ?? {
    subject,
    correct: 0,
    wrong: 0,
    blank: 0,
    total: 0,
    accuracy: 0,
    papersTouched: 0,
  };
  prev.correct += score.correct;
  prev.wrong += score.wrong;
  prev.blank += score.blank;
  prev.total += score.total;
  if (paperCounted) prev.papersTouched += 1;
  prev.accuracy = prev.total > 0 ? Math.round((prev.correct / prev.total) * 100) : 0;
  map.set(subject, prev);
}

export function getArchiveSubjectStats(): ArchiveSubjectStat[] {
  const store = getAllPaperProgress();
  const map = new Map<string, ArchiveSubjectStat>();

  for (const progress of Object.values(store)) {
    if (!progress.completed || !progress.score) continue;
    const bySubject =
      progress.subjectScores ??
      computeSubjectScoresFromAnswers(progress.paperId, progress.answers);
    for (const [subject, score] of Object.entries(bySubject)) {
      mergeSubjectStat(map, subject, score, true);
    }
  }

  return [...map.values()].sort((a, b) => a.accuracy - b.accuracy);
}

export function getArchivePaperStats(): ArchivePaperStat[] {
  const store = getAllPaperProgress();
  return Object.values(store)
    .filter((p) => p.completed && p.score)
    .map((p) => {
      const meta = paperById.get(p.paperId);
      const bySubject =
        p.subjectScores ?? computeSubjectScoresFromAnswers(p.paperId, p.answers);
      return {
        paperId: p.paperId,
        title: meta?.title ?? p.paperId,
        examType: meta?.examType ?? '—',
        completedAt: p.updatedAt,
        correct: p.score!.correct,
        total: p.score!.total,
        accuracy: Math.round((p.score!.correct / p.score!.total) * 100),
        bySubject,
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function formatArchiveStatsSummary(): string {
  const stats = getArchiveSubjectStats();
  const papers = getArchivePaperStats();
  if (papers.length === 0) {
    return 'Ulusal sınav arşivinde henüz tamamlanmış test yok.';
  }

  const weak = stats.slice(0, 3);
  const strong = [...stats].sort((a, b) => b.accuracy - a.accuracy).slice(0, 2);

  const lines = [
    `Tamamlanan arşiv testi: ${papers.length}`,
    weak.length
      ? `Geliştirilmesi gereken alanlar: ${weak.map((s) => `${s.subject} %${s.accuracy} (${s.wrong} yanlış)`).join(' · ')}`
      : '',
    strong.length
      ? `Güçlü alanlar: ${strong.map((s) => `${s.subject} %${s.accuracy}`).join(' · ')}`
      : '',
    `Son test: ${papers[0].title} — ${papers[0].correct}/${papers[0].total} (%${papers[0].accuracy})`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function enrichProgressSubjectScores(progress: PaperProgress): PaperProgress {
  if (progress.subjectScores) return progress;
  return {
    ...progress,
    subjectScores: computeSubjectScoresFromAnswers(progress.paperId, progress.answers),
  };
}
