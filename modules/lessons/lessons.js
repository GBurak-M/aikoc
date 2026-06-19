import { bumpLessonOpens, renderLessonsStats } from '../../lib/page-stats.js';
import {
  analyzeAll,
  buildWeeklyPlan,
  calculateExamFromStats,
  createCourse,
  createExam,
  exportPlanPdf,
  loadPlannerState,
  savePlannerState,
} from '../../lib/lessons-planner.js';
import { assertMemberOrDemo, markDemoConsumed, isMemberLoggedIn } from '../../lib/guest-session.js';

let curriculum = null;
let state = loadPlannerState();
let selectedCourseId = null;
let activePomoCourseId = null;
let timerId = null;
let timerSeconds = 0;
let timerRunning = false;
let timerPhase = 'work';
let completedSessions = 0;
let sessionsInCycle = 0;

const LEVEL_LABELS = {
  ilkokul: 'İlkokul',
  ortaokul: 'Ortaokul',
  lise: 'Lise',
  mezun: 'Mezun / YKS',
};

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function persist() {
  savePlannerState(state);
  renderPlanner();
}

function requireLessonsDemo() {
  if (isMemberLoggedIn()) return true;
  if (!assertMemberOrDemo('lessons')) return false;
  markDemoConsumed('lessons');
  return true;
}

function getAnalysisAndPlan() {
  const analysis = analyzeAll(state);
  const plan = buildWeeklyPlan(state);
  return { analysis, plan };
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function syncTimerFromSettings() {
  if (timerRunning) return;
  timerSeconds = (state.settings.workMinutes || 25) * 60;
  timerPhase = 'work';
  updateTimerUi();
}

function updateTimerUi() {
  const disp = document.getElementById('pomo-timer-display');
  const phase = document.getElementById('pomo-phase');
  const active = document.getElementById('pomo-active-course');
  const count = document.getElementById('pomo-session-count');
  if (disp) disp.textContent = formatTime(timerSeconds);
  if (phase) {
    phase.textContent =
      timerPhase === 'work'
        ? 'Çalışma'
        : timerPhase === 'shortBreak'
          ? 'Kısa mola'
          : timerPhase === 'longBreak'
            ? 'Uzun mola'
            : 'Hazır';
  }
  if (active) {
    const course = state.courses.find((c) => c.id === activePomoCourseId);
    active.textContent = course ? `Odak: ${course.name}` : 'Bir ders seçin veya otomatik planı kullanın';
  }
  if (count) count.textContent = `Oturum: ${completedSessions}`;
}

function nextPhase() {
  const s = state.settings;
  if (timerPhase === 'work') {
    completedSessions += 1;
    sessionsInCycle += 1;
    if (activePomoCourseId) {
      state.pomodoroProgress[activePomoCourseId] =
        (state.pomodoroProgress[activePomoCourseId] || 0) + 1;
      persist();
    }
    if (sessionsInCycle >= (s.sessionsBeforeLong || 4)) {
      timerPhase = 'longBreak';
      timerSeconds = (s.longBreakMinutes || 15) * 60;
      sessionsInCycle = 0;
    } else {
      timerPhase = 'shortBreak';
      timerSeconds = (s.shortBreakMinutes || 5) * 60;
    }
  } else {
    timerPhase = 'work';
    timerSeconds = (s.workMinutes || 25) * 60;
  }
  updateTimerUi();
}

function tickTimer() {
  if (timerSeconds > 0) {
    timerSeconds -= 1;
    updateTimerUi();
    return;
  }
  nextPhase();
}

function startTimer() {
  if (timerRunning) return;
  if (!activePomoCourseId && state.courses.length) {
    const { plan } = getAnalysisAndPlan();
    const top = Object.entries(plan.todayByCourse).sort((a, b) => b[1] - a[1])[0];
    if (top) activePomoCourseId = top[0];
  }
  timerRunning = true;
  document.getElementById('pomo-start')?.setAttribute('disabled', '');
  document.getElementById('pomo-pause')?.removeAttribute('disabled');
  timerId = setInterval(tickTimer, 1000);
  updateTimerUi();
}

function pauseTimer() {
  timerRunning = false;
  if (timerId) clearInterval(timerId);
  timerId = null;
  document.getElementById('pomo-start')?.removeAttribute('disabled');
  document.getElementById('pomo-pause')?.setAttribute('disabled', '');
}

function resetTimer() {
  pauseTimer();
  sessionsInCycle = 0;
  syncTimerFromSettings();
}

function renderCourseList() {
  const root = document.getElementById('lessons-course-list');
  if (!root) return;

  if (!state.courses.length) {
    root.innerHTML =
      '<p class="empty-state">Okulda aldığınız dersleri ekleyin. Sınav notları ve test sonuçlarına göre haftalık plan oluşturulur.</p>';
    return;
  }

  root.innerHTML = state.courses
    .map((c) => {
      const examCount = state.exams.filter((e) => e.courseId === c.id).length;
      const sel = c.id === selectedCourseId ? ' selected' : '';
      return `
        <button type="button" class="lessons-course-chip${sel}" data-id="${c.id}" style="--course-color:${escapeHtml(c.color || '#1A56DB')}">
          <span class="chip-dot"></span>
          <span class="chip-name">${escapeHtml(c.name)}</span>
          <span class="chip-meta">${examCount} sınav · hedef ${c.targetGrade ?? 70}</span>
          <span class="chip-delete" data-delete="${c.id}" title="Sil" role="button" tabindex="0">×</span>
        </button>`;
    })
    .join('');

  root.querySelectorAll('.lessons-course-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (e.target.closest('[data-delete]')) return;
      selectedCourseId = btn.dataset.id;
      activePomoCourseId = selectedCourseId;
      renderPlanner();
    });
  });

  root.querySelectorAll('[data-delete]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.delete;
      if (!confirm('Bu ders ve sınavları silinsin mi?')) return;
      state.courses = state.courses.filter((c) => c.id !== id);
      state.exams = state.exams.filter((ex) => ex.courseId !== id);
      delete state.pomodoroProgress[id];
      if (selectedCourseId === id) selectedCourseId = null;
      if (activePomoCourseId === id) activePomoCourseId = null;
      persist();
    });
  });
}

function renderExamPanel() {
  const panel = document.getElementById('lessons-exam-panel');
  const list = document.getElementById('lessons-exam-list');
  const title = document.getElementById('lessons-exam-panel-title');
  const course = state.courses.find((c) => c.id === selectedCourseId);

  if (!panel || !list) return;

  if (!course) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;
  if (title) title.textContent = `${course.name} — sınav notları`;

  const dateInput = document.querySelector('#lessons-add-exam [name="date"]');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

  const exams = state.exams.filter((e) => e.courseId === course.id);
  if (!exams.length) {
    list.innerHTML = '<p class="meta">Henüz sınav eklenmedi.</p>';
    return;
  }

  list.innerHTML = `
    <table class="lessons-exam-table">
      <thead><tr><th>Sınav</th><th>Tarih</th><th>D/Y/B</th><th>Net</th><th>Puan</th><th></th></tr></thead>
      <tbody>
        ${exams
          .map((ex) => {
            const dyb =
              ex.correct != null
                ? `${ex.correct}/${ex.wrong ?? 0}/${ex.blank ?? 0}${ex.total ? ` · ${ex.total}` : ''}`
                : '—';
            const netLabel = ex.net != null ? ex.net : '—';
            const gradeLabel =
              ex.grade != null
                ? `${ex.grade}${ex.autoCalculated ? ' (otomatik)' : ''}`
                : '—';
            return `<tr>
              <td>${escapeHtml(ex.title)}</td>
              <td>${escapeHtml(ex.date)}</td>
              <td>${dyb}</td>
              <td>${netLabel}</td>
              <td>${gradeLabel}</td>
              <td><button type="button" class="btn btn-ghost btn-sm" data-del-exam="${ex.id}">Sil</button></td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;

  list.querySelectorAll('[data-del-exam]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.exams = state.exams.filter((e) => e.id !== btn.dataset.delExam);
      persist();
    });
  });
}

function renderAnalysis() {
  const root = document.getElementById('lessons-analysis');
  if (!root) return;

  const { analysis } = getAnalysisAndPlan();

  if (!analysis.totalCourses) {
    root.innerHTML = '<p class="empty-state">Analiz için ders ekleyin.</p>';
    return;
  }

  const summary = `
    <div class="lessons-stat-row">
      <div class="lessons-stat"><strong>${analysis.totalCourses}</strong><span>Ders</span></div>
      <div class="lessons-stat"><strong>${analysis.totalExams}</strong><span>Sınav</span></div>
      <div class="lessons-stat"><strong>${analysis.overallAvg ?? '—'}</strong><span>Genel ort.</span></div>
    </div>`;

  const cards = analysis.courses
    .map(
      (c) => `
    <div class="lessons-analysis-card status-${c.status === 'Öncelikli' ? 'priority' : c.status === 'Hedefte' ? 'ok' : 'mid'}">
      <div class="lac-head">
        <strong>${escapeHtml(c.courseName)}</strong>
        <span class="lac-badge">${escapeHtml(c.status)}</span>
      </div>
      <div class="lac-metrics">
        <span>Ort: ${c.avgGrade ?? '—'}</span>
        <span>Net: ${c.avgRate != null ? `${Math.round(c.avgRate * 100)}%` : '—'}</span>
        <span>Trend: ${c.trend}</span>
        <span>Öncelik: ${c.weakness}</span>
      </div>
      <p class="meta">${escapeHtml(c.recommendation)}</p>
    </div>`,
    )
    .join('');

  root.innerHTML = summary + `<div class="lessons-analysis-grid">${cards}</div>`;
}

function renderWeeklyPlan() {
  const root = document.getElementById('lessons-weekly-plan');
  if (!root) return;

  const { plan } = getAnalysisAndPlan();

  if (!state.courses.length) {
    root.innerHTML = '<p class="empty-state">Plan, ders ve sınav verisi girildikten sonra oluşturulur.</p>';
    return;
  }

  const allocTable = `
    <p class="meta plan-summary">Toplam ${plan.totalPomodoros} pomodoro · ${plan.totalHours} saat / hafta</p>
    <table class="lessons-plan-table">
      <thead><tr><th>Ders</th><th>Haftalık pomodoro</th><th>Süre</th></tr></thead>
      <tbody>
        ${plan.allocations
          .map(
            (a) =>
              `<tr><td>${escapeHtml(a.courseName)}</td><td>${a.pomodoros}</td><td>${a.hours} saat</td></tr>`,
          )
          .join('')}
      </tbody>
    </table>`;

  const scheduleTable = `
    <h4 class="plan-subhead">Günlük program</h4>
    <table class="lessons-plan-table">
      <thead><tr><th>Gün</th><th>Ders</th><th>Pomodoro</th><th>Süre</th></tr></thead>
      <tbody>
        ${plan.schedule
          .flatMap((day) => {
            if (!day.slots.length) {
              return [`<tr><td>${escapeHtml(day.dayName)}</td><td colspan="3" class="muted">—</td></tr>`];
            }
            return day.slots.map(
              (s, i) =>
                `<tr>
                  ${i === 0 ? `<td rowspan="${day.slots.length}">${escapeHtml(day.dayName)}</td>` : ''}
                  <td>${escapeHtml(s.courseName)}</td>
                  <td>${s.pomodoros}</td>
                  <td>${s.minutes} dk</td>
                </tr>`,
            );
          })
          .join('')}
      </tbody>
    </table>`;

  root.innerHTML = allocTable + scheduleTable;
}

function renderPomodoroCourses() {
  const root = document.getElementById('lessons-pomo-courses');
  if (!root) return;

  const { plan } = getAnalysisAndPlan();

  if (!state.courses.length) {
    root.innerHTML = '<p class="meta">Ders ekleyince bugünkü pomodoro hedefleri burada görünür.</p>';
    return;
  }

  root.innerHTML = state.courses
    .map((c) => {
      const target = plan.todayByCourse[c.id] || 0;
      const done = state.pomodoroProgress[c.id] || 0;
      const active = c.id === activePomoCourseId ? ' active' : '';
      return `
        <button type="button" class="pomo-course-card${active}" data-pomo-course="${c.id}" style="--course-color:${escapeHtml(c.color || '#1A56DB')}">
          <span class="pcc-name">${escapeHtml(c.name)}</span>
          <span class="pcc-target">Bugün: ${done}/${target || '—'} pomodoro</span>
          <span class="pcc-bar"><span style="width:${target ? Math.min(100, (done / target) * 100) : 0}%"></span></span>
        </button>`;
    })
    .join('');

  root.querySelectorAll('[data-pomo-course]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activePomoCourseId = btn.dataset.pomoCourse;
      renderPomodoroCourses();
      updateTimerUi();
    });
  });
}

function renderPlanner() {
  renderCourseList();
  renderExamPanel();
  renderAnalysis();
  renderWeeklyPlan();
  renderPomodoroCourses();
  updateTimerUi();
}

function updateExamCalcPreview() {
  const form = document.getElementById('lessons-add-exam');
  if (!form) return;

  const data = {
    total: form.querySelector('[name="total"]')?.value,
    correct: form.querySelector('[name="correct"]')?.value,
    wrong: form.querySelector('[name="wrong"]')?.value,
    blank: form.querySelector('[name="blank"]')?.value,
  };

  const calc = calculateExamFromStats(data);
  const box = document.getElementById('lessons-exam-calc');
  const netEl = document.getElementById('exam-calc-net');
  const gradeEl = document.getElementById('exam-calc-grade');
  const warnEl = document.getElementById('exam-calc-warn');
  const gradeInput = document.getElementById('exam-input-grade');

  if (box) box.hidden = !calc.canCalculate;
  if (netEl) netEl.textContent = calc.net != null ? calc.net : '—';
  if (gradeEl) gradeEl.textContent = calc.grade != null ? calc.grade : '—';

  if (warnEl) {
    if (calc.sumMismatch) {
      warnEl.hidden = false;
      warnEl.textContent = calc.sumMismatch;
    } else {
      warnEl.hidden = true;
      warnEl.textContent = '';
    }
  }

  if (gradeInput && calc.canCalculate) {
    gradeInput.value = calc.grade;
    gradeInput.readOnly = true;
    gradeInput.classList.add('input-readonly');
  } else if (gradeInput) {
    gradeInput.readOnly = false;
    gradeInput.classList.remove('input-readonly');
  }

  if (calc.canCalculate && calc.blank != null && data.blank === '') {
    const blankInput = document.getElementById('exam-input-blank');
    if (blankInput && blankInput !== document.activeElement) {
      blankInput.placeholder = String(calc.blank);
    }
  }
}

function bindPlannerEvents() {
  document.getElementById('lessons-add-course')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('lessons-course-name')?.value?.trim();
    const target = document.getElementById('lessons-course-target')?.value;
    if (!name) return;
    if (!requireLessonsDemo()) return;
    const course = createCourse(name, target);
    state.courses.push(course);
    selectedCourseId = course.id;
    document.getElementById('lessons-course-name').value = '';
    persist();
  });

  document.getElementById('lessons-add-exam')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    if (!requireLessonsDemo()) return;
    const fd = new FormData(e.target);
    const raw = Object.fromEntries(fd.entries());
    const calc = calculateExamFromStats(raw);
    if (calc.sumMismatch) {
      alert(calc.sumMismatch);
      return;
    }
    const exam = createExam(selectedCourseId, raw);
    state.exams.push(exam);
    e.target.reset();
    updateExamCalcPreview();
    persist();
  });

  ['total', 'correct', 'wrong', 'blank'].forEach((name) => {
    document.getElementById(`exam-input-${name}`)?.addEventListener('input', updateExamCalcPreview);
  });

  document.getElementById('lessons-export-plan')?.addEventListener('click', () => {
    const { analysis, plan } = getAnalysisAndPlan();
    exportPlanPdf(state, analysis, plan);
  });

  document.getElementById('pomo-start')?.addEventListener('click', startTimer);
  document.getElementById('pomo-pause')?.addEventListener('click', pauseTimer);
  document.getElementById('pomo-reset')?.addEventListener('click', resetTimer);

  document.getElementById('lessons-pomo-settings-btn')?.addEventListener('click', () => {
    const el = document.getElementById('lessons-pomo-settings');
    if (el) el.hidden = !el.hidden;
  });

  document.getElementById('pomo-save-settings')?.addEventListener('click', () => {
    state.settings.workMinutes = Number(document.getElementById('pomo-work-min')?.value) || 25;
    state.settings.shortBreakMinutes = Number(document.getElementById('pomo-short-min')?.value) || 5;
    state.settings.longBreakMinutes = Number(document.getElementById('pomo-long-min')?.value) || 15;
    state.settings.weeklyStudyHours = Number(document.getElementById('pomo-weekly-hours')?.value) || 14;
    resetTimer();
    persist();
    document.getElementById('lessons-pomo-settings').hidden = true;
  });

  document.querySelectorAll('.lessons-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      document.querySelectorAll('.lessons-tab').forEach((t) => {
        t.classList.toggle('active', t.dataset.tab === id);
        t.setAttribute('aria-selected', t.dataset.tab === id ? 'true' : 'false');
      });
      document.getElementById('lessons-planner-panel').hidden = id !== 'planner';
      document.getElementById('lessons-curriculum-panel').hidden = id !== 'curriculum';
    });
  });
}

function loadSettingsToForm() {
  const s = state.settings;
  const w = document.getElementById('pomo-work-min');
  const sh = document.getElementById('pomo-short-min');
  const lg = document.getElementById('pomo-long-min');
  const wh = document.getElementById('pomo-weekly-hours');
  if (w) w.value = s.workMinutes;
  if (sh) sh.value = s.shortBreakMinutes;
  if (lg) lg.value = s.longBreakMinutes;
  if (wh) wh.value = s.weeklyStudyHours;
}

/* ——— Müfredat (mevcut) ——— */

async function loadCurriculum() {
  const res = await fetch('data/curriculum.json');
  curriculum = await res.json();
}

function allGradeBlocks() {
  const blocks = [...(curriculum.grades || [])];
  if (curriculum.mezun) blocks.push(curriculum.mezun);
  return blocks;
}

function filterBlocks() {
  const level = document.getElementById('lessons-level')?.value || '';
  const q = (document.getElementById('lessons-search')?.value || '').toLowerCase().trim();

  return allGradeBlocks()
    .filter((g) => !level || g.level === level)
    .map((g) => {
      const subjects = (g.subjects || []).filter((s) => {
        if (!q) return true;
        return `${s.name} ${g.label} ${g.grade}`.toLowerCase().includes(q);
      });
      return { ...g, subjects };
    })
    .filter((g) => g.subjects.length > 0);
}

function openLibrary(grade, subjectName) {
  bumpLessonOpens();
  renderLessonsStats();
  sessionStorage.setItem(
    'aikoc_library_filter',
    JSON.stringify({ grade: String(grade), subject: subjectName }),
  );
  location.hash = '#/kutuphane';
}

function renderSubjectCard(grade, subject) {
  const gLabel = grade === 'mezun' ? 'Mezun' : `${grade}. sınıf`;
  return `
    <button type="button" class="card subject-card" data-grade="${grade}" data-subject="${subject.name.replace(/"/g, '&quot;')}">
      <strong>${subject.name}</strong>
      <span>${gLabel} · ayrı müfredat</span>
    </button>
  `;
}

function renderCurriculum() {
  const root = document.getElementById('lessons-groups');
  if (!root || !curriculum) return;

  const blocks = filterBlocks();
  if (!blocks.length) {
    root.innerHTML = '<p class="empty-state">Aramanıza uygun ders bulunamadı.</p>';
    return;
  }

  const byLevel = {};
  for (const b of blocks) {
    if (!byLevel[b.level]) byLevel[b.level] = [];
    byLevel[b.level].push(b);
  }

  const levelOrder = ['ilkokul', 'ortaokul', 'lise', 'mezun'];
  root.innerHTML = levelOrder
    .filter((lv) => byLevel[lv]?.length)
    .map((lv) => {
      const gradeBlocks = byLevel[lv]
        .sort((a, b) => {
          if (a.grade === 'mezun') return 1;
          if (b.grade === 'mezun') return -1;
          return a.grade - b.grade;
        })
        .map(
          (g) => `
        <div class="grade-block">
          <h3>${g.label} <span class="level-badge">${LEVEL_LABELS[g.level] || g.level}</span></h3>
          <div class="subject-grid">
            ${g.subjects.map((s) => renderSubjectCard(g.grade, s)).join('')}
          </div>
        </div>
      `,
        )
        .join('');

      return `
        <section class="level-section" data-level="${lv}">
          <h2>${LEVEL_LABELS[lv]}</h2>
          ${gradeBlocks}
        </section>
      `;
    })
    .join('');

  root.querySelectorAll('.subject-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      openLibrary(btn.dataset.grade, btn.dataset.subject);
    });
  });
}

export async function init() {
  state = loadPlannerState();
  loadSettingsToForm();
  syncTimerFromSettings();
  bindPlannerEvents();
  renderPlanner();
  renderLessonsStats();

  const reloadPlanner = () => {
    state = loadPlannerState();
    renderPlanner();
    renderLessonsStats();
  };
  window.addEventListener('aikoc:session', reloadPlanner);
  window.addEventListener('aikoc:session-merged', reloadPlanner);

  await loadCurriculum();
  renderCurriculum();
  document.getElementById('lessons-level')?.addEventListener('change', renderCurriculum);
  document.getElementById('lessons-search')?.addEventListener('input', renderCurriculum);
}

export function destroy() {
  pauseTimer();
}
