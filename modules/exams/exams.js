import { getItem, setItem } from '../../lib/storage.js';
import { scopedGet, scopedSet } from '../../lib/guest-session.js';
import { getAIEngine } from '../../lib/ai-engine.js';
import { renderExamsStats } from '../../lib/page-stats.js';
import { mountExamPdfView } from '../../lib/exam-pdf-view.js?v=20260618i';
import { assertMemberOrDemo, markDemoConsumed, isMemberLoggedIn } from '../../lib/guest-session.js';

const GROUP_PRIORITY = ['AYT', 'AÖL', 'YGS', 'LYS-1', 'LYS-2', 'LYS-3', 'LYS-4', 'LYS-5', 'ÖSS', 'YDS', 'ÖSYS'];

let catalog = [];
let filteredCatalog = [];
let examGroups = [];
let selectedGroup = null;
let selectedEntry = null;
let questions = [];
let answerKeyMap = {};
let index = 0;
let timerId = null;
let seconds = 0;
let answered = {};
let unmountPdfView = null;
let hashListener = null;
let sessionReloadListener = null;

function getExamRoute() {
  const raw = location.hash.slice(1) || '/';
  const qIdx = raw.indexOf('?');
  const path = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const params = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '');
  return {
    path,
    tur: params.get('tur') || '',
    kitap: params.get('kitap') || '',
  };
}

function setExamRoute({ tur = '', kitap = '' } = {}) {
  let hash = '#/sinavlar';
  if (kitap) hash += `?kitap=${encodeURIComponent(kitap)}`;
  else if (tur) hash += `?tur=${encodeURIComponent(tur)}`;
  if (location.hash !== hash) location.hash = hash;
  else syncViewFromRoute();
}

const AYT_SECTIONS = [
  { id: 'tdes1', label: 'TDE-Sosyal Bilimler 1', size: 40 },
  { id: 'sos2', label: 'Sosyal Bilimler 2', size: 40 },
  { id: 'mat', label: 'Matematik', size: 40 },
  { id: 'fen', label: 'Fen Bilimleri', size: 40 },
];

const AOL_SECTIONS = [
  { id: 'd1', label: '1. Ders', size: 10 },
  { id: 'd2', label: '2. Ders', size: 10 },
  { id: 'd3', label: '3. Ders', size: 10 },
];

const QUESTIONS_PER_PDF_PAGE = 3;

function clusterParsedBySections(parsed, sectionCount) {
  if (!parsed?.length) return Array.from({ length: sectionCount }, () => []);
  const sorted = [...parsed].sort(
    (a, b) => (a.pdfPage || 0) - (b.pdfPage || 0) || a.number - b.number,
  );
  const clusters = [[]];
  for (const q of sorted) {
    const cur = clusters[clusters.length - 1];
    if (cur.length) {
      const prev = cur[cur.length - 1];
      if (q.number < prev.number && q.number <= 15) clusters.push([]);
    }
    clusters[clusters.length - 1].push(q);
  }
  while (clusters.length < sectionCount) clusters.push([]);
  if (clusters.length > sectionCount) {
    const extra = clusters.splice(sectionCount);
    for (const group of extra) {
      clusters[sectionCount - 1].push(...group);
    }
  }
  return clusters;
}

function estimateSectionStartPage(sectionIndex, clusters, sections) {
  if (sectionIndex <= 0) {
    const firstCluster = clusters[0] || [];
    if (!firstCluster.length) return 1;
    const anchor = [...firstCluster].sort((a, b) => a.number - b.number)[0];
    return Math.max(
      1,
      (anchor.pdfPage || 1) - Math.floor(((anchor.number || 1) - 1) / QUESTIONS_PER_PDF_PAGE),
    );
  }

  const prevCluster = clusters[sectionIndex - 1] || [];
  if (prevCluster.length) {
    const maxPage = Math.max(...prevCluster.map((q) => q.pdfPage || 1));
    const maxNum = Math.max(...prevCluster.map((q) => q.number).filter((n) => n > 0));
    const prevSize = sections[sectionIndex - 1]?.size || 40;
    return maxPage + Math.max(1, Math.ceil((prevSize - maxNum) / QUESTIONS_PER_PDF_PAGE));
  }

  let page = 1;
  for (let i = 0; i < sectionIndex; i += 1) {
    page += Math.ceil((sections[i]?.size || 40) / QUESTIONS_PER_PDF_PAGE) + 1;
  }
  return page;
}

function detectTestStartPage(parsed) {
  if (!parsed?.length) return 1;
  const sorted = [...parsed].sort((a, b) => a.number - b.number);
  const anchor = sorted.find((q) => q.number === 1) || sorted[0];
  return Math.max(
    1,
    (anchor.pdfPage || 1) - Math.floor(((anchor.number || 1) - 1) / QUESTIONS_PER_PDF_PAGE),
  );
}

function resolvePdfPage(parsedList, questionNumber, sectionStartPage) {
  const byNum = new Map();
  for (const q of parsedList || []) {
    if (q.number > 0 && q.number <= 200) {
      const existing = byNum.get(q.number);
      if (!existing || (q.pdfPage || 0) >= (existing.pdfPage || 0)) byNum.set(q.number, q);
    }
  }
  if (byNum.has(questionNumber)) return Math.max(1, byNum.get(questionNumber).pdfPage || 1);

  const nums = [...byNum.keys()].sort((a, b) => a - b);
  if (!nums.length) {
    return Math.max(1, sectionStartPage + Math.floor((questionNumber - 1) / QUESTIONS_PER_PDF_PAGE));
  }

  let lower = null;
  let upper = null;
  for (const n of nums) {
    if (n <= questionNumber) lower = n;
    if (n >= questionNumber && upper === null) upper = n;
  }

  if (lower !== null && upper !== null && lower !== upper) {
    const lp = byNum.get(lower).pdfPage || 1;
    const up = byNum.get(upper).pdfPage || 1;
    const t = (questionNumber - lower) / (upper - lower);
    return Math.max(1, Math.round(lp + t * (up - lp)));
  }
  if (lower !== null) {
    return Math.max(
      1,
      (byNum.get(lower).pdfPage || 1) + Math.floor((questionNumber - lower) / QUESTIONS_PER_PDF_PAGE),
    );
  }
  if (upper !== null) {
    return Math.max(
      1,
      (byNum.get(upper).pdfPage || 1) - Math.floor((upper - questionNumber) / QUESTIONS_PER_PDF_PAGE),
    );
  }
  return Math.max(1, sectionStartPage + Math.floor((questionNumber - 1) / QUESTIONS_PER_PDF_PAGE));
}

function isMultiSectionExam(entry) {
  const t = (entry?.examType || '').toUpperCase();
  return t === 'AYT' || t === 'AÖL' || t === 'AOL';
}

function getExamSections(entry, payload) {
  if (payload?.sections?.length >= 2) {
    return payload.sections.map((s) => ({
      id: s.id,
      label: s.label,
      size: s.size,
      startPage: s.startPage,
      endPage: s.endPage,
    }));
  }
  const t = (entry?.examType || '').toUpperCase();
  if (t === 'AYT') return AYT_SECTIONS;
  if (t === 'AÖL' || t === 'AOL') return AOL_SECTIONS;
  return [{ id: 'main', label: entry?.subject || 'Test', size: 40 }];
}

function pdfPageFromSectionMap(sectionPageMaps, sectionId, questionNumber, fallback = 1) {
  const map = sectionPageMaps?.[sectionId];
  if (!map) return fallback;
  return map[questionNumber] ?? map[String(questionNumber)] ?? fallback;
}

/** Tek test kitapçığında gerçek soru adedi (çoğu ÖSYM testi 40). */
function detectSingleTestSize(keyMap, parsedQuestions) {
  const keyNums = Object.keys(keyMap)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  if (keyNums.length) {
    let run = 0;
    for (let i = 0; i < keyNums.length; i += 1) {
      if (keyNums[i] === i + 1) run = i + 1;
      else break;
    }
    if (run >= 10) return Math.min(run, 40);
    if (keyNums[0] === 1 && keyNums[keyNums.length - 1] > 40) return 40;
  }

  const parsedNums = parsedQuestions.map((q) => q.number).filter((n) => n > 0 && n <= 40);
  if (parsedNums.length) return 40;

  return 40;
}

function inferQuestionCount(data, entry) {
  if (isMultiSectionExam(entry)) {
    const sections = getExamSections(entry, data);
    return sections.reduce((sum, s) => sum + s.size, 0);
  }
  return detectSingleTestSize(data?.answerKey || {}, data?.questions || []);
}

function usesPdfPractice(entry) {
  return Boolean(entry?.pdfUrl);
}

function makeQuestion(entry, payload, { id, number, section, sectionLabel, parsed, answer, pdfPage }) {
  const resolvedPage = pdfPage ?? parsed?.pdfPage ?? 1;
  return {
    id,
    number,
    bookletNumber: number,
    section: section || null,
    sectionLabel: sectionLabel || null,
    subject: payload?.subject || entry.subject,
    topic: payload?.exam || entry.examType,
    difficulty: 'orta',
    question: parsed?.question || null,
    options: parsed?.options || null,
    answer: answer || parsed?.answer || null,
    solution: (answer || parsed?.answer) ? `Cevap anahtarı: ${answer || parsed?.answer}` : null,
    imageUrl: null,
    pdfPage: Math.max(1, resolvedPage),
    tags: [entry.organizer || 'osym', String(payload?.year || entry.year || ''), entry.examType || ''].filter(Boolean),
  };
}

function buildMultiSectionQuestions(payload, entry, keyMap) {
  const sections = getExamSections(entry, payload);
  const pageMaps = payload.sectionPageMaps;

  if (pageMaps && Object.keys(pageMaps).length >= 2) {
    const questions = [];
    for (const sec of sections) {
      const secStart = sec.startPage || 1;
      for (let n = 1; n <= sec.size; n += 1) {
        const pdfPage = pdfPageFromSectionMap(pageMaps, sec.id, n, secStart);
        const p =
          (payload.questions || []).find(
            (q) => q.section === sec.id && q.number === n,
          ) ||
          (payload.questions || []).find((q) => q.number === n && q.pdfPage === pdfPage) ||
          null;
        questions.push(
          makeQuestion(entry, payload, {
            id: `${entry.id}-${sec.id}-q${n}`,
            number: n,
            section: sec.id,
            sectionLabel: sec.label,
            parsed: p,
            answer: p?.answer || keyMap[n] || null,
            pdfPage,
          }),
        );
      }
    }
    return questions;
  }

  const parsed = payload.questions || [];
  const sectionClusters = clusterParsedBySections(parsed, sections.length);
  const questions = [];

  for (let si = 0; si < sections.length; si += 1) {
    const sec = sections[si];
    const secParsed = sectionClusters[si] || [];
    const secStart = estimateSectionStartPage(si, sectionClusters, sections);

    for (let n = 1; n <= sec.size; n += 1) {
      const p = secParsed.find((q) => q.number === n) || null;
      const page = resolvePdfPage(secParsed, n, secStart);
      questions.push(
        makeQuestion(entry, payload, {
          id: `${entry.id}-${sec.id}-q${n}`,
          number: n,
          section: sec.id,
          sectionLabel: sec.label,
          parsed: p,
          answer: p?.answer || keyMap[n] || null,
          pdfPage: page,
        }),
      );
    }
  }

  return questions;
}

function buildSingleTestQuestions(payload, entry, keyMap) {
  const parsed = payload.questions || [];
  const testSize = detectSingleTestSize(keyMap, parsed);
  const testStart = detectTestStartPage(parsed);
  const questions = [];

  for (let n = 1; n <= testSize; n += 1) {
    const p = parsed.find((q) => q.number === n) || null;
    const page = resolvePdfPage(parsed, n, testStart);
    questions.push(
      makeQuestion(entry, payload, {
        id: `${entry.id}-q${n}`,
        number: n,
        parsed: p,
        answer: keyMap[n] || p?.answer || null,
        pdfPage: page,
      }),
    );
  }

  return questions;
}

function buildQuestionsFromPayload(data, entry, keyMap) {
  const payload = data || {};

  if (isMultiSectionExam(entry)) {
    return buildMultiSectionQuestions(payload, entry, keyMap);
  }

  if (usesPdfPractice(entry) || Object.keys(keyMap).length || (payload.questions || []).length) {
    return buildSingleTestQuestions(payload, entry, keyMap);
  }

  return (payload.questions || []).map((q) =>
    makeQuestion(entry, payload, {
      id: q.id || `${entry.id}-q${q.number}`,
      number: q.number,
      parsed: q,
      answer: q.answer,
      pdfPage: q.pdfPage,
    }),
  );
}

function mergeAnswerKeyFromPayload(data) {
  const keyMap = {};
  const raw = data.answerKey || {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^[A-E]$/.test(v)) keyMap[Number(k)] = v;
  }
  for (const q of data.questions || []) {
    if (q.answer && /^[A-E]$/.test(q.answer)) keyMap[q.number] = q.answer;
  }
  return keyMap;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultStats() {
  return {
    correct: 0,
    wrong: 0,
    blank: 0,
    sessions: 0,
    byExam: {},
  };
}

function getStats() {
  const raw = scopedGet('exam_stats', defaultStats());
  return { ...defaultStats(), ...raw, byExam: raw.byExam || {} };
}

function saveStats(stats) {
  scopedSet('exam_stats', stats);
}

function getWrongBank() {
  return scopedGet('exam_wrong_bank', []);
}

function addWrong(q) {
  const bank = getWrongBank();
  if (!bank.find((x) => x.id === q.id)) {
    bank.push({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      examId: selectedEntry?.id,
      question: (q.question || '').slice(0, 200),
    });
    scopedSet('exam_wrong_bank', bank.slice(-100));
  }
}

function computeSessionStats() {
  let correct = 0;
  let wrong = 0;
  let neutral = 0;

  for (const q of questions) {
    const a = answered[q.id];
    if (!a) continue;
    if (!q.answer) {
      neutral += 1;
      continue;
    }
    if (a.choice === q.answer) correct += 1;
    else wrong += 1;
  }

  const scorable = questions.filter((q) => q.answer).length;
  const answeredScorable = correct + wrong;
  const blank = Math.max(0, scorable - answeredScorable);
  const net = Math.round((correct - wrong / 4) * 100) / 100;

  return {
    correct,
    wrong,
    blank,
    neutral,
    net,
    total: questions.length,
    scorable,
    answered: answeredScorable + neutral,
  };
}

function formatNet(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function buildExamGroups() {
  const map = new Map();
  for (const entry of catalog) {
    const type = entry.examType || 'Diğer';
    if (!map.has(type)) {
      map.set(type, {
        examType: type,
        label: type,
        count: 0,
        parsed: 0,
        minYear: entry.year,
        maxYear: entry.year,
        entries: [],
      });
    }
    const g = map.get(type);
    g.count += 1;
    if (entry.parsed) g.parsed += 1;
    g.minYear = Math.min(g.minYear, entry.year);
    g.maxYear = Math.max(g.maxYear, entry.year);
    g.entries.push(entry);
  }

  examGroups = [...map.values()].sort((a, b) => {
    const ai = GROUP_PRIORITY.indexOf(a.examType);
    const bi = GROUP_PRIORITY.indexOf(b.examType);
    const ap = ai === -1 ? 99 : ai;
    const bp = bi === -1 ? 99 : bi;
    if (ap !== bp) return ap - bp;
    return a.examType.localeCompare(b.examType, 'tr');
  });
}

function groupDescription(type) {
  if (type === 'AYT') return 'Alan Yeterlilik Testi · YKS (2018–günümüz)';
  if (type === 'AÖL') return 'Açık Öğretim Lisesi · MEB';
  if (type === 'YGS') return 'Temel Yeterlilik · ÖSYS';
  if (type.startsWith('LYS')) return 'Alan testleri · ÖSYS';
  if (type === 'ÖSS') return 'Öğrenci Seçme Sınavı';
  return 'Çıkmış soru kitapçıkları';
}

function renderExamGroups() {
  const grid = document.getElementById('exam-group-grid');
  const countEl = document.getElementById('exam-group-count');
  const q = (document.getElementById('exam-group-search')?.value || '').toLowerCase().trim();

  const groups = examGroups.filter((g) => {
    if (!q) return true;
    const hay = `${g.examType} ${groupDescription(g.examType)}`.toLowerCase();
    return hay.includes(q);
  });

  if (countEl) countEl.textContent = `${groups.length} sınav türü`;

  if (!grid) return;

  if (!groups.length) {
    grid.innerHTML = '<p class="empty-state">Aramanıza uygun sınav türü bulunamadı.</p>';
    return;
  }

  grid.innerHTML = groups
    .map(
      (g) => `
    <button type="button" class="card exam-group-card" data-tur="${escapeHtml(g.examType)}" role="listitem">
      <strong class="exam-group-title">${escapeHtml(g.examType)}</strong>
      <span class="exam-group-meta">${escapeHtml(groupDescription(g.examType))}</span>
      <span class="exam-group-stats">${g.count} kitapçık · ${g.minYear}–${g.maxYear}</span>
    </button>
  `,
    )
    .join('');

  grid.querySelectorAll('.exam-group-card').forEach((btn) => {
    btn.addEventListener('click', () => setExamRoute({ tur: btn.dataset.tur }));
  });
}

async function loadCatalog() {
  const res = await fetch(`data/osym-exams-index.json?v=${Date.now()}`);
  if (!res.ok) throw new Error('Sınav indeksi yüklenemedi');
  const data = await res.json();
  catalog = data.entries || [];
  buildExamGroups();
  filteredCatalog = [...catalog];
}

function applyCatalogFilters() {
  const q = (document.getElementById('exam-search')?.value || '').toLowerCase().trim();
  const year = document.getElementById('exam-year-filter')?.value || '';

  const base = selectedGroup
    ? catalog.filter((e) => e.examType === selectedGroup)
    : catalog;

  filteredCatalog = base.filter((e) => {
    if (year && String(e.year) !== year) return false;
    if (!q) return true;
    const hay = `${e.year} ${e.shortName} ${e.name} ${e.session} ${e.subject}`.toLowerCase();
    return hay.includes(q);
  });

  filteredCatalog.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const n = a.name.localeCompare(b.name, 'tr');
    if (n !== 0) return n;
    return (a.session || '').localeCompare(b.session || '', 'tr');
  });

  renderCatalog();
}

function populateYearFilter() {
  const yearSel = document.getElementById('exam-year-filter');
  if (!yearSel) return;
  const years = [
    ...new Set(
      catalog.filter((e) => !selectedGroup || e.examType === selectedGroup).map((e) => e.year),
    ),
  ].sort((a, b) => b - a);

  const current = yearSel.value;
  yearSel.innerHTML = '<option value="">Tüm yıllar</option>';
  years.forEach((y) => {
    const o = document.createElement('option');
    o.value = String(y);
    o.textContent = String(y);
    yearSel.appendChild(o);
  });
  if (current && years.includes(Number(current))) yearSel.value = current;
}

function renderCatalog() {
  const list = document.getElementById('exam-catalog-list');
  const count = document.getElementById('exam-count');
  if (count) count.textContent = `${filteredCatalog.length} kitapçık`;

  if (!list) return;

  if (!filteredCatalog.length) {
    list.innerHTML = '<p class="empty-state">Filtreye uygun kitapçık bulunamadı.</p>';
    return;
  }

  list.innerHTML = filteredCatalog
    .map(
      (e) => `
    <button type="button" class="exam-catalog-row ${selectedEntry?.id === e.id ? 'active' : ''}" data-id="${e.id}" role="listitem">
      <span class="col-year">${e.year}</span>
      <span class="col-name"><strong>${escapeHtml(e.shortName)} · ${escapeHtml(e.subject)}</strong><span>${escapeHtml(e.name)}</span></span>
      <span class="col-session">${escapeHtml(e.session)}</span>
      <span class="col-org">${e.questionCount ? `${e.questionCount} soru` : e.parsed ? '—' : 'PDF'}</span>
    </button>
  `,
    )
    .join('');

  list.querySelectorAll('.exam-catalog-row').forEach((btn) => {
    btn.addEventListener('click', () => setExamRoute({ tur: selectedGroup, kitap: btn.dataset.id }));
  });
}

function updateBreadcrumb(parts) {
  const el = document.getElementById('exam-breadcrumb');
  const backBtn = document.getElementById('exam-back-btn');
  if (backBtn) {
    if (parts.length > 1) backBtn.classList.remove('panel-hidden');
    else backBtn.classList.add('panel-hidden');
  }
  if (el) {
    el.innerHTML = parts.map((p) => `<span>${escapeHtml(p)}</span>`).join('<span class="exam-bc-sep">›</span>');
  }
}

function showGroupsView() {
  selectedGroup = null;
  selectedEntry = null;
  document.getElementById('exam-groups-view')?.classList.remove('panel-hidden');
  document.getElementById('exam-list-view')?.classList.add('panel-hidden');
  document.getElementById('exam-practice')?.classList.add('panel-hidden');
  updateBreadcrumb(['Sınav türleri']);
  renderExamGroups();
  renderExamsStats('page-stats-exams', catalog);
}

function showListView(tur) {
  selectedGroup = tur;
  selectedEntry = null;
  if (unmountPdfView) {
    unmountPdfView();
    unmountPdfView = null;
  }
  stopTimer();
  document.getElementById('exam-groups-view')?.classList.add('panel-hidden');
  document.getElementById('exam-list-view')?.classList.remove('panel-hidden');
  document.getElementById('exam-practice')?.classList.add('panel-hidden');
  updateBreadcrumb(['Sınav türleri', tur]);
  populateYearFilter();
  applyCatalogFilters();
  renderExamsStats('page-stats-exams', catalog);
}

async function openPracticeView(id) {
  if (!assertMemberOrDemo('exams')) return;
  if (!isMemberLoggedIn()) markDemoConsumed('exams');
  await selectExam(id);
}

function syncViewFromRoute() {
  const { tur, kitap } = getExamRoute();
  if (kitap) {
    const entry = catalog.find((e) => e.id === kitap);
    if (entry) {
      selectedGroup = entry.examType;
      openPracticeView(kitap);
      return;
    }
    setExamRoute({ tur });
    return;
  }
  if (tur) {
    showListView(tur);
    return;
  }
  showGroupsView();
}

function goBack() {
  const { tur, kitap } = getExamRoute();
  if (kitap) setExamRoute({ tur: selectedGroup || tur });
  else if (tur) setExamRoute({});
  else history.back();
}

async function selectExam(id) {
  selectedEntry = catalog.find((e) => e.id === id);
  if (!selectedEntry) return;

  selectedGroup = selectedEntry.examType;
  questions = [];
  answerKeyMap = {};
  let data = null;

  const qPath = selectedEntry.questionFile;
  if (qPath) {
    try {
      const res = await fetch(qPath);
      if (res.ok) data = await res.json();
    } catch {
      /* soru dosyası yoksa PDF ile devam */
    }
  }

  if (data) answerKeyMap = mergeAnswerKeyFromPayload(data);

  if (usesPdfPractice(selectedEntry)) {
    questions = buildQuestionsFromPayload(data, selectedEntry, answerKeyMap);
  } else if (data?.questions?.length) {
    questions = data.questions.map((q) => ({ ...q, id: q.id || `${id}-q${q.number}` }));
    for (const q of questions) {
      if (q.answer && /^[A-E]$/.test(q.answer)) answerKeyMap[q.number] = q.answer;
    }
  }

  index = 0;
  answered = {};
  seconds = 0;

  const stats = getStats();
  stats.sessions = (stats.sessions || 0) + 1;
  saveStats(stats);

  const info = document.getElementById('exam-selected-info');
  if (info) {
    const pdfLink = selectedEntry.pdfUrl
      ? `<a href="${escapeHtml(selectedEntry.pdfUrl)}" target="_blank" rel="noopener noreferrer">Resmî PDF kitapçığı</a>`
      : '';
    const keyTotal = Object.keys(answerKeyMap).length;
    const withAnswer = questions.filter((q) => q.answer).length;
    const qNote = questions.length
      ? `${questions.length} soru · ${withAnswer} cevap anahtarı${keyTotal ? ` (PDF: ${keyTotal})` : ''} — şıkkınızı işaretleyin`
      : 'Kitapçık yükleniyor…';
    const sourceLink = selectedEntry.sourceUrl
      ? `<a href="${escapeHtml(selectedEntry.sourceUrl)}" target="_blank" rel="noopener noreferrer">Kaynak</a>`
      : '';
    info.innerHTML = `
      <h3>${escapeHtml(selectedEntry.label)}</h3>
      <p class="meta">${escapeHtml(selectedEntry.organizer)} · ${escapeHtml(selectedEntry.examType)} · ${qNote}</p>
      <p class="meta exam-source-note">${[pdfLink, sourceLink].filter(Boolean).join(' · ')}</p>
    `;
  }

  document.getElementById('exam-groups-view')?.classList.add('panel-hidden');
  document.getElementById('exam-list-view')?.classList.add('panel-hidden');
  document.getElementById('exam-practice')?.classList.remove('panel-hidden');
  updateBreadcrumb(['Sınav türleri', selectedEntry.examType, selectedEntry.label]);

  if (!questions.length) {
    const area = document.getElementById('exam-question-area');
    document.getElementById('exam-session-stats')?.replaceChildren();
    document.getElementById('exam-question-palette')?.setAttribute('hidden', '');
    document.getElementById('exam-progress-wrap')?.setAttribute('hidden', '');
    if (area) {
      area.innerHTML = `
        <p class="empty-state">Bu kitapçık için dijital soru bankası henüz hazır değil.</p>
        ${selectedEntry.pdfUrl ? `<p><a class="btn btn-primary" href="${escapeHtml(selectedEntry.pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF kitapçığını aç</a></p>` : ''}
      `;
    }
    document.getElementById('exam-nav')?.replaceChildren();
    return;
  }

  document.getElementById('exam-question-palette')?.removeAttribute('hidden');
  document.getElementById('exam-progress-wrap')?.removeAttribute('hidden');

  renderSessionStats();
  renderQuestionPalette();
  renderQuestion();
  startTimer();
  renderExamsStats('page-stats-exams', catalog);
}

function resetSession() {
  if (!questions.length) return;
  answered = {};
  index = 0;
  seconds = 0;
  renderSessionStats();
  renderQuestionPalette();
  renderQuestion();
  startTimer();
}

function closePractice() {
  if (unmountPdfView) {
    unmountPdfView();
    unmountPdfView = null;
  }
  selectedEntry = null;
  stopTimer();
  setExamRoute({ tur: selectedGroup || '' });
}

function currentQ() {
  if (!questions.length) return null;
  return questions[index];
}

function updateTimerBar() {
  const bar = document.getElementById('exam-timer-bar');
  const on = document.getElementById('exam-timer')?.checked;
  if (bar) {
    if (on) bar.removeAttribute('hidden');
    else bar.setAttribute('hidden', '');
  }
  const disp = document.getElementById('exam-timer-display');
  if (disp) disp.textContent = formatTime(seconds);
}

function renderSessionStats() {
  const s = computeSessionStats();
  const el = document.getElementById('exam-session-stats');
  if (!el) return;

  const pct = s.scorable ? Math.round(((s.correct + s.wrong) / s.scorable) * 100) : 0;

  el.innerHTML = `
    <div class="exam-stat-card stat-correct">
      <strong>${s.correct}</strong>
      <span>Doğru</span>
    </div>
    <div class="exam-stat-card stat-wrong">
      <strong>${s.wrong}</strong>
      <span>Yanlış</span>
    </div>
    <div class="exam-stat-card stat-blank">
      <strong>${s.blank}</strong>
      <span>Boş</span>
    </div>
    <div class="exam-stat-card stat-net">
      <strong>${formatNet(s.net)}</strong>
      <span>Net</span>
    </div>
  `;

  const fill = document.getElementById('exam-progress-fill');
  const label = document.getElementById('exam-progress-label');
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `${s.correct + s.wrong} / ${s.scorable} cevaplandı`;
}

function questionDisplayLabel(q) {
  if (q.sectionLabel) return `${q.sectionLabel} · Soru ${q.bookletNumber ?? q.number}`;
  return `Soru ${q.bookletNumber ?? q.number}`;
}

function renderQuestionPalette() {
  const palette = document.getElementById('exam-question-palette');
  if (!palette || !questions.length) return;

  const parts = ['<p class="exam-palette-title">Soru haritası — kitapçık numaraları</p>'];
  let currentSection = null;
  let gridItems = [];

  const flushGrid = () => {
    if (!gridItems.length) return;
    parts.push(`<div class="exam-palette-grid">${gridItems.join('')}</div>`);
    gridItems = [];
  };

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    if (q.sectionLabel && q.sectionLabel !== currentSection) {
      flushGrid();
      parts.push(`<p class="exam-palette-section">${escapeHtml(q.sectionLabel)}</p>`);
      currentSection = q.sectionLabel;
    }

    const a = answered[q.id];
    let cls = 'exam-palette-btn';
    if (i === index) cls += ' current';
    if (a && q.answer) {
      cls += a.choice === q.answer ? ' answered-correct' : ' answered-wrong';
    } else if (a) {
      cls += ' answered-neutral';
    }
    const num = q.bookletNumber ?? q.number ?? i + 1;
    gridItems.push(
      `<button type="button" class="${cls}" data-idx="${i}" aria-label="${escapeHtml(questionDisplayLabel(q))}">${num}</button>`,
    );
  }
  flushGrid();

  palette.innerHTML = parts.join('');

  palette.querySelectorAll('.exam-palette-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      index = parseInt(btn.dataset.idx, 10);
      renderQuestionPalette();
      renderQuestion();
    });
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
  updateTimerBar();
  if (!document.getElementById('exam-timer')?.checked) return;
  timerId = setInterval(() => {
    seconds += 1;
    const disp = document.getElementById('exam-timer-display');
    if (disp) disp.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function renderQuestion() {
  const q = currentQ();
  const area = document.getElementById('exam-question-area');
  const nav = document.getElementById('exam-nav');
  if (!q || !area) {
    if (area) area.innerHTML = '<p class="empty-state">Bu kitapçık için soru bulunamadı.</p>';
    return;
  }

  if (unmountPdfView) {
    unmountPdfView();
    unmountPdfView = null;
  }

  const prev = answered[q.id];
  const hasAnswer = Boolean(q.answer);
  const showSolution = document.getElementById('exam-show-solution')?.checked;
  const locked = prev && hasAnswer;

  const numLabel = questionDisplayLabel(q);
  const pdfBtn = selectedEntry?.pdfUrl
    ? `<a class="btn btn-ghost btn-sm" href="${escapeHtml(selectedEntry.pdfUrl)}#page=${q.pdfPage || 1}" target="_blank" rel="noopener noreferrer">PDF</a>`
    : '';

  const letterOpts = ['A', 'B', 'C', 'D', 'E']
    .map((k) => {
      let cls = 'exam-option exam-option-letter';
      if (prev?.choice === k) cls += ' selected';
      if (locked) {
        if (k === q.answer) cls += ' correct';
        else if (prev.choice === k) cls += ' wrong';
      }
      return `<button type="button" class="${cls}" data-opt="${k}" ${locked ? 'disabled' : ''} aria-label="Şık ${k}">
        <span class="opt-letter">${k}</span>
      </button>`;
    })
    .join('');

  let feedback = '';
  if (locked) {
    if (prev.choice === q.answer) {
      feedback = `<div class="exam-feedback feedback-correct">✓ Doğru! Cevap: ${escapeHtml(q.answer)}</div>`;
    } else {
      feedback = `<div class="exam-feedback feedback-wrong">✗ Yanlış. Doğru cevap: ${escapeHtml(q.answer)}</div>`;
    }
  }

  const showPdf = Boolean(selectedEntry?.pdfUrl);

  area.innerHTML = `
    <div class="exam-question-header">
      <span class="exam-question-badge">${escapeHtml(numLabel)}</span>
      <span class="exam-question-meta">${escapeHtml(q.subject)} · ${escapeHtml(q.topic || selectedEntry?.examType || '')}</span>
      ${pdfBtn}
    </div>
    <p class="exam-pdf-hint">Soru metni ve şıklar aşağıdaki kitapçık sayfasında — PDF ile bire bir.</p>
    ${showPdf ? '<div id="exam-pdf-snippet"></div>' : '<p class="empty-state">PDF bağlantısı yok.</p>'}
    <div class="exam-answer-row">
      <p class="exam-answer-label">Cevabınızı işaretleyin:</p>
      <div class="exam-options exam-options-letters">${letterOpts}</div>
    </div>
    ${feedback}
    ${showSolution && locked ? `<div class="exam-solution"><strong>Çözüm:</strong>\n${escapeHtml(q.solution || `Doğru cevap: ${q.answer}`)}</div>` : ''}
    ${!hasAnswer ? '<p class="meta exam-no-key">Bu soru için cevap anahtarı eşleşmedi.</p>' : ''}
    <button type="button" class="btn btn-ghost btn-sm" id="exam-ai-help" style="margin-top:1rem">AI: Bu soruyu açıkla</button>
  `;

  if (showPdf) {
    const pdfHost = area.querySelector('#exam-pdf-snippet');
    mountExamPdfView(pdfHost, selectedEntry.pdfUrl, q.pdfPage || 1).then((unmount) => {
      unmountPdfView = unmount;
    });
  }

  area.querySelectorAll('.exam-option:not([disabled])').forEach((btn) => {
    btn.onclick = () => selectAnswer(q, btn.dataset.opt);
  });

  document.getElementById('exam-ai-help')?.addEventListener('click', async () => {
    const engine = getAIEngine();
    const prompt = `Bu ÖSYM çıkmış sınav sorusu (Soru ${q.number}). Kitapçık PDF sayfasında görünüyor. ${q.answer ? `Doğru cevap: ${q.answer}` : ''} Adım adım açıkla.`;
    const reply = await engine.generate(prompt);
    let sol = area.querySelector('.exam-solution');
    if (!sol) {
      sol = document.createElement('div');
      sol.className = 'exam-solution';
      area.appendChild(sol);
    }
    sol.innerHTML = `<strong>AI açıklaması:</strong>\n${escapeHtml(reply)}`;
  });

  if (nav) {
    nav.innerHTML = `
      <button type="button" class="btn btn-secondary" id="exam-prev" ${index <= 0 ? 'disabled' : ''}>← Önceki</button>
      <span class="exam-nav-counter">${index + 1} / ${questions.length}</span>
      <button type="button" class="btn btn-primary" id="exam-next" ${index >= questions.length - 1 ? 'disabled' : ''}>Sonraki →</button>
    `;
    document.getElementById('exam-prev')?.addEventListener('click', () => {
      if (index > 0) {
        index -= 1;
        renderQuestionPalette();
        renderQuestion();
      }
    });
    document.getElementById('exam-next')?.addEventListener('click', () => {
      if (index < questions.length - 1) {
        index += 1;
        renderQuestionPalette();
        renderQuestion();
      }
    });
  }
}

function adjustGlobalStats(q, oldChoice, newChoice) {
  if (!q.answer) return;
  const stats = getStats();
  const examId = selectedEntry?.id;

  if (oldChoice) {
    if (oldChoice === q.answer) {
      stats.correct = Math.max(0, stats.correct - 1);
      if (examId && stats.byExam[examId]) stats.byExam[examId].correct = Math.max(0, stats.byExam[examId].correct - 1);
    } else {
      stats.wrong = Math.max(0, stats.wrong - 1);
      if (examId && stats.byExam[examId]) stats.byExam[examId].wrong = Math.max(0, stats.byExam[examId].wrong - 1);
    }
  }

  if (newChoice) {
    if (!stats.byExam[examId]) {
      stats.byExam[examId] = { correct: 0, wrong: 0, blank: 0, answered: 0 };
    }
    if (!oldChoice) stats.byExam[examId].answered += 1;

    if (newChoice === q.answer) {
      stats.correct += 1;
      stats.byExam[examId].correct += 1;
    } else {
      stats.wrong += 1;
      stats.byExam[examId].wrong += 1;
      addWrong(q);
    }
  }

  saveStats(stats);
}

function selectAnswer(q, choice) {
  const prev = answered[q.id];
  if (prev?.choice === choice) return;

  const oldChoice = prev?.choice || null;
  answered[q.id] = { choice, at: Date.now() };

  if (q.answer) {
    adjustGlobalStats(q, oldChoice, choice);
  }

  renderSessionStats();
  renderQuestionPalette();
  renderQuestion();
}

export async function init() {
  await loadCatalog();

  hashListener = () => {
    const path = (location.hash.slice(1) || '/').split('?')[0];
    if (path === '/sinavlar') syncViewFromRoute();
  };
  window.addEventListener('hashchange', hashListener);

  document.getElementById('exam-group-search')?.addEventListener('input', renderExamGroups);
  document.getElementById('exam-search')?.addEventListener('input', applyCatalogFilters);
  document.getElementById('exam-year-filter')?.addEventListener('change', applyCatalogFilters);
  document.getElementById('exam-back-btn')?.addEventListener('click', goBack);
  document.getElementById('exam-close-practice')?.addEventListener('click', closePractice);
  document.getElementById('exam-reset-session')?.addEventListener('click', resetSession);
  document.getElementById('exam-show-solution')?.addEventListener('change', renderQuestion);
  document.getElementById('exam-timer')?.addEventListener('change', () => {
    seconds = 0;
    startTimer();
  });

  syncViewFromRoute();

  sessionReloadListener = () => {
    renderSessionStats();
  };
  window.addEventListener('aikoc:session', sessionReloadListener);
  window.addEventListener('aikoc:session-merged', sessionReloadListener);
}

export function destroy() {
  if (sessionReloadListener) {
    window.removeEventListener('aikoc:session', sessionReloadListener);
    window.removeEventListener('aikoc:session-merged', sessionReloadListener);
    sessionReloadListener = null;
  }
  if (hashListener) {
    window.removeEventListener('hashchange', hashListener);
    hashListener = null;
  }
  if (unmountPdfView) {
    unmountPdfView();
    unmountPdfView = null;
  }
  stopTimer();
}
