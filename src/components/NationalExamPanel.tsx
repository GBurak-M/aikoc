import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Clock, Filter, Play, Search,
} from 'lucide-react';
import { EXAM_PAPER_CATALOG, groupPapersByTypeAndYear } from '../lib/examArchive/catalog';
import { getAllPaperProgress } from '../lib/examArchive/progress';
import { getDistinctYears, searchExamPapers } from '../lib/examArchive/search';
import {
  EXAM_TYPE_LABELS,
  SOURCE_LABELS,
  type ExamArchiveType,
  type ExamPaper,
  type PaperSource,
} from '../lib/examArchive/types';
import { logSiteEvent } from '../lib/siteTraffic';
import ExamTestRunner from './ExamTestRunner';
import { EXAM_TYPE_GRADIENT } from '../lib/visuals';
import BrandLogo from './BrandLogo';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
  hover: string;
  gradient: string;
  darkText?: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  profileName: string;
  onCoachInsight?: (text: string) => void;
  onStatsUpdate?: () => void;
};

const EXAM_TYPES = Object.keys(EXAM_TYPE_LABELS) as ExamArchiveType[];

export default function NationalExamPanel({
  darkMode,
  activeTheme,
  profileName,
  onCoachInsight,
  onStatsUpdate,
}: Props) {
  const [query, setQuery] = useState('');
  const [examType, setExamType] = useState<ExamArchiveType | 'all'>('all');
  const [year, setYear] = useState<number | 'all'>('all');
  const [source, setSource] = useState<PaperSource | 'all'>('all');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['TYT', 'LGS']));
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [activePaper, setActivePaper] = useState<ExamPaper | null>(null);
  const lastSearchLog = useRef('');

  const progressMap = useMemo(() => getAllPaperProgress(), [activePaper]);

  const filtered = useMemo(() => {
    return searchExamPapers(EXAM_PAPER_CATALOG, { query, examType, year, source });
  }, [query, examType, year, source]);

  const grouped = useMemo(() => groupPapersByTypeAndYear(filtered), [filtered]);
  const years = useMemo(() => getDistinctYears(EXAM_PAPER_CATALOG), []);

  const handleSearch = (value: string) => {
    setQuery(value);
    const key = value.trim().toLowerCase();
    if (key.length >= 2 && key !== lastSearchLog.current) {
      lastSearchLog.current = key;
      logSiteEvent('exam_archive_search', { tab: 'ulusalsinav', detail: key });
    }
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleYear = (key: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startPaper = (paper: ExamPaper) => {
    setActivePaper(paper);
    const prog = progressMap[paper.id];
    if (prog && !prog.completed) {
      logSiteEvent('exam_archive_resume', { tab: 'ulusalsinav', detail: paper.title });
    }
  };

  if (activePaper) {
    return (
      <ExamTestRunner
        paper={activePaper}
        darkMode={darkMode}
        activeTheme={activeTheme}
        profileName={profileName}
        onBack={() => setActivePaper(null)}
        onCoachInsight={onCoachInsight}
        onStatsUpdate={onStatsUpdate}
      />
    );
  }

  const cardCls = darkMode
    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
    : 'bg-white border-slate-100 hover:bg-slate-50';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <BrandLogo size={24} variant="mark" />
              <BookOpen className={`h-5 w-5 ${activeTheme.text}`} />
              Ulusal Sınav Arşivi
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Son 20 yılın çıkmış soru setleri ve ücretsiz denemeler — sınav türü ve yıla göre gruplandı.
              Testlere tıklayarak sayfa içinde çözebilir, kaldığınız yerden devam edebilirsiniz.
            </p>
            <p className="text-[10px] text-slate-400 mt-2">
              {EXAM_PAPER_CATALOG.length} test · {filtered.length} listeleniyor
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Sınav türü, yıl veya test adı ara… (ör. TYT 2024, KPSS deneme)"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium ${
                darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamArchiveType | 'all')}
              className={`px-3 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <option value="all">Tüm sınavlar</option>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>{EXAM_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <select
              value={year === 'all' ? 'all' : String(year)}
              onChange={(e) => setYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`px-3 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <option value="all">Tüm yıllar</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as PaperSource | 'all')}
              className={`px-3 py-2 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <option value="all">Tüm kaynaklar</option>
              <option value="cikmis">Çıkmış sorular</option>
              <option value="ucretsiz_deneme">Ücretsiz deneme</option>
            </select>
          </div>
        </div>

        {(query || examType !== 'all' || year !== 'all' || source !== 'all') && (
          <button
            type="button"
            onClick={() => { setQuery(''); setExamType('all'); setYear('all'); setSource('all'); }}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <Filter className="h-3 w-3" />
            Filtreleri temizle
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center text-slate-400 ${cardCls}`}>
          Arama kriterlerinize uygun test bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([type, yearMap]) => {
            const typeOpen = expandedTypes.has(type) || query.length > 0 || examType !== 'all';
            return (
              <div
                key={type}
                className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-700/60' : 'border-slate-100'}`}
              >
                <button
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`w-full flex items-center justify-between px-5 py-4 font-bold text-left ${
                    darkMode ? 'bg-slate-800/60' : 'bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {typeOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {EXAM_TYPE_LABELS[type]}
                    <span className="text-xs font-bold text-slate-400">
                      {[...yearMap.values()].flat().length} test
                    </span>
                  </span>
                </button>

                {typeOpen && (
                  <div className="p-4 space-y-3">
                    {[...yearMap.entries()]
                      .sort(([a], [b]) => b - a)
                      .map(([yr, papers]) => {
                        const yearKey = `${type}-${yr}`;
                        const yearOpen = expandedYears.has(yearKey) || query.length > 0 || year !== 'all';
                        return (
                          <div key={yearKey}>
                            <button
                              type="button"
                              onClick={() => toggleYear(yearKey)}
                              className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-2 w-full text-left"
                            >
                              {yearOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              {yr}
                              <span className="text-[10px] text-slate-400">({papers.length})</span>
                            </button>

                            {yearOpen && (
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pl-5">
                                {papers.map((paper) => (
                                  <PaperCard
                                    key={paper.id}
                                    paper={paper}
                                    progress={progressMap[paper.id]}
                                    cardCls={cardCls}
                                    activeTheme={activeTheme}
                                    onStart={() => startPaper(paper)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaperCard({
  paper,
  progress,
  cardCls,
  activeTheme,
  onStart,
}: {
  paper: ExamPaper;
  progress?: { completed: boolean; currentIndex: number; score?: { correct: number; total: number } };
  cardCls: string;
  activeTheme: ThemeClasses;
  onStart: () => void;
}) {
  const inProgress = progress && !progress.completed;
  const done = progress?.completed;
  const stripGrad = EXAM_TYPE_GRADIENT[paper.examType] ?? 'from-slate-500 to-slate-700';

  return (
    <button
      type="button"
      onClick={onStart}
      className={`visual-card text-left group overflow-hidden ${cardCls}`}
    >
      <div className={`h-1.5 bg-gradient-to-r ${stripGrad}`} />
      <div className="p-4">
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${
          paper.source === 'cikmis' ? activeTheme.bg : 'bg-emerald-600'
        }`}>
          {SOURCE_LABELS[paper.source]}
        </span>
        {inProgress && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            S{progress.currentIndex + 1}&apos;de
          </span>
        )}
        {done && progress.score && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            %{Math.round((progress.score.correct / progress.score.total) * 100)}
          </span>
        )}
      </div>

      <h4 className="font-bold text-sm mb-1 line-clamp-2">{paper.title}</h4>
      <p className="text-[10px] text-slate-400 mb-3">{paper.session}</p>

      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
        <span>{paper.questionCount} soru</span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {paper.durationMinutes} dk
        </span>
      </div>

      <div className={`mt-3 flex items-center gap-1 text-xs font-bold ${activeTheme.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
        <Play className="h-3.5 w-3.5" />
        {inProgress ? 'Devam et' : done ? 'Tekrar çöz' : 'Teste başla'}
      </div>
      </div>
    </button>
  );
}
