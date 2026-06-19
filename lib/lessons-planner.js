/** Derslerim: not analizi, pomodoro dağılımı ve haftalık çalışma planı. */

import { getItem, setItem, uuid } from './storage.js';
import { scopedGet, scopedSet } from './guest-session.js';

const STORAGE_KEY = 'my_lessons_planner';

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLong: 4,
  weeklyStudyHours: 14,
  targetGrade: 70,
};

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function loadPlannerState() {
  const raw = scopedGet(STORAGE_KEY, null);
  if (!raw) {
    return {
      courses: [],
      exams: [],
      settings: { ...DEFAULT_SETTINGS },
      pomodoroProgress: {},
    };
  }
  return {
    courses: raw.courses || [],
    exams: raw.exams || [],
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    pomodoroProgress: raw.pomodoroProgress || {},
  };
}

export function savePlannerState(state) {
  scopedSet(STORAGE_KEY, state);
}

export function createCourse(name, targetGrade) {
  return {
    id: uuid(),
    name: String(name).trim(),
    targetGrade: Number(targetGrade) || DEFAULT_SETTINGS.targetGrade,
    color: pickCourseColor(),
    createdAt: Date.now(),
  };
}

export function calculateExamFromStats(input = {}) {
  let total = numOrNull(input.total);
  let correct = numOrNull(input.correct);
  let wrong = numOrNull(input.wrong);
  let blank = numOrNull(input.blank);

  if (total != null && correct != null && wrong != null && blank == null) {
    const derived = total - correct - wrong;
    if (derived >= 0) blank = derived;
  }

  if (total == null && correct != null && wrong != null) {
    total = correct + wrong + (blank ?? 0);
  }

  const answered = correct != null && wrong != null;
  let net = null;
  if (answered) net = round2(correct - wrong / 4);

  let grade = null;
  let autoGrade = false;
  if (total != null && total > 0 && net != null) {
    grade = round1(Math.max(0, Math.min(100, (net / total) * 100)));
    autoGrade = true;
  } else {
    grade = numOrNull(input.grade);
  }

  const partsSum =
    correct != null && wrong != null ? correct + wrong + (blank ?? 0) : null;
  const sumMismatch =
    total != null && partsSum != null && partsSum !== total
      ? `Doğru + yanlış + boş (${partsSum}) toplam sorudan (${total}) farklı.`
      : null;

  return {
    total,
    correct,
    wrong,
    blank,
    net,
    grade,
    autoGrade,
    sumMismatch,
    canCalculate: answered && total != null && total > 0,
  };
}

export function createExam(courseId, data) {
  const calc = calculateExamFromStats(data);
  const manualGrade = numOrNull(data.grade);

  return {
    id: uuid(),
    courseId,
    title: String(data.title || 'Sınav').trim(),
    date: data.date || new Date().toISOString().slice(0, 10),
    grade: calc.canCalculate ? calc.grade : manualGrade,
    total: calc.total,
    correct: calc.correct,
    wrong: calc.wrong,
    blank: calc.blank,
    net: calc.net,
    autoCalculated: calc.canCalculate,
    createdAt: Date.now(),
  };
}

function numOrNull(v) {
  if (v === '' || v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function pickCourseColor() {
  const palette = ['#1A56DB', '#7E3AF2', '#0E9F6E', '#F59E0B', '#E02424', '#0694A2', '#6875F5'];
  return palette[Math.floor(Math.random() * palette.length)];
}

/** Sınav net oranı (0–1). */
export function examSuccessRate(exam) {
  if (exam.net != null && exam.total > 0) return Math.max(0, Math.min(1, exam.net / exam.total));
  if (exam.correct != null && exam.total > 0) {
    const w = exam.wrong ?? 0;
    return Math.max(0, Math.min(1, (exam.correct - w / 4) / exam.total));
  }
  if (exam.grade != null) return Math.max(0, Math.min(1, exam.grade / 100));
  return null;
}

/** Ders bazlı analiz. */
export function analyzeCourse(course, exams, settings) {
  const courseExams = exams.filter((e) => e.courseId === course.id);
  const grades = courseExams.map((e) => e.grade).filter((g) => g != null);
  const rates = courseExams.map(examSuccessRate).filter((r) => r != null);

  const avgGrade = grades.length ? round2(grades.reduce((a, b) => a + b, 0) / grades.length) : null;
  const avgRate = rates.length ? round2(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
  const target = course.targetGrade ?? settings.targetGrade;

  let weakness = 0.35;
  if (avgGrade != null) weakness = Math.max(0.05, Math.min(1, (target - avgGrade) / 100 + 0.15));
  if (avgRate != null) weakness = Math.max(weakness, Math.min(1, 1 - avgRate + 0.1));

  let trend = 'sabit';
  if (grades.length >= 2) {
    const last = grades[grades.length - 1];
    const prev = grades[grades.length - 2];
    if (last > prev + 3) trend = 'yükseliş';
    else if (last < prev - 3) trend = 'düşüş';
  }

  const status =
    avgGrade == null && avgRate == null
      ? 'Veri yok'
      : avgGrade != null && avgGrade >= target
        ? 'Hedefte'
        : avgGrade != null && avgGrade >= target - 10
          ? 'Geliştirilmeli'
          : 'Öncelikli';

  return {
    courseId: course.id,
    courseName: course.name,
    examCount: courseExams.length,
    avgGrade,
    avgRate,
    target,
    weakness: round2(weakness),
    trend,
    status,
    recommendation: buildRecommendation(course.name, avgGrade, avgRate, target, trend),
  };
}

function buildRecommendation(name, avgGrade, avgRate, target, trend) {
  if (avgGrade == null && avgRate == null) {
    return `${name} için en az bir sınav notu veya test sonucu girin; plan otomatik oluşur.`;
  }
  const parts = [];
  if (avgGrade != null && avgGrade < target) {
    parts.push(`Not ortalamanız (${avgGrade}) hedefin (${target}) altında.`);
  }
  if (avgRate != null && avgRate < 0.6) {
    parts.push(`Test net oranınız düşük (${Math.round(avgRate * 100)}%); konu tekrarı ve soru çözümü artırılmalı.`);
  }
  if (trend === 'düşüş') parts.push('Son sınavda düşüş var; haftalık tekrar süresini artırın.');
  if (trend === 'yükseliş') parts.push('Son sınavda yükseliş var; tempoyu koruyun.');
  if (!parts.length) parts.push('Genel performans iyi; dengeyi korumak için düzenli tekrar yeterli.');
  return parts.join(' ');
}

/** Tüm dersler özeti. */
export function analyzeAll(state) {
  const analyses = state.courses.map((c) => analyzeCourse(c, state.exams, state.settings));
  const withData = analyses.filter((a) => a.examCount > 0);
  const overallAvg =
    withData.filter((a) => a.avgGrade != null).length > 0
      ? round2(
          withData.filter((a) => a.avgGrade != null).reduce((s, a) => s + a.avgGrade, 0) /
            withData.filter((a) => a.avgGrade != null).length,
        )
      : null;

  return {
    courses: analyses,
    totalCourses: state.courses.length,
    totalExams: state.exams.length,
    overallAvg,
    priorityCourses: [...analyses].sort((a, b) => b.weakness - a.weakness).slice(0, 3),
  };
}

/** Haftalık pomodoro dağılımı ve günlük program. */
export function buildWeeklyPlan(state) {
  const { settings } = state;
  const workMin = settings.workMinutes || 25;
  const totalPomodoros = Math.max(
    state.courses.length,
    Math.round(((settings.weeklyStudyHours || 14) * 60) / workMin),
  );

  const analyses = state.courses.map((c) => analyzeCourse(c, state.exams, settings));
  const weights = analyses.map((a) => ({
    courseId: a.courseId,
    courseName: a.courseName,
    weight: a.examCount > 0 ? a.weakness : 0.25,
  }));

  const weightSum = weights.reduce((s, w) => s + w.weight, 0) || 1;
  const allocations = weights.map((w) => ({
    ...w,
    pomodoros: Math.max(1, Math.round((w.weight / weightSum) * totalPomodoros)),
    minutes: 0,
  }));

  let allocated = allocations.reduce((s, a) => s + a.pomodoros, 0);
  while (allocated > totalPomodoros) {
    const max = allocations.reduce((best, a) => (a.pomodoros > best.pomodoros ? a : best));
    max.pomodoros -= 1;
    allocated -= 1;
  }
  while (allocated < totalPomodoros && allocations.length) {
    const max = allocations.reduce((best, a) => (a.weight > best.weight ? a : best));
    max.pomodoros += 1;
    allocated += 1;
  }

  for (const a of allocations) {
    a.minutes = a.pomodoros * workMin;
    a.hours = round2(a.minutes / 60);
  }

  const weekDays = [1, 2, 3, 4, 5, 6, 0];
  const schedule = weekDays.map((dayIndex) => ({
    dayIndex,
    dayName: DAY_NAMES[dayIndex],
    slots: [],
  }));

  for (const alloc of allocations) {
    let remaining = alloc.pomodoros;
    let dayPtr = 0;
    while (remaining > 0 && dayPtr < 14) {
      const day = schedule[dayPtr % schedule.length];
      const chunk = remaining >= 2 ? 2 : 1;
      day.slots.push({
        courseId: alloc.courseId,
        courseName: alloc.courseName,
        pomodoros: chunk,
        minutes: chunk * workMin,
      });
      remaining -= chunk;
      dayPtr += 1;
    }
  }

  const todayIndex = new Date().getDay();
  const todayPlan = schedule.find((d) => d.dayIndex === todayIndex) || { slots: [] };
  const todayByCourse = {};
  for (const slot of todayPlan.slots) {
    todayByCourse[slot.courseId] = (todayByCourse[slot.courseId] || 0) + slot.pomodoros;
  }

  return {
    totalPomodoros,
    totalMinutes: totalPomodoros * workMin,
    totalHours: round2((totalPomodoros * workMin) / 60),
    allocations,
    schedule,
    todayByCourse,
    generatedAt: new Date().toISOString(),
  };
}

/** Yazdırılabilir plan HTML. */
export function buildPlanPrintHtml(state, analysis, plan) {
  const rows = plan.schedule
    .map((day) => {
      if (!day.slots.length) {
        return `<tr><td>${escapeHtml(day.dayName)}</td><td colspan="3" class="muted">Dinlenme / tekrar yok</td></tr>`;
      }
      return day.slots
        .map(
          (s, i) => `
        <tr>
          ${i === 0 ? `<td rowspan="${day.slots.length}">${escapeHtml(day.dayName)}</td>` : ''}
          <td>${escapeHtml(s.courseName)}</td>
          <td>${s.pomodoros} pomodoro</td>
          <td>${s.minutes} dk</td>
        </tr>`,
        )
        .join('');
    })
    .join('');

  const statRows = analysis.courses
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.courseName)}</td>
      <td>${c.examCount}</td>
      <td>${c.avgGrade ?? '—'}</td>
      <td>${c.avgRate != null ? `${Math.round(c.avgRate * 100)}%` : '—'}</td>
      <td>${escapeHtml(c.status)}</td>
      <td>${c.weakness}</td>
    </tr>`,
    )
    .join('');

  const allocRows = plan.allocations
    .map(
      (a) => `
    <tr>
      <td>${escapeHtml(a.courseName)}</td>
      <td>${a.pomodoros}</td>
      <td>${a.hours} saat</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/>
<title>Ders Çalışma Planı — ROTA AI</title>
<style>
  body { font-family: Nunito, sans-serif; padding: 24px; color: #111; }
  h1 { font-size: 1.4rem; } h2 { font-size: 1.1rem; margin-top: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f4ff; }
  .muted { color: #666; }
  .meta { font-size: 0.85rem; color: #555; }
</style></head><body>
  <h1>Haftalık Ders Çalışma Planı</h1>
  <p class="meta">Oluşturulma: ${new Date(plan.generatedAt).toLocaleString('tr-TR')} · Pomodoro: ${state.settings.workMinutes} dk çalışma / ${state.settings.shortBreakMinutes} dk mola</p>
  <h2>Derslerim Analizi</h2>
  <table>
    <thead><tr><th>Ders</th><th>Sınav</th><th>Ort. not</th><th>Net oranı</th><th>Durum</th><th>Öncelik</th></tr></thead>
    <tbody>${statRows || '<tr><td colspan="6">Henüz ders eklenmedi.</td></tr>'}</tbody>
  </table>
  <h2>Haftalık Pomodoro Dağılımı</h2>
  <table>
    <thead><tr><th>Ders</th><th>Pomodoro</th><th>Süre</th></tr></thead>
    <tbody>${allocRows}</tbody>
  </table>
  <p><strong>Toplam:</strong> ${plan.totalPomodoros} pomodoro · ${plan.totalHours} saat</p>
  <h2>Günlük Program</h2>
  <table>
    <thead><tr><th>Gün</th><th>Ders</th><th>Pomodoro</th><th>Süre</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4">Program boş.</td></tr>'}</tbody>
  </table>
  <h2>Öneriler</h2>
  <ul>${analysis.courses.map((c) => `<li><strong>${escapeHtml(c.courseName)}:</strong> ${escapeHtml(c.recommendation)}</li>`).join('')}</ul>
</body></html>`;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportPlanPdf(state, analysis, plan) {
  const html = buildPlanPrintHtml(state, analysis, plan);
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
  return true;
}
