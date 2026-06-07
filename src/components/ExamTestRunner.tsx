import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock, Flag, RotateCcw,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import type { ArchiveQuestion, ChoiceKey, ExamPaper } from '../lib/examArchive/types';
import { getQuestionsForPaper } from '../lib/examArchive/questions';
import { computeSubjectScoresFromAnswers } from '../lib/examArchive/stats';
import {
  completePaper,
  getPaperProgress,
  setCurrentIndex,
  startOrResumePaper,
  updateAnswer,
  clearPaperProgress,
} from '../lib/examArchive/progress';
import type { PaperProgress } from '../lib/examArchive/types';
import {
  generateArchiveFinishCoachMessage,
  generateWrongAnswerCoachLine,
  getPositiveCorrectReply,
} from '../lib/aiCoachHub';
import { recordArchiveTestComplete, recordQuestionOutcome } from '../lib/userLearning';
import { logSiteEvent } from '../lib/siteTraffic';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
  hover: string;
  gradient: string;
};

type Props = {
  paper: ExamPaper;
  darkMode: boolean;
  activeTheme: ThemeClasses;
  profileName: string;
  onBack: () => void;
  onCoachInsight?: (text: string) => void;
  onStatsUpdate?: () => void;
};

export default function ExamTestRunner({
  paper,
  darkMode,
  activeTheme,
  profileName,
  onBack,
  onCoachInsight,
  onStatsUpdate,
}: Props) {
  const questions = useMemo(() => getQuestionsForPaper(paper), [paper]);
  const [progress, setProgress] = useState<PaperProgress | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [coachFlash, setCoachFlash] = useState<string | null>(null);

  useEffect(() => {
    const existing = getPaperProgress(paper.id);
    if (existing?.completed) {
      setProgress(existing);
      setShowResult(true);
      return;
    }
    const p = startOrResumePaper(paper.id, paper.questionCount);
    setProgress(p);
    logSiteEvent('exam_archive_start', { tab: 'ulusalsinav', detail: paper.title });
  }, [paper]);

  useEffect(() => {
    if (!progress || showResult) return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [progress, showResult]);

  useEffect(() => {
    if (!coachFlash) return;
    const t = setTimeout(() => setCoachFlash(null), 6000);
    return () => clearTimeout(t);
  }, [coachFlash]);

  const currentIndex = progress?.currentIndex ?? 0;
  const currentQ: ArchiveQuestion | undefined = questions[currentIndex];
  const answeredCount = progress ? Object.keys(progress.answers).length : 0;

  const handleChoice = useCallback(
    (choice: ChoiceKey) => {
      if (!progress || !currentQ || showResult) return;
      const next = updateAnswer(paper.id, currentQ.number, choice, currentIndex);
      setProgress(next);

      const isCorrect = choice === currentQ.correctKey;
      recordQuestionOutcome(currentQ.subject, isCorrect);

      if (isCorrect) {
        setCoachFlash(getPositiveCorrectReply(currentQ.subject));
      } else {
        setCoachFlash(
          generateWrongAnswerCoachLine(currentQ.subject, currentQ.explanation),
        );
      }
    },
    [progress, currentQ, showResult, paper.id, currentIndex],
  );

  const goTo = useCallback(
    (idx: number) => {
      if (!progress) return;
      const clamped = Math.max(0, Math.min(idx, questions.length - 1));
      setProgress(setCurrentIndex(paper.id, clamped));
      setCoachFlash(null);
    },
    [progress, paper.id, questions.length],
  );

  const finishTest = useCallback(() => {
    if (!progress) return;
    let correct = 0;
    for (const q of questions) {
      if (progress.answers[q.number] === q.correctKey) correct++;
    }
    const done = completePaper(paper.id, correct, questions.length);
    const bySubject = done.subjectScores ?? computeSubjectScoresFromAnswers(paper.id, done.answers);

    const bySubjectSimple: Record<string, { correct: number; wrong: number }> = {};
    for (const [sub, s] of Object.entries(bySubject)) {
      bySubjectSimple[sub] = { correct: s.correct, wrong: s.wrong + s.blank };
    }
    recordArchiveTestComplete(bySubjectSimple);

    const coachMsg = generateArchiveFinishCoachMessage(
      paper,
      correct,
      questions.length,
      bySubject,
      profileName,
    );
    onCoachInsight?.(coachMsg);
    onStatsUpdate?.();

    setProgress(done);
    setShowResult(true);
    logSiteEvent('exam_archive_finish', {
      tab: 'ulusalsinav',
      detail: `${paper.title}: ${correct}/${questions.length}`,
    });
  }, [progress, questions, paper, profileName, onCoachInsight, onStatsUpdate]);

  const restart = useCallback(() => {
    clearPaperProgress(paper.id);
    const p = startOrResumePaper(paper.id, paper.questionCount);
    setProgress(p);
    setShowResult(false);
    setElapsedSec(0);
    setCoachFlash(null);
    logSiteEvent('exam_archive_restart', { tab: 'ulusalsinav', detail: paper.title });
  }, [paper]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!progress || !currentQ) {
    return (
      <div className="text-center py-16 text-slate-400">Test yükleniyor…</div>
    );
  }

  if (showResult && progress.score) {
    const pct = Math.round((progress.score.correct / progress.score.total) * 100);
    const bySubject =
      progress.subjectScores ??
      computeSubjectScoresFromAnswers(paper.id, progress.answers);
    const subjectRows = Object.entries(bySubject).sort((a, b) => a[1].accuracy - b[1].accuracy);

    return (
      <div className="space-y-6 animate-fadeIn">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Arşive dön
        </button>

        <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100'} shadow-sm`}>
          <CheckCircle2 className={`h-12 w-12 mx-auto mb-4 ${activeTheme.text}`} />
          <h2 className="font-display text-2xl font-bold mb-2">Test Tamamlandı</h2>
          <p className="text-slate-500 mb-6">{paper.title}</p>
          <div className="flex justify-center gap-8 mb-8">
            <div>
              <p className="text-4xl font-black">{progress.score.correct}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Doğru</p>
            </div>
            <div>
              <p className="text-4xl font-black">{progress.score.total - progress.score.correct}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Yanlış / Boş</p>
            </div>
            <div>
              <p className={`text-4xl font-black ${activeTheme.text}`}>%{pct}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Başarı</p>
            </div>
          </div>

          {subjectRows.length > 0 && (
            <div className={`mb-8 p-4 rounded-xl text-left ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Alan bazlı performans (Grafikler sekmesine yansır)
              </p>
              <div className="space-y-2">
                {subjectRows.map(([sub, s]) => (
                  <div key={sub} className="flex items-center justify-between text-sm gap-2">
                    <span className="font-bold truncate">{sub}</span>
                    <span className="text-slate-500 shrink-0">
                      {s.correct}/{s.total} · %{s.accuracy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={restart}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white ${activeTheme.bg} ${activeTheme.hover}`}
            >
              <RotateCcw className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              Yeniden çöz
            </button>
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl font-bold text-sm border dark:border-slate-600"
            >
              Arşive dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selected = progress.answers[currentQ.number];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            logSiteEvent('exam_archive_pause', { tab: 'ulusalsinav', detail: `${paper.title} @${currentIndex + 1}` });
            onBack();
          }}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Kaydet ve çık
        </button>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedSec)} / {paper.durationMinutes} dk
          </span>
          <span>{answeredCount}/{questions.length} cevaplandı</span>
        </div>
      </div>

      {coachFlash && (
        <div
          className={`p-4 rounded-xl border flex gap-3 items-start animate-fadeIn ${
            darkMode ? 'bg-violet-900/30 border-violet-700/50' : 'bg-violet-50 border-violet-200'
          }`}
        >
          <BrandLogo size={20} variant="mark" className="mt-0.5" />
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{coachFlash}</p>
        </div>
      )}

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${activeTheme.bg}`}>
            {currentQ.subject}
          </span>
          <span className="text-xs font-bold text-slate-400">
            Soru {currentQ.number} / {questions.length}
          </span>
        </div>
        <p className="text-sm md:text-base font-medium leading-relaxed mb-6">{currentQ.stem}</p>

        <div className="space-y-2">
          {currentQ.choices.map((c) => {
            const isSelected = selected === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => handleChoice(c.key)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isSelected
                    ? `${activeTheme.lightBg} border-transparent ring-2 ${activeTheme.ring}`
                    : darkMode
                      ? 'border-slate-700 hover:bg-slate-800/60'
                      : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                  isSelected ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {c.key}
                </span>
                <span className="text-sm pt-0.5">{c.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => goTo(currentIndex - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 border dark:border-slate-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Önceki
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white ${activeTheme.bg}`}
          >
            Sonraki
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finishTest}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Flag className="h-4 w-4" />
            Testi bitir
          </button>
        )}
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Soru haritası</p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {questions.map((q, i) => {
            const ans = progress.answers[q.number];
            const isCurrent = i === currentIndex;
            const isWrong = ans && ans !== q.correctKey;
            const isRight = ans === q.correctKey;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(i)}
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                  isCurrent
                    ? `${activeTheme.bg} text-white`
                    : isRight
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : isWrong
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}
              >
                {q.number}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
