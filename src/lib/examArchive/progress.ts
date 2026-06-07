import { safeParse, safeSetItem } from '../storage';
import { computeSubjectScoresFromAnswers } from './stats';
import type { ChoiceKey, PaperProgress } from './types';

const PROGRESS_KEY = 'aikoc_exam_archive_progress';

type ProgressStore = Record<string, PaperProgress>;

function loadStore(): ProgressStore {
  return safeParse<ProgressStore>(PROGRESS_KEY, {});
}

function saveStore(store: ProgressStore): void {
  safeSetItem(PROGRESS_KEY, store);
}

export function getPaperProgress(paperId: string): PaperProgress | null {
  return loadStore()[paperId] ?? null;
}

export function getAllPaperProgress(): ProgressStore {
  return loadStore();
}

export function savePaperProgress(progress: PaperProgress): void {
  const store = loadStore();
  store[progress.paperId] = progress;
  saveStore(store);
}

export function startOrResumePaper(paperId: string, totalQuestions: number): PaperProgress {
  const existing = getPaperProgress(paperId);
  if (existing && !existing.completed) return existing;

  const now = new Date().toISOString();
  const fresh: PaperProgress = {
    paperId,
    currentIndex: 0,
    answers: {},
    startedAt: now,
    updatedAt: now,
    completed: false,
  };
  if (!existing) {
    savePaperProgress(fresh);
    return fresh;
  }

  const restart: PaperProgress = {
    paperId,
    currentIndex: 0,
    answers: {},
    startedAt: now,
    updatedAt: now,
    completed: false,
  };
  savePaperProgress(restart);
  return restart;
}

export function updateAnswer(
  paperId: string,
  questionNumber: number,
  choice: ChoiceKey,
  currentIndex: number,
): PaperProgress {
  const store = loadStore();
  const prev = store[paperId];
  if (!prev) throw new Error('İlerleme bulunamadı');
  const next: PaperProgress = {
    ...prev,
    answers: { ...prev.answers, [questionNumber]: choice },
    currentIndex,
    updatedAt: new Date().toISOString(),
  };
  savePaperProgress(next);
  return next;
}

export function setCurrentIndex(paperId: string, index: number): PaperProgress {
  const store = loadStore();
  const prev = store[paperId];
  if (!prev) throw new Error('İlerleme bulunamadı');
  const next: PaperProgress = {
    ...prev,
    currentIndex: index,
    updatedAt: new Date().toISOString(),
  };
  savePaperProgress(next);
  return next;
}

export function completePaper(
  paperId: string,
  correct: number,
  total: number,
): PaperProgress {
  const store = loadStore();
  const prev = store[paperId];
  if (!prev) throw new Error('İlerleme bulunamadı');
  const subjectScores = computeSubjectScoresFromAnswers(paperId, prev.answers);
  const next: PaperProgress = {
    ...prev,
    completed: true,
    score: { correct, total },
    subjectScores,
    updatedAt: new Date().toISOString(),
  };
  savePaperProgress(next);
  return next;
}

export function clearPaperProgress(paperId: string): void {
  const store = loadStore();
  delete store[paperId];
  saveStore(store);
}
