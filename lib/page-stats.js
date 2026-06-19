import { getItem, setItem } from './storage.js';
import { getCurrentUser } from './sidebar-auth.js';
import { getAIEngine } from './ai-engine.js';
import { isGroqAvailable } from './groq-api.js';
import { loadChatSessions } from './chat-storage.js';
import { scopedGet, scopedSet } from './guest-session.js';

export function getExamStats() {
  return scopedGet('exam_stats', { correct: 0, wrong: 0, blank: 0 });
}

export function getSolverStats() {
  return scopedGet('solver_stats', { solved: 0 });
}

export function bumpSolverStats() {
  const s = getSolverStats();
  s.solved = (s.solved || 0) + 1;
  scopedSet('solver_stats', s);
  return s;
}

export function bumpLessonOpens() {
  const s = getItem('lessons_stats', { opens: 0 });
  s.opens = (s.opens || 0) + 1;
  setItem('lessons_stats', s);
  return s;
}

function memberLabel() {
  const m = getCurrentUser();
  if (m) return 'Üye';
  return 'Misafir';
}

/**
 * @param {string} containerId
 * @param {{ value: string|number, label: string }[]} items
 */
export function renderPageStats(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items
    .map(
      (item) => `
    <div class="card page-stat-card card-3d">
      <strong>${item.value}</strong>
      <span>${item.label}</span>
    </div>`,
    )
    .join('');
}

export function renderDashboardStats(containerId = 'dash-stats') {
  const exam = getExamStats();
  const solver = getSolverStats();
  const sessions = loadChatSessions();
  renderPageStats(containerId, [
    { value: getItem('library_favorites', []).length, label: 'Favori kitap' },
    { value: getItem('library_recent', []).length, label: 'Son okunan' },
    { value: exam.correct || 0, label: 'Doğru cevap' },
    { value: sessions.length, label: 'AI sohbet' },
    { value: solver.solved || 0, label: 'Çözülen soru' },
    { value: getAIEngine().getStatusLabel(), label: 'AI durumu' },
  ]);
}

export function renderLessonsStats(containerId = 'page-stats-lessons') {
  const opens = getItem('lessons_stats', { opens: 0 }).opens || 0;
  renderPageStats(containerId, [
    { value: opens, label: 'Ders açılışı' },
    { value: memberLabel(), label: 'Oturum' },
    { value: getItem('library_recent', []).length, label: 'Kütüphane ziyareti' },
    { value: getExamStats().correct || 0, label: 'Sınav doğru' },
  ]);
}

export function renderLibraryStats(containerId = 'page-stats-library', bookCount = 0) {
  renderPageStats(containerId, [
    { value: bookCount, label: 'Kitap' },
    { value: getItem('library_favorites', []).length, label: 'Favori' },
    { value: getItem('library_recent', []).length, label: 'Son okunan' },
    { value: memberLabel(), label: 'Oturum' },
  ]);
}

export function renderExamsStats(containerId = 'page-stats-exams', catalog = []) {
  const s = getExamStats();
  const entries = Array.isArray(catalog) ? catalog : [];
  const catalogCount = Array.isArray(catalog) ? catalog.length : catalog;
  const parsedCount = entries.filter((e) => e.parsed || e.questionCount > 0).length;
  const totalQ = entries.reduce((n, e) => n + (e.questionCount || 0), 0);
  const total = (s.correct || 0) + (s.wrong || 0);
  const pct = total ? Math.round(((s.correct || 0) / total) * 100) : 0;
  const byExam = s.byExam || {};
  const practicedExams = Object.keys(byExam).length;

  renderPageStats(containerId, [
    { value: catalogCount, label: 'Kitapçık' },
    { value: parsedCount || '—', label: 'Soru bankası' },
    { value: totalQ || '—', label: 'Toplam soru' },
    { value: s.correct || 0, label: 'Doğru' },
    { value: s.wrong || 0, label: 'Yanlış' },
    { value: `${pct}%`, label: 'Başarı' },
    { value: practicedExams, label: 'Çalışılan kitapçık' },
    { value: s.sessions || 0, label: 'Oturum' },
  ]);
}

export function renderChatStats(containerId = 'page-stats-chat') {
  const sessions = loadChatSessions();
  const msgs = sessions.reduce((n, s) => n + (s.messages?.length || 0), 0);
  renderPageStats(containerId, [
    { value: sessions.length, label: 'Sohbet' },
    { value: msgs, label: 'Mesaj' },
    { value: getAIEngine().getStatusLabel(), label: 'AI motoru' },
    { value: getCurrentUser() ? 'Aktif' : '—', label: 'Site üyeliği' },
  ]);
}

export async function renderSolverStats(containerId = 'page-stats-solver') {
  const s = getSolverStats();
  const groqOk = await isGroqAvailable();
  renderPageStats(containerId, [
    { value: s.solved || 0, label: 'Çözülen soru' },
    { value: groqOk ? 'Aktif' : '—', label: 'Groq AI' },
    { value: getAIEngine().getStatusLabel(), label: 'AI durumu' },
    { value: memberLabel(), label: 'Oturum' },
  ]);
}
