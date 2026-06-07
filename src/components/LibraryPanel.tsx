import React, { useEffect, useMemo, useRef, useState } from 'react';
import { logSiteEvent } from '../lib/siteTraffic';
import {
  ArrowRight, BookOpen, Filter, Plus, Search, ShieldCheck, Upload, X,
} from 'lucide-react';
import { LIBRARY_COVER } from '../lib/visuals';
import {
  LIBRARY_CATEGORY_LABELS,
  LIBRARY_CATEGORY_ORDER,
  type LibraryCategory,
  type LibraryItem,
  type LibraryReadFormat,
} from '../data/libraryCatalog';
import { LIBRARY_EDITOR_PIN } from '../config/site';
import {
  approveSubmission,
  canEmbedInReader,
  embeddableDomainsHint,
  filterByCategory,
  getAllLibraryItems,
  getPendingSubmissions,
  importDiscoveredItem,
  isEditorSessionActive,
  lockEditorSession,
  rejectSubmission,
  searchLibraryItems,
  submitLibraryItem,
  unlockEditorSession,
} from '../lib/library';
import { discoverFreeResources, type DiscoveredResource } from '../lib/libraryDiscovery';
import { loadCrawlerState, runLibraryCrawlCycle, syncCrawlerWithEditorSession } from '../lib/libraryCrawler';
import { resolveLibraryContent, type LibraryContentResult } from '../lib/libraryContent';
import {
  deepenCoreLearning,
  exportKnowledgeBundle,
  getLearningStats,
  importKnowledgeBundle,
  loadKnowledgeCore,
  processLearningQueue,
  resetCentralAiMotor,
  resumeCentralAiMotor,
  syncLearningWithEditorSession,
} from '../lib/aiCentralLearning';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
  hover: string;
  gradient: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  submitterName: string;
};

const FORMAT_LABELS: Record<LibraryReadFormat, string> = {
  html: 'Web okuma',
  pdf: 'PDF',
  epub: 'E-kitap',
};

const CATEGORY_COLORS: Record<LibraryCategory, string> = {
  bilimsel_makale: 'bg-blue-600',
  ders_kitabi: 'bg-violet-600',
  roman: 'bg-rose-600',
  harita: 'bg-emerald-600',
  ansiklopedi: 'bg-amber-600',
  bilimsel_yayin: 'bg-cyan-600',
  dini_yayin: 'bg-teal-700',
  dini_kitap: 'bg-indigo-700',
};

export default function LibraryPanel({ darkMode, activeTheme, submitterName }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<LibraryCategory | 'all'>('all');
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [reading, setReading] = useState<LibraryItem | null>(null);
  const [readerContent, setReaderContent] = useState<LibraryContentResult | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitOk, setSubmitOk] = useState('');
  const [editorOpen, setEditorOpen] = useState(isEditorSessionActive());
  const [editorPin, setEditorPin] = useState('');
  const [editorError, setEditorError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [discoverQuery, setDiscoverQuery] = useState('education textbook');
  const [discovering, setDiscovering] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<DiscoveredResource[]>([]);
  const [crawlerState, setCrawlerState] = useState(loadCrawlerState);
  const [learningStats, setLearningStats] = useState(getLearningStats);
  const [learningMsg, setLearningMsg] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const lastSearchLog = useRef('');

  const [form, setForm] = useState({
    category: 'bilimsel_makale' as LibraryCategory,
    title: '',
    summary: '',
    url: '',
    author: '',
    tags: '',
  });

  useEffect(() => {
    if (!reading) {
      setReaderContent(null);
      setReaderError('');
      return;
    }
    let cancelled = false;
    setReaderLoading(true);
    setReaderError('');
    resolveLibraryContent(reading)
      .then((result) => {
        if (!cancelled) setReaderContent(result);
      })
      .catch(() => {
        if (!cancelled) {
          setReaderError('İçerik yüklenemedi. Bağlantıyı kontrol edin.');
          setReaderContent({ mode: 'iframe', url: reading.url, reason: 'Yedek' });
        }
      })
      .finally(() => {
        if (!cancelled) setReaderLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reading]);

  const items = useMemo(() => {
    void refresh;
    const all = getAllLibraryItems();
    const byCat = filterByCategory(all, category);
    return searchLibraryItems(query, byCat);
  }, [query, category, refresh]);

  const pending = useMemo(() => {
    void refresh;
    return getPendingSubmissions();
  }, [refresh, editorOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    if (!canEmbedInReader(form.url.trim())) {
      setSubmitOk(`Bu bağlantı kütüphane içinde açılamaz. Yalnızca şu kaynaklar desteklenir: ${embeddableDomainsHint()}`);
      setTimeout(() => setSubmitOk(''), 8000);
      return;
    }
    const submittedTitle = form.title.trim();
    submitLibraryItem({
      category: form.category,
      title: submittedTitle,
      summary: form.summary.trim() || 'Kullanıcı tarafından önerilen kaynak.',
      url: form.url.trim(),
      author: form.author.trim() || submitterName,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      submittedBy: submitterName,
    });
    setForm({ category: 'bilimsel_makale', title: '', summary: '', url: '', author: '', tags: '' });
    setShowSubmit(false);
    setSubmitOk('Öneriniz editör onayına gönderildi. Onaylandıktan sonra kütüphanede görünür.');
    logSiteEvent('library_submit', { tab: 'kutuphane', detail: submittedTitle });
    setRefresh((r) => r + 1);
    setTimeout(() => setSubmitOk(''), 6000);
  };

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || q === lastSearchLog.current) return;
    const timer = setTimeout(() => {
      lastSearchLog.current = q;
      logSiteEvent('library_search', { tab: 'kutuphane', detail: q });
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const tryEditorUnlock = () => {
    if (unlockEditorSession(editorPin, LIBRARY_EDITOR_PIN)) {
      setEditorOpen(true);
      setEditorError('');
      setEditorPin('');
      syncCrawlerWithEditorSession();
      syncLearningWithEditorSession();
      setCrawlerState(loadCrawlerState());
      setLearningStats(getLearningStats());
    } else {
      setEditorError('Geçersiz editör kodu.');
    }
  };

  useEffect(() => {
    if (!editorOpen) return;
    syncCrawlerWithEditorSession();
    syncLearningWithEditorSession();
    const timer = setInterval(() => {
      setCrawlerState(loadCrawlerState());
      setLearningStats(getLearningStats());
    }, 15000);
    return () => clearInterval(timer);
  }, [editorOpen]);

  const refreshLearning = () => setLearningStats(getLearningStats());

  const handleProcessLearning = () => {
    const { processed } = processLearningQueue();
    refreshLearning();
    setLearningMsg(processed > 0 ? `${processed} sohbet sinyali işlendi.` : 'Bekleyen sinyal yok.');
    setTimeout(() => setLearningMsg(''), 5000);
  };

  const handleDeepenLearning = () => {
    const core = deepenCoreLearning();
    refreshLearning();
    setLearningMsg(`Öğrenme derinleştirildi — seviye ${core.depthLevel}.`);
    setTimeout(() => setLearningMsg(''), 5000);
  };

  const handleExportLearning = () => {
    const blob = new Blob([exportKnowledgeBundle()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aikoc-merkezi-zeka-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLearningMsg('Merkezi zeka paketi indirildi.');
    setTimeout(() => setLearningMsg(''), 4000);
  };

  const handleImportLearning = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importKnowledgeBundle(String(reader.result ?? ''));
      refreshLearning();
      setLearningMsg(ok ? 'Merkezi zeka paketi birleştirildi.' : 'İçe aktarma başarısız — geçerli JSON gerekli.');
      setTimeout(() => setLearningMsg(''), 5000);
    };
    reader.readAsText(file);
  };

  const coreManifest = editorOpen ? loadKnowledgeCore().sourceManifest : null;

  const runDiscover = async () => {
    setDiscovering(true);
    try {
      const results = await discoverFreeResources(discoverQuery.trim() || 'education', { limit: 8 });
      setDiscoverResults(results);
      logSiteEvent('library_discover', { tab: 'kutuphane', detail: discoverQuery });
    } finally {
      setDiscovering(false);
    }
  };

  const importAllDiscovered = () => {
    let n = 0;
    for (const item of discoverResults) {
      if (importDiscoveredItem(item)) n += 1;
    }
    setRefresh((r) => r + 1);
    setDiscoverResults([]);
    setCrawlerState(loadCrawlerState());
    if (n > 0) setSubmitOk(`${n} kaynak kütüphaneye eklendi.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
        <h2 className="font-extrabold text-xl tracking-tight uppercase mb-1">Açık Erişim Kütüphanesi</h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mb-4">
          Ücretsiz kitaplar ve makaleler — doğrudan okuyun; portal veya site ana sayfası değil, tam metin bağlantıları.
        </p>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kelime ile ara (ör: çalıkuşu, fizik ders kitabı, transformer makalesi)..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${activeTheme.bg} ${activeTheme.hover}`}
          >
            <Plus className="h-4 w-4" />
            Kaynak Öner
          </button>
        </div>

        {submitOk && (
          <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{submitOk}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
              category === 'all' ? `${activeTheme.bg} text-white` : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Tümü
          </button>
          {LIBRARY_CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${
                category === cat ? `${activeTheme.bg} text-white` : darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {LIBRARY_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 font-semibold">{items.length} kaynak listeleniyor</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => {
          const cover = LIBRARY_COVER[item.category];
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelected(item);
                logSiteEvent('library_view', { tab: 'kutuphane', detail: item.title });
              }}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(item)}
              className={`visual-card group cursor-pointer ${
                darkMode ? 'bg-slate-800/30 border-slate-700/40' : 'bg-white border-slate-100'
              }`}
            >
              <div className={`cover-art bg-gradient-to-br ${cover.gradient} ring-1 ${cover.ring}`}>
                <span className="cover-art-glyph">{cover.glyph}</span>
                <span className="absolute left-3 top-3 text-[10px] font-extrabold px-2.5 py-1 rounded-md text-white bg-black/25 backdrop-blur-sm">
                  {LIBRARY_CATEGORY_LABELS[item.category]}
                </span>
                <span className="absolute right-3 top-3 text-[10px] font-bold text-white/80">{FORMAT_LABELS[item.format]}</span>
              </div>
              <div className="p-5">
                <h3 className="font-extrabold text-sm mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">{item.summary}</p>
                <div className="flex justify-between items-center border-t pt-3 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 opacity-60" />
                    {item.author} · {item.language}
                  </span>
                  <span className={`inline-flex items-center gap-1 ${activeTheme.text} group-hover:gap-2 transition-all`}>
                    Oku
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className={`empty-state-art text-center py-12 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className={`inline-flex p-4 rounded-2xl mb-3 ${activeTheme.lightBg}`}>
            <BookOpen className={`h-10 w-10 ${activeTheme.text} opacity-70`} />
          </div>
          <p className="text-sm text-slate-500">Aramanızla eşleşen kaynak bulunamadı. Farklı kelimeler deneyin.</p>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl p-6 md:p-8 overflow-y-auto modal-safe shadow-2xl relative ${
            darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 text-white rounded-md ${CATEGORY_COLORS[selected.category]}`}>
              {LIBRARY_CATEGORY_LABELS[selected.category]}
            </span>
            <h2 className="font-extrabold text-lg md:text-xl mt-4 mb-2">{selected.title}</h2>
            <p className="text-[11px] font-bold text-slate-400 mb-4">
              {selected.author} · {selected.source}
              {selected.year ? ` · ${selected.year}` : ''} · {FORMAT_LABELS[selected.format]}
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-4">{selected.summary}</p>
            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setReading(selected);
                  setSelected(null);
                  logSiteEvent('library_read', { tab: 'kutuphane', detail: selected.title });
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs ${activeTheme.bg} ${activeTheme.hover}`}
              >
                <BookOpen className="h-4 w-4" />
                Kütüphanede Oku
              </button>
            </div>
          </div>
        </div>
      )}

      {reading && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex flex-col safe-area-top">
          <div className={`reader-safe-top flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0 ${
            darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="min-w-0">
              <p className="font-extrabold text-sm truncate">{reading.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{reading.author} · {FORMAT_LABELS[reading.format]}</p>
            </div>
            <button
              type="button"
              onClick={() => setReading(null)}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              aria-label="Okuyucuyu kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={`flex-1 min-h-0 relative ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {readerLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 z-10">
                Kitap yükleniyor…
              </div>
            )}
            {readerError && (
              <p className="absolute top-2 left-4 right-4 text-xs text-amber-600 z-10">{readerError}</p>
            )}
            {readerContent?.mode === 'html' ? (
              <iframe
                title={reading.title}
                srcDoc={readerContent.html}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-same-origin"
              />
            ) : (
              <iframe
                title={reading.title}
                src={readerContent?.mode === 'iframe' ? readerContent.url : reading.url}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        </div>
      )}

      {showSubmit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl relative ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <button type="button" onClick={() => setShowSubmit(false)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-extrabold text-lg mb-1 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Kütüphaneye Kaynak Öner
            </h3>
            <p className="text-xs text-slate-500 mb-4">Öneriniz editör onayına sunulur; onaylandıktan sonra herkese açılır.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as LibraryCategory })}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              >
                {LIBRARY_CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>{LIBRARY_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <input
                required
                placeholder="Başlık"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <input
                required
                type="url"
                placeholder="Doğrudan okuma linki (kitap bölümü, makale veya PDF)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <textarea
                placeholder="Kısa açıklama"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={3}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <input
                placeholder="Yazar / kurum (isteğe bağlı)"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <input
                placeholder="Etiketler (virgülle: fizik, tyt, ücretsiz)"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={`w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              />
              <button type="submit" className={`w-full py-2.5 rounded-xl text-white font-bold text-sm ${activeTheme.bg}`}>
                Editör Onayına Gönder
              </button>
            </form>
          </div>
        </div>
      )}

      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Editör / Admin Onayı
          </h3>
          {editorOpen ? (
            <button type="button" onClick={() => { lockEditorSession(); syncCrawlerWithEditorSession(); syncLearningWithEditorSession(); setEditorOpen(false); setCrawlerState(loadCrawlerState()); }} className="text-xs text-rose-500 font-bold">
              Editör çıkışı
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Editör kodu"
                value={editorPin}
                onChange={(e) => setEditorPin(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              />
              <button type="button" onClick={tryEditorUnlock} className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white ${activeTheme.bg}`}>
                Giriş
              </button>
            </div>
          )}
        </div>
        {editorError && <p className="text-xs text-rose-500 mt-2">{editorError}</p>}
        {editorOpen && (
          <div className="mt-4 space-y-3">
            <div className={`p-4 rounded-xl border ${darkMode ? 'border-cyan-900/50 bg-cyan-950/20' : 'border-cyan-200 bg-cyan-50/50'}`}>
              <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-2">🤖 AI Kütüphane Araştırmacısı</p>
              <p className="text-[10px] text-slate-500 mb-3">
                Admin bilgisayarı açık ve editör oturumu aktifken site, OpenAlex ve Gutenberg üzerinden ücretsiz kaynakları arar;
                başlık ve özetleri Türkçeye çevirip kütüphaneye ekler.
              </p>
              {crawlerState.active && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-2">
                  Arka plan taraması aktif · Toplam {crawlerState.totalImported} kaynak · Son: {crawlerState.lastAdded} eklendi
                </p>
              )}
              {crawlerState.logs[0] && (
                <p className="text-[10px] text-slate-400 mb-2 truncate">{crawlerState.logs[0]}</p>
              )}
              <div className="flex gap-2 flex-wrap mb-3">
                <input
                  type="text"
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  placeholder="Ara: physics textbook, roman, makale…"
                  className={`flex-1 min-w-[160px] text-xs px-3 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                />
                <button
                  type="button"
                  disabled={discovering}
                  onClick={() => void runDiscover()}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white ${activeTheme.bg} disabled:opacity-50`}
                >
                  {discovering ? 'Aranıyor…' : 'İnternetten Ara'}
                </button>
                <button
                  type="button"
                  onClick={() => void runLibraryCrawlCycle().then(setCrawlerState)}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-300 dark:border-slate-600"
                >
                  Şimdi Tara
                </button>
              </div>
              {discoverResults.length > 0 && (
                <div className="space-y-2 mb-2">
                  {discoverResults.map((d) => (
                    <div key={d.url} className={`text-[10px] p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>
                      <p className="font-bold">{d.title}</p>
                      <p className="text-slate-500 line-clamp-1">{d.summary}</p>
                      <p className="text-sky-500 truncate">{d.url}</p>
                    </div>
                  ))}
                  <button type="button" onClick={importAllDiscovered} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold w-full">
                    {discoverResults.length} kaynağı kütüphaneye ekle
                  </button>
                </div>
              )}
            </div>
            <div className={`p-4 rounded-xl border ${darkMode ? 'border-violet-900/50 bg-violet-950/20' : 'border-violet-200 bg-violet-50/50'}`}>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-2">🧠 Merkezi Yapay Zeka Öğrenme Döngüsü</p>
              <p className="text-[10px] text-slate-500 mb-3">
                Tüm kullanıcıların AI koç sohbetleri otomatik işlenir (admin girişi veya editör oturumu). Tam sıfırlama için Admin sekmesini kullanın.
              </p>
              {learningStats.bypassed && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-2 font-bold">
                  ⚠ Baypas aktif — öğrenilmiş model koça uygulanmıyor.
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mb-3">
                <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>Derinlik: <strong>{learningStats.depthLevel}</strong></span>
                <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>Sinyal: <strong>{learningStats.totalProcessed}</strong></span>
                <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>Kuyruk: <strong>{learningStats.queuePending}</strong></span>
                <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>Kalıp: <strong>{learningStats.humanPatterns + learningStats.societyPatterns + learningStats.machinePatterns}</strong></span>
              </div>
              <div className="flex gap-2 flex-wrap mb-2">
                <button type="button" onClick={handleProcessLearning} className="text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-300 dark:border-slate-600">
                  Öğrenmeyi İşle
                </button>
                <button type="button" onClick={handleDeepenLearning} className={`text-xs px-3 py-1.5 rounded-lg font-bold text-white ${activeTheme.bg}`}>
                  Derinleştir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetCentralAiMotor('Editör panelinden sıfırlama');
                    refreshLearning();
                    setLearningMsg('AI motoru sıfırlandı ve baypasa alındı.');
                    setTimeout(() => setLearningMsg(''), 5000);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-bold bg-rose-600 text-white"
                >
                  Sıfırla & Baypas
                </button>
                {learningStats.bypassed && (
                  <button
                    type="button"
                    onClick={() => {
                      resumeCentralAiMotor();
                      refreshLearning();
                      setLearningMsg('Öğrenme yeniden açıldı.');
                      setTimeout(() => setLearningMsg(''), 4000);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold border border-emerald-500 text-emerald-600"
                  >
                    Öğrenmeyi Aç
                  </button>
                )}
                <button type="button" onClick={handleExportLearning} className="text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-300 dark:border-slate-600">
                  Dışa Aktar
                </button>
                <button type="button" onClick={() => importFileRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg font-bold border border-slate-300 dark:border-slate-600">
                  İçe Aktar
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImportLearning(f);
                    e.target.value = '';
                  }}
                />
              </div>
              {learningMsg && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-2">{learningMsg}</p>}
              {coreManifest && coreManifest.modules.some((m) => m.behaviors.length > 0) && (
                <div className={`text-[10px] p-2 rounded-lg max-h-32 overflow-y-auto ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>
                  <p className="font-bold text-slate-500 mb-1">Admin kaynak manifesti (özet)</p>
                  {coreManifest.modules.map((mod) => (
                    mod.behaviors[0] ? (
                      <p key={mod.name} className="text-slate-400 truncate">
                        {mod.name}: {mod.behaviors[0]}
                      </p>
                    ) : null
                  ))}
                </div>
              )}
            </div>
            {pending.length === 0 ? (
              <p className="text-xs text-slate-500">Onay bekleyen öneri yok.</p>
            ) : (
              pending.map((sub) => (
                <div key={sub.id} className={`p-4 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                  <p className="text-xs font-bold text-slate-400">{LIBRARY_CATEGORY_LABELS[sub.category]} · {sub.submittedBy}</p>
                  <p className="font-bold text-sm mt-1">{sub.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.summary}</p>
                  <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-500 break-all">{sub.url}</a>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => { approveSubmission(sub.id); setRefresh((r) => r + 1); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => { rejectSubmission(sub.id); setRefresh((r) => r + 1); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {!editorOpen && pending.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{pending.length} öneri editör onayı bekliyor.</p>
        )}
      </div>
    </div>
  );
}
