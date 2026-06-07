import type { ExamArchiveType, ExamPaper, PaperSource } from './types';
import { EXAM_TYPE_LABELS, SOURCE_LABELS } from './types';

export type ExamSearchFilters = {
  query: string;
  examType: ExamArchiveType | 'all';
  year: number | 'all';
  source: PaperSource | 'all';
};

export function searchExamPapers(papers: ExamPaper[], filters: ExamSearchFilters): ExamPaper[] {
  const q = filters.query.trim().toLowerCase();

  return papers.filter((p) => {
    if (filters.examType !== 'all' && p.examType !== filters.examType) return false;
    if (filters.year !== 'all' && p.year !== filters.year) return false;
    if (filters.source !== 'all' && p.source !== filters.source) return false;

    if (!q) return true;

    const haystack = [
      p.title,
      p.session,
      p.examType,
      EXAM_TYPE_LABELS[p.examType],
      SOURCE_LABELS[p.source],
      String(p.year),
      ...p.subjects,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function getDistinctYears(papers: ExamPaper[]): number[] {
  return [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);
}
