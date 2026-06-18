import { bumpLessonOpens, renderLessonsStats } from '../../lib/page-stats.js';

let curriculum = null;

const LEVEL_LABELS = {
  ilkokul: 'İlkokul',
  ortaokul: 'Ortaokul',
  lise: 'Lise',
  mezun: 'Mezun / YKS',
};

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

function render() {
  const root = document.getElementById('lessons-groups');
  if (!root) return;

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
  await loadCurriculum();
  renderLessonsStats();
  render();
  document.getElementById('lessons-level')?.addEventListener('change', render);
  document.getElementById('lessons-search')?.addEventListener('input', render);
}
