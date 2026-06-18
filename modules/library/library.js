import { getItem, setItem } from '../../lib/storage.js';
import { filterOnSiteBooks, isOnSiteBook, LIBRARY_GRADES } from '../../lib/library-books.js';
import { resolveBookReadUrl } from '../../lib/library-url.js';
import { LibraryReader, detectReaderMode } from './reader.js';
import { renderLibraryStats } from '../../lib/page-stats.js';



let books = [];
let reader = null;
let readerDialogEl = null;

const READER_SHELL_HTML = `
  <div class="lib-reader-header">
    <h3 id="reader-title"></h3>
    <button type="button" class="btn btn-ghost" id="reader-close" aria-label="Kapat">
      <i data-lucide="x"></i>
    </button>
  </div>
  <div id="reader-toolbar" class="reader-toolbar" aria-label="Okuyucu araç çubuğu"></div>
  <div class="lib-reader-body" id="reader-body"></div>
`;

function removeReaderShell() {
  const el = readerDialogEl;
  readerDialogEl = null;
  reader?.onNativeClose?.();
  reader = null;
  if (!el) return;
  if (el.open) {
    try {
      el.close();
    } catch {
      /* zaten kapanıyor */
    }
  }
  el.remove();
}

function ensureReaderDialog() {
  if (readerDialogEl && reader) return readerDialogEl;

  if (!readerDialogEl) {
    readerDialogEl = document.createElement('dialog');
    readerDialogEl.id = 'lib-reader';
    readerDialogEl.className = 'lib-reader reader-mode-pdf';
    readerDialogEl.innerHTML = READER_SHELL_HTML;
    document.body.appendChild(readerDialogEl);

    readerDialogEl.addEventListener('cancel', (e) => {
      e.preventDefault();
      reader?.close();
    });

    readerDialogEl.addEventListener('close', () => {
      reader?.onNativeClose?.();
    });

    readerDialogEl.querySelector('#reader-close')?.addEventListener('click', () => {
      reader?.close();
    });

    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ nodes: [readerDialogEl] });
    }
  }

  if (!reader) {
    reader = new LibraryReader(readerDialogEl);
  }

  return readerDialogEl;
}

let curriculum = null;

let listView = false;

let isAdmin = false;

let adminToken = getItem('library_admin_token', '');



const OFFICE_EXTS = ['.doc', '.docx', '.ppt', '.pptx'];



function escapeHtml(text) {

  return String(text ?? '')

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;');

}



function getFavorites() {

  return getItem('library_favorites', []);

}



function getRecent() {

  return getItem('library_recent', []);

}



function toggleFavorite(id) {

  const fav = getFavorites();

  const i = fav.indexOf(id);

  if (i >= 0) fav.splice(i, 1);

  else fav.push(id);

  setItem('library_favorites', fav);

  render();

}



function addRecent(book) {

  let recent = getRecent().filter((r) => r.id !== book.id);

  recent.unshift({ id: book.id, title: book.title, at: Date.now() });

  recent = recent.slice(0, 8);

  setItem('library_recent', recent);

}



function fileExt(url) {

  try {

    const path = new URL(url, window.location.origin).pathname.toLowerCase();

    const dot = path.lastIndexOf('.');

    return dot >= 0 ? path.slice(dot) : '';

  } catch {

    return '';

  }

}



function isPdfBook(book, url) {

  const fmt = (book.format || '').toLowerCase();

  return fmt === 'pdf' || fileExt(url) === '.pdf';

}



function viewerUrl(book, url) {

  if (!url) return null;

  const mode = detectReaderMode(book, url);

  if (mode === 'pdf') return url;

  const ext = fileExt(url);

  if (OFFICE_EXTS.includes(ext) || mode === 'office') {

    const abs = url.startsWith('http') ? url : new URL(url, window.location.origin).href;

    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(abs)}`;

  }

  return null;

}



function readUrl(book) {
  return resolveBookReadUrl(book) || book.localPath || null;
}



function openBook(book) {

  if (!isOnSiteBook(book)) {

    alert('Bu kitap sitede barındırılmıyor. Yalnızca sitedeki kitaplar açılabilir.');

    return;

  }

  addRecent(book);

  const url = readUrl(book);

  const embed = viewerUrl(book, url);

  if (embed) {

    showReader(book, embed, url);

    return;

  }

  alert('Bu kitap şu an okuyucuda açılamıyor.');

}



async function showReader(book, embedUrl, sourceUrl) {
  ensureReaderDialog();
  if (!reader) return;
  const src = sourceUrl || readUrl(book);
  try {
    await reader.open(book, embedUrl || src, src);
  } catch (err) {
    console.error('Okuyucu açılamadı', err);
    alert('Kitap okuyucusu açılırken bir sorun oluştu. Sayfayı yenileyip tekrar deneyin.');
    removeReaderShell();
  }
}



function renderBookCard(book) {

  const fav = getFavorites().includes(book.id);

  const offline = book.isOffline || book.localPath

    ? '<span class="badge badge-success">Yerel</span>'

    : '<span class="badge">Çevrimiçi</span>';

  const adminDel = isAdmin && book.id?.startsWith('custom-')

    ? `<button type="button" class="btn btn-ghost btn-sm lib-del" data-id="${book.id}" aria-label="Sil">Sil</button>`

    : '';



  return `

    <article class="card lib-book-card" data-id="${book.id}">

      <strong>${escapeHtml(book.title)}</strong>

      <div class="meta">${escapeHtml(book.author)} · ${book.grade}. sınıf · ${escapeHtml(book.subject)}</div>

      <p style="font-size:0.85rem;margin:0">${escapeHtml(book.description || '')}</p>

      <div>${offline}</div>

      <div class="actions">

        <button type="button" class="btn btn-primary btn-sm lib-open">Oku</button>

        <button type="button" class="btn btn-ghost btn-sm lib-fav" data-fav="${book.id}" aria-label="Favori">

          ${fav ? '★' : '☆'}

        </button>

        ${adminDel}

      </div>

    </article>

  `;

}



function parseSubjectFilter(raw, grade) {

  if (!raw) return { grade: grade || '', subject: '' };

  if (grade) return { grade, subject: raw };

  const mezun = raw.match(/^Mezun — (.+)$/);

  if (mezun) return { grade: 'mezun', subject: mezun[1] };

  const m = raw.match(/^(\d+)\. sınıf — (.+)$/);

  if (m) return { grade: m[1], subject: m[2] };

  return { grade: grade || '', subject: raw };

}



function filterBooks() {

  const q = (document.getElementById('lib-search')?.value || '').toLowerCase();

  const gradeSel = document.getElementById('lib-grade')?.value || '';

  const subjectRaw = document.getElementById('lib-subject')?.value || '';

  const { grade, subject } = parseSubjectFilter(subjectRaw, gradeSel);



  return books.filter((b) => {

    if (grade && String(b.grade) !== String(grade)) return false;

    if (subject && b.subject !== subject) return false;

    if (!q) return true;

    const hay = `${b.title} ${b.author} ${b.subject} ${b.grade} ${(b.tags || []).join(' ')}`.toLowerCase();

    return hay.includes(q);

  });

}



function render() {

  const filtered = filterBooks();
  renderLibraryStats('page-stats-library', books.length);

  const results = document.getElementById('lib-results');

  if (results) {

    results.classList.toggle('list-view', listView);

    results.innerHTML = filtered.map(renderBookCard).join('') || '<p class="empty-state">Sonuç bulunamadı.</p>';

  }



  const favIds = getFavorites();

  const favBooks = books.filter((b) => favIds.includes(b.id));

  const favEl = document.getElementById('lib-favorites');

  if (favEl) {

    favEl.innerHTML = favBooks.length

      ? `<h3>Favoriler</h3><div class="card-grid">${favBooks.map(renderBookCard).join('')}</div>`

      : '';

  }



  const recent = getRecent();

  const recEl = document.getElementById('lib-recent');

  if (recEl) {

    recEl.innerHTML = recent.length

      ? `<h3>Yakın zamanda okunanlar</h3><div class="card-grid">${recent.map((r) => {

          const b = books.find((x) => x.id === r.id);

          return b ? renderBookCard(b) : '';

        }).join('')}</div>`

      : '';

  }



  const addBtn = document.getElementById('lib-admin-add');

  if (addBtn) addBtn.hidden = !isAdmin;



  bindCardEvents();

}



function bindCardEvents() {

  document.querySelectorAll('.lib-book-card').forEach((card) => {
    card.onclick = (e) => {
      if (e.target.closest('.lib-fav, .lib-del, .lib-open')) return;
      const book = books.find((b) => b.id === card.dataset.id);
      if (book) openBook(book);
    };
  });

  document.querySelectorAll('.lib-open').forEach((btn) => {

    btn.onclick = (e) => {

      e.stopPropagation();

      const card = e.target.closest('[data-id]');

      const book = books.find((b) => b.id === card?.dataset.id);

      if (book) openBook(book);

    };

  });

  document.querySelectorAll('.lib-fav').forEach((btn) => {

    btn.onclick = () => toggleFavorite(btn.dataset.fav);

  });

  document.querySelectorAll('.lib-del').forEach((btn) => {

    btn.onclick = () => removeCustomBook(btn.dataset.id);

  });

}



async function removeCustomBook(id) {

  if (!isAdmin || !adminToken) return;

  if (!confirm('Bu kaynağı kütüphaneden kaldırmak istiyor musunuz?')) return;



  const res = await fetch('/api/library/remove', {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${adminToken}`,

    },

    body: JSON.stringify({ id }),

  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {

    alert(data.error || 'Silinemedi.');

    return;

  }

  books = books.filter((b) => b.id !== id);

  render();

}



function subjectsForGrade(grade) {

  if (!grade || !curriculum) return [];

  if (grade === 'mezun' && curriculum.mezun) {

    return curriculum.mezun.subjects.map((s) => s.name);

  }

  const block = (curriculum.grades || []).find((g) => String(g.grade) === String(grade));

  if (block) return block.subjects.map((s) => s.name);

  return [...new Set(books.filter((b) => String(b.grade) === String(grade)).map((b) => b.subject))].sort();

}



function fillGradeOptions() {

  const gradeSel = document.getElementById('lib-grade');

  if (!gradeSel) return;



  const grades = [...LIBRARY_GRADES];

  gradeSel.innerHTML = '<option value="">Tüm sınıflar</option>';

  grades.forEach((g) => {

    const o = document.createElement('option');

    o.value = g;

    o.textContent = `${g}. sınıf`;

    gradeSel.appendChild(o);

  });

}



function fillSubjectOptions(preserveSubject) {

  const subSel = document.getElementById('lib-subject');

  const gradeSel = document.getElementById('lib-grade');

  if (!subSel) return;



  const grade = gradeSel?.value || '';

  let subjects = grade ? subjectsForGrade(grade) : [];



  if (!grade) {

    const seen = new Set();

    for (const g of (curriculum?.grades || [])) {

      if (!LIBRARY_GRADES.includes(Number(g.grade))) continue;

      for (const s of g.subjects) {

        const key = `${g.grade}::${s.name}`;

        if (!seen.has(key)) {

          seen.add(key);

          subjects.push(`${g.grade}. sınıf — ${s.name}`);

        }

      }

    }

    subjects.sort((a, b) => a.localeCompare(b, 'tr'));

  }



  subSel.innerHTML = '<option value="">Tüm dersler</option>';

  subjects.forEach((s) => {

    const o = document.createElement('option');

    o.value = s;

    o.textContent = s;

    subSel.appendChild(o);

  });



  if (preserveSubject && subjects.includes(preserveSubject)) {

    subSel.value = preserveSubject;

  }

}



function applyStoredFilter() {

  try {

    const raw = sessionStorage.getItem('aikoc_library_filter');

    if (!raw) return;

    sessionStorage.removeItem('aikoc_library_filter');

    const { grade, subject } = JSON.parse(raw);

    const gradeSel = document.getElementById('lib-grade');

    const subSel = document.getElementById('lib-subject');

    if (grade && gradeSel) {

      gradeSel.value = String(grade);

      fillSubjectOptions(subject || '');

    }

    if (subject && subSel) subSel.value = subject;

  } catch {

    /* geçersiz filtre */

  }

}



async function loadBooks() {

  try {

    const res = await fetch('/api/library/books', { credentials: 'same-origin' });

    if (res.ok) {

      const data = await res.json();

      books = filterOnSiteBooks(data.books || []);

      return;

    }

  } catch {

    /* API yoksa statik dosyaya düş */

  }

  const fallback = await fetch('data/books.json');

  const data = await fallback.json();

  books = filterOnSiteBooks(data.books || []);

}



async function refreshAdminStatus() {

  const headers = {};

  if (adminToken) headers.Authorization = `Bearer ${adminToken}`;

  try {

    const res = await fetch('/api/library/admin/status', { headers, credentials: 'same-origin' });

    if (res.ok) {

      const data = await res.json();

      isAdmin = Boolean(data.isAdmin);

      return;

    }

  } catch {

    /* offline */

  }

  isAdmin = Boolean(adminToken);

}



function openAdminLogin() {

  const dialog = document.getElementById('lib-admin-login');

  const err = document.getElementById('lib-admin-login-error');

  if (err) err.textContent = '';

  dialog?.showModal();

}



async function submitAdminLogin(e) {

  e.preventDefault();

  const pin = document.getElementById('lib-admin-pin')?.value || '';

  const err = document.getElementById('lib-admin-login-error');

  const res = await fetch('/api/library/admin/verify', {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ pin }),

  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {

    if (err) err.textContent = data.error || 'Giriş başarısız.';

    return;

  }

  adminToken = data.token;

  setItem('library_admin_token', adminToken);

  isAdmin = true;

  document.getElementById('lib-admin-login')?.close();

  render();

}



function openAdminAdd() {

  if (!isAdmin) {

    openAdminLogin();

    return;

  }

  const form = document.getElementById('lib-admin-add-form');

  form?.reset();

  document.getElementById('lib-admin-add-error').textContent = '';

  document.getElementById('lib-admin-add-dialog')?.showModal();

}



function readFileAsBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const result = String(reader.result || '');

      const base64 = result.includes(',') ? result.split(',')[1] : result;

      resolve(base64);

    };

    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);

  });

}



async function submitAdminAdd(e) {

  e.preventDefault();

  if (!isAdmin || !adminToken) return;



  const errEl = document.getElementById('lib-admin-add-error');

  const title = document.getElementById('lib-add-title')?.value?.trim();

  const author = document.getElementById('lib-add-author')?.value?.trim();

  const grade = Number(document.getElementById('lib-add-grade')?.value) || 12;

  const subject = document.getElementById('lib-add-subject')?.value?.trim();

  const description = document.getElementById('lib-add-desc')?.value?.trim();


  const fileInput = document.getElementById('lib-add-file');

  const file = fileInput?.files?.[0];



  if (!title) {

    if (errEl) errEl.textContent = 'Başlık zorunludur.';

    return;

  }

  if (!file) {

    if (errEl) errEl.textContent = 'Kitap dosyası yüklemeniz gerekir.';

    return;

  }



  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

  if (file) {

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowed.includes(ext)) {

      if (errEl) errEl.textContent = 'Yalnızca PDF, DOC, DOCX, PPT dosyaları yüklenebilir.';

      return;

    }

    if (file.size > 8 * 1024 * 1024) {

      if (errEl) errEl.textContent = 'Dosya en fazla 8 MB olabilir.';

      return;

    }

  }



  if (errEl) errEl.textContent = 'Yükleniyor…';



  const body = {
    title,
    author,
    grade,
    subject,
    description,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileBase64: await readFileAsBase64(file),
  };



  const res = await fetch('/api/library/add', {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${adminToken}`,

    },

    body: JSON.stringify(body),

  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {

    if (errEl) errEl.textContent = data.error || 'Eklenemedi.';

    return;

  }



  if (data.book) books.unshift(data.book);

  document.getElementById('lib-admin-add-dialog')?.close();

  render();

}



function purgeStaleReaderPanels() {
  document.querySelectorAll('#lib-reader, .library-module #lib-reader').forEach((el) => {
    if (el.open) {
      try {
        el.close();
      } catch {
        /* ignore */
      }
    }
    el.remove();
  });
  removeReaderShell();
}

export async function init() {
  purgeStaleReaderPanels();

  await loadBooks();

  const curRes = await fetch('data/curriculum.json');

  curriculum = await curRes.json();

  await refreshAdminStatus();



  fillGradeOptions();

  fillSubjectOptions();

  applyStoredFilter();

  render();



  document.getElementById('lib-search')?.addEventListener('input', render);

  document.getElementById('lib-grade')?.addEventListener('change', () => {

    fillSubjectOptions();

    render();

  });

  document.getElementById('lib-subject')?.addEventListener('change', render);

  document.getElementById('lib-view-toggle')?.addEventListener('click', () => {

    listView = !listView;

    render();

  });

  document.getElementById('lib-admin-login-btn')?.addEventListener('click', openAdminLogin);

  document.getElementById('lib-admin-add')?.addEventListener('click', openAdminAdd);

  document.getElementById('lib-admin-login-form')?.addEventListener('submit', submitAdminLogin);

  document.getElementById('lib-admin-add-form')?.addEventListener('submit', submitAdminAdd);

  document.getElementById('lib-admin-login-cancel')?.addEventListener('click', () => {

    document.getElementById('lib-admin-login')?.close();

  });

  document.getElementById('lib-admin-add-cancel')?.addEventListener('click', () => {

    document.getElementById('lib-admin-add-dialog')?.close();

  });

}



export function destroy() {
  removeReaderShell();
}

