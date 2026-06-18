import { getItem, setItem } from '../../lib/storage.js';
import { getAIEngine } from '../../lib/ai-engine.js';
import { renderExamsStats } from '../../lib/page-stats.js';

const OSYM_SOURCE = 'https://www.osym.gov.tr/TR,15045/osys-cikmis-sorular.html';

let catalog = [];
let filteredCatalog = [];
let selectedEntry = null;
let questions = [];
let index = 0;
let timerId = null;
let seconds = 0;
let answered = {};
let sessionAnswered = 0;

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
  const raw = getItem('exam_stats', defaultStats());
  return { ...defaultStats(), ...raw, byExam: raw.byExam || {} };
}

function saveStats(stats) {
  setItem('exam_stats', stats);
}

function getWrongBank() {
  return getItem('exam_wrong_bank', []);
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
    setItem('exam_wrong_bank', bank.slice(-100));
  }
}

async function loadCatalog() {
  const res = await fetch('data/osym-exams-index.json');
  if (!res.ok) throw new Error('ÖSYM sınav indeksi yüklenemedi');
  const data = await res.json();
  catalog = data.entries || [];
  filteredCatalog = [...catalog];

  const catSel = document.getElementById('exam-category');
  if (catSel) {
    catSel.innerHTML = '<option value="">Tüm kategoriler</option>';
    (data.categories || []).forEach((c) => {
      const o = document.createElement('option');
      o.value = c;
      o.textContent = c.charAt(0).toUpperCase() + c.slice(1);
      catSel.appendChild(o);
    });
  }

  const examTypes = [...new Set(catalog.map((e) => e.examType).filter(Boolean))].sort();
  const typeSel = document.getElementById('exam-type-filter');
  if (typeSel) {
    typeSel.innerHTML = '<option value="">Tüm sınavlar</option>';
    examTypes.forEach((t) => {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t;
      typeSel.appendChild(o);
    });
  }

  const years = [...new Set(catalog.map((e) => e.year))].sort((a, b) => b - a);
  const yearSel = document.getElementById('exam-year-filter');
  if (yearSel) {
    yearSel.innerHTML = '<option value="">Tüm yıllar</option>';
    years.forEach((y) => {
      const o = document.createElement('option');
      o.value = String(y);
      o.textContent = String(y);
      yearSel.appendChild(o);
    });
  }

  applyCatalogFilters();
}

function applyCatalogFilters() {
  const q = (document.getElementById('exam-search')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('exam-category')?.value || '';
  const year = document.getElementById('exam-year-filter')?.value || '';
  const examType = document.getElementById('exam-type-filter')?.value || '';

  filteredCatalog = catalog.filter((e) => {
    if (cat && e.category !== cat) return false;
    if (year && String(e.year) !== year) return false;
    if (examType && e.examType !== examType) return false;
    if (!q) return true;
    const hay = `${e.year} ${e.shortName} ${e.name} ${e.session} ${e.subject} ${e.examType}`.toLowerCase();
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
    btn.addEventListener('click', () => selectExam(btn.dataset.id));
  });
}

async function selectExam(id) {
  selectedEntry = catalog.find((e) => e.id === id);
  if (!selectedEntry) return;

  renderCatalog();

  questions = [];
  const qPath = selectedEntry.questionFile;
  if (qPath) {
    try {
      const res = await fetch(qPath);
      if (res.ok) {
        const data = await res.json();
        questions = (data.questions || []).map((q) => ({
          ...q,
          id: q.id || `${selectedEntry.id}-q${q.number || 0}`,
        }));
      }
    } catch {
      /* soru dosyası yoksa PDF bağlantısı gösterilir */
    }
  }

  index = 0;
  answered = {};
  seconds = 0;
  sessionAnswered = 0;

  const stats = getStats();
  stats.sessions = (stats.sessions || 0) + 1;
  saveStats(stats);

  const info = document.getElementById('exam-selected-info');
  if (info) {
    const pdfLink = selectedEntry.pdfUrl
      ? `<a href="${escapeHtml(selectedEntry.pdfUrl)}" target="_blank" rel="noopener noreferrer">Resmî PDF kitapçığı</a>`
      : '';
    const qNote =
      questions.length > 0
        ? `${questions.length} soru yüklendi${questions.some((q) => q.answer) ? '' : ' (cevap anahtarı sınırlı)'}`
        : 'Soru metni henüz ayrıştırılmadı — PDF üzerinden çalışabilirsiniz.';
    info.innerHTML = `
      <h3>${escapeHtml(selectedEntry.label)}</h3>
      <p class="meta">${escapeHtml(selectedEntry.organizer)} · ${escapeHtml(selectedEntry.examType)} · ${qNote}</p>
      <p class="meta exam-source-note">${pdfLink} · <a href="${OSYM_SOURCE}" target="_blank" rel="noopener noreferrer">ÖSYM arşivi</a></p>
    `;
  }

  document.getElementById('exam-catalog-wrap')?.classList.add('panel-hidden');
  document.querySelector('.exam-catalog-toolbar')?.classList.add('panel-hidden');
  document.getElementById('exam-practice')?.classList.remove('panel-hidden');

  if (!questions.length) {
    const area = document.getElementById('exam-question-area');
    if (area) {
      area.innerHTML = `
        <p class="empty-state">Bu kitapçık için henüz dijital soru bankası oluşturulmadı.</p>
        <p><a class="btn btn-primary" href="${escapeHtml(selectedEntry.pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF kitapçığını aç</a></p>
      `;
    }
    document.getElementById('exam-nav')?.replaceChildren();
    renderStatsBar();
    return;
  }

  renderQuestion();
  renderStatsBar();
  startTimer();
}

function closePractice() {
  selectedEntry = null;
  document.getElementById('exam-catalog-wrap')?.classList.remove('panel-hidden');
  document.querySelector('.exam-catalog-toolbar')?.classList.remove('panel-hidden');
  document.getElementById('exam-practice')?.classList.add('panel-hidden');
  stopTimer();
  renderCatalog();
  renderExamsStats('page-stats-exams', catalog);
}

function currentQ() {
  if (!questions.length) return null;
  return questions[index % questions.length];
}

function renderStatsBar() {
  const s = getStats();
  const examStats = selectedEntry ? s.byExam[selectedEntry.id] : null;
  const timerOn = document.getElementById('exam-timer')?.checked;
  const el = document.getElementById('exam-stats-bar');
  if (el) {
    el.innerHTML = `
      <span>Doğru: <strong>${s.correct}</strong></span>
      <span>Yanlış: <strong>${s.wrong}</strong></span>
      <span>Bu oturum: <strong>${sessionAnswered}</strong></span>
      ${examStats ? `<span>Bu kitapçık: <strong>${examStats.correct || 0}D / ${examStats.wrong || 0}Y</strong></span>` : ''}
      ${timerOn ? `<span class="exam-timer" id="exam-timer-display">${formatTime(seconds)}</span>` : ''}
    `;
  }
  renderExamsStats('page-stats-exams', catalog);
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  stopTimer();
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

  const study = document.getElementById('exam-study-mode')?.checked;
  const prev = answered[q.id];
  const hasAnswer = Boolean(q.answer);

  const opts = ['A', 'B', 'C', 'D', 'E']
    .filter((k) => q.options?.[k])
    .map((k) => {
      let cls = 'exam-option';
      if (prev?.choice === k) cls += ' selected';
      if (study && prev && hasAnswer) {
        if (k === q.answer) cls += ' correct';
        else if (prev.choice === k) cls += ' wrong';
      }
      return `<button type="button" class="${cls}" data-opt="${k}"><strong>${k})</strong> ${escapeHtml(q.options[k])}</button>`;
    })
    .join('');

  const stem = (q.question || '').trim();
  const numLabel = q.number ? `Soru ${q.number}` : `Soru ${index + 1}`;
  const pdfBtn = selectedEntry?.pdfUrl
    ? `<a class="btn btn-ghost btn-sm" href="${escapeHtml(selectedEntry.pdfUrl)}" target="_blank" rel="noopener noreferrer" style="margin-left:.5rem">PDF</a>`
    : '';

  area.innerHTML = `
    <div class="meta">${escapeHtml(numLabel)} · ${escapeHtml(q.subject)} · ${escapeHtml(q.topic || selectedEntry?.examType || '')}${pdfBtn}</div>
    <div class="q-text">${stem ? escapeHtml(stem) : '<span class="meta">Soru metni yüklenemedi.</span>'}</div>
    <div class="exam-options">${opts || '<p class="meta">Seçenekler PDF\'ten okunamadı.</p>'}</div>
    ${study && prev && hasAnswer ? `<div class="exam-solution"><strong>Çözüm:</strong>\n${escapeHtml(q.solution || `Doğru cevap: ${q.answer}`)}</div>` : ''}
    ${!hasAnswer ? '<p class="meta">Bu soru için cevap anahtarı yok; çalışma modunda PDF\'e bakın.</p>' : ''}
    <button type="button" class="btn btn-ghost btn-sm" id="exam-ai-help" style="margin-top:1rem">AI: Bu soruyu açıkla</button>
  `;

  area.querySelectorAll('.exam-option').forEach((btn) => {
    btn.onclick = () => selectAnswer(q, btn.dataset.opt);
  });

  document.getElementById('exam-ai-help')?.addEventListener('click', async () => {
    const engine = getAIEngine();
    const prompt = `Bu ÖSYM çıkmış sınav sorusunu adım adım açıkla:\n${q.question}\nSeçenekler: ${JSON.stringify(q.options)}\n${q.answer ? `Doğru: ${q.answer}` : ''}`;
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
      <button type="button" class="btn btn-secondary" id="exam-prev">Önceki</button>
      <span>${index + 1} / ${questions.length}</span>
      <button type="button" class="btn btn-primary" id="exam-next">Sonraki</button>
    `;
    document.getElementById('exam-prev')?.addEventListener('click', () => {
      index = Math.max(0, index - 1);
      renderQuestion();
    });
    document.getElementById('exam-next')?.addEventListener('click', () => {
      index = Math.min(questions.length - 1, index + 1);
      renderQuestion();
    });
  }
}

function selectAnswer(q, choice) {
  const study = document.getElementById('exam-study-mode')?.checked;
  if (answered[q.id] && !study) return;

  const stats = getStats();
  const had = answered[q.id];
  answered[q.id] = { choice, at: Date.now() };

  if (!had && q.answer) {
    sessionAnswered += 1;
    const examId = selectedEntry?.id;
    if (examId) {
      if (!stats.byExam[examId]) {
        stats.byExam[examId] = { correct: 0, wrong: 0, blank: 0, answered: 0 };
      }
      stats.byExam[examId].answered += 1;
    }
    if (choice === q.answer) {
      stats.correct += 1;
      if (examId) stats.byExam[examId].correct += 1;
    } else {
      stats.wrong += 1;
      if (examId) stats.byExam[examId].wrong += 1;
      addWrong(q);
    }
    saveStats(stats);
  } else if (!had) {
    sessionAnswered += 1;
  }

  renderStatsBar();
  if (study) renderQuestion();
}

export async function init() {
  await loadCatalog();
  renderExamsStats('page-stats-exams', catalog);

  document.getElementById('exam-search')?.addEventListener('input', applyCatalogFilters);
  document.getElementById('exam-category')?.addEventListener('change', applyCatalogFilters);
  document.getElementById('exam-year-filter')?.addEventListener('change', applyCatalogFilters);
  document.getElementById('exam-type-filter')?.addEventListener('change', applyCatalogFilters);
  document.getElementById('exam-close-practice')?.addEventListener('click', closePractice);
  document.getElementById('exam-study-mode')?.addEventListener('change', renderQuestion);
  document.getElementById('exam-timer')?.addEventListener('change', () => {
    seconds = 0;
    startTimer();
    renderStatsBar();
  });
}

export function destroy() {
  stopTimer();
}
