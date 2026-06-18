/**
 * Sevimli kütüphane okuyucu — PDF (pdf.js), Office (embed), harici bağlantılar.
 */

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs';
const PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

let pdfLibPromise = null;

function loadPdfJs() {
  if (!pdfLibPromise) {
    pdfLibPromise = import(PDFJS_CDN).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
      return lib;
    });
  }
  return pdfLibPromise;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

export function detectReaderMode(book, url) {
  const fmt = (book?.format || '').toLowerCase();
  const ext = fileExt(url);
  if (fmt === 'pdf' || ext === '.pdf') return 'pdf';
  if (['.doc', '.docx', '.ppt', '.pptx'].includes(ext)) return 'office';
  if (fmt === 'doc' || fmt === 'docx' || fmt === 'ppt' || fmt === 'pptx') return 'office';
  return 'embed';
}

export class LibraryReader {
  constructor(dialogEl) {
    this.dialog = dialogEl;
    this.titleEl = dialogEl?.querySelector('#reader-title');
    this.bodyEl = dialogEl?.querySelector('#reader-body');
    this.toolbarEl = dialogEl?.querySelector('#reader-toolbar');
    this.state = {
      book: null,
      url: null,
      mode: null,
      pdf: null,
      page: 1,
      pages: 1,
      scale: 1.1,
      rendering: false,
    };
    this._onKey = this._onKey.bind(this);
    this._onActionClick = this._onActionClick.bind(this);
    this.toolbarEl?.addEventListener('click', this._onActionClick);
    this.bodyEl?.addEventListener('click', this._onActionClick);
  }

  _onActionClick(e) {
    const btn = e.target.closest('[data-reader-action]');
    if (!btn) return;
    const action = btn.dataset.readerAction;
    if (action === 'prev') this.prevPage();
    if (action === 'next') this.nextPage();
    if (action === 'zoom-in') this.zoom(0.15);
    if (action === 'zoom-out') this.zoom(-0.15);
    if (action === 'fit') this.fitWidth();
    if (action === 'external') this.openExternal();
  }

  async open(book, url, sourceUrl) {
    if (!this.dialog || !this.bodyEl) return;
    this.closePdf();
    this.state.book = book;
    this.state.url = url;
    this.state.mode = detectReaderMode(book, url);
    this.state.page = this._loadProgress(book?.id) || 1;

    if (this.titleEl) this.titleEl.textContent = book?.title || 'Kitap';

    this.dialog.classList.remove('reader-mode-pdf', 'reader-mode-office', 'reader-mode-embed');
    this.dialog.classList.add(`reader-mode-${this.state.mode}`);

    document.addEventListener('keydown', this._onKey);
    this.dialog.showModal();

    if (this.state.mode === 'pdf') {
      await this._openPdf(url);
    } else if (this.state.mode === 'office') {
      this._openOffice(url, sourceUrl);
    } else {
      this._openEmbed(url, sourceUrl);
    }
  }

  _cleanup() {
    document.removeEventListener('keydown', this._onKey);
    this.closePdf();
    if (this.bodyEl) this.bodyEl.innerHTML = '';
    if (this.toolbarEl) this.toolbarEl.innerHTML = '';
    if (this.titleEl) this.titleEl.textContent = '';
    this.state.book = null;
    this.state.url = null;
    this.state.mode = null;
    this.state.page = 1;
    this.state.pages = 1;
  }

  close() {
    this._cleanup();
    if (this.dialog?.open) this.dialog.close();
  }

  /** Dialog dışarıdan kapatıldığında (arka plan tıklama vb.) */
  onNativeClose() {
    this._cleanup();
  }

  closePdf() {
    if (this.state.pdf) {
      this.state.pdf.destroy?.();
      this.state.pdf = null;
    }
  }

  _onKey(e) {
    if (!this.dialog?.open) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      this.nextPage();
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      this.prevPage();
    }
    if (e.key === '+' || e.key === '=') this.zoom(0.1);
    if (e.key === '-') this.zoom(-0.1);
  }

  _loadProgress(id) {
    if (!id) return 1;
    try {
      const raw = localStorage.getItem(`lib_progress_${id}`);
      if (!raw) return 1;
      const p = JSON.parse(raw);
      return Number(p?.page) || 1;
    } catch {
      return 1;
    }
  }

  _saveProgress() {
    const { book, page } = this.state;
    if (!book?.id) return;
    try {
      localStorage.setItem(`lib_progress_${book.id}`, JSON.stringify({ page, updated: Date.now() }));
    } catch { /* quota */ }
  }

  _setToolbar(html) {
    if (this.toolbarEl) this.toolbarEl.innerHTML = html;
  }

  _progressPct() {
    const { page, pages } = this.state;
    if (!pages) return 0;
    return Math.round((page / pages) * 100);
  }

  _renderToolbar() {
    const { page, pages, mode } = this.state;
    const pct = this._progressPct();
    const pageBlock =
      mode === 'pdf'
        ? `<span class="reader-page-pill" aria-live="polite">
            <span class="reader-mascot" aria-hidden="true">📖</span>
            Sayfa <strong>${page}</strong> / ${pages}
          </span>`
        : `<span class="reader-page-pill"><span class="reader-mascot" aria-hidden="true">📚</span> Okuyucu</span>`;

    this._setToolbar(`
      <div class="reader-toolbar-inner">
        <div class="reader-toolbar-left">${pageBlock}</div>
        <div class="reader-toolbar-center">
          ${mode === 'pdf' ? `
            <button type="button" class="reader-btn" data-reader-action="prev" title="Önceki sayfa" aria-label="Önceki sayfa">‹</button>
            <div class="reader-progress-wrap" title="İlerleme %${pct}">
              <div class="reader-progress-bar" style="width:${pct}%"></div>
            </div>
            <button type="button" class="reader-btn" data-reader-action="next" title="Sonraki sayfa" aria-label="Sonraki sayfa">›</button>
          ` : ''}
        </div>
        <div class="reader-toolbar-right">
          ${mode === 'pdf' ? `
            <button type="button" class="reader-btn" data-reader-action="zoom-out" title="Uzaklaştır" aria-label="Uzaklaştır">−</button>
            <button type="button" class="reader-btn" data-reader-action="fit" title="Sığdır" aria-label="Genişliğe sığdır">⤢</button>
            <button type="button" class="reader-btn" data-reader-action="zoom-in" title="Yakınlaştır" aria-label="Yakınlaştır">+</button>
          ` : ''}
          <button type="button" class="reader-btn reader-btn-ghost" data-reader-action="external" title="Yeni sekmede aç">↗</button>
        </div>
      </div>
    `);
  }

  async _openPdf(url) {
    this.bodyEl.innerHTML = `
      <div class="reader-stage reader-loading">
        <div class="reader-loader">
          <span class="reader-loader-book">📕</span>
          <p>Kitap açılıyor…</p>
        </div>
        <canvas id="reader-pdf-canvas" class="reader-pdf-canvas" hidden></canvas>
      </div>
    `;
    this._renderToolbar();

    try {
      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument({
        url,
        withCredentials: false,
        disableRange: false,
        disableStream: false,
      });
      const pdf = await task.promise;
      this.state.pdf = pdf;
      this.state.pages = pdf.numPages;
      if (this.state.page > this.state.pages) this.state.page = 1;
      const loader = this.bodyEl.querySelector('.reader-loading');
      const canvas = this.bodyEl.querySelector('#reader-pdf-canvas');
      if (loader) loader.classList.remove('reader-loading');
      if (canvas) canvas.hidden = false;
      await this._renderPdfPage();
    } catch (err) {
      this.bodyEl.innerHTML = `
        <div class="reader-error">
          <p>PDF açılamadı. Harici bağlantıyı deneyin.</p>
          <button type="button" class="btn btn-primary btn-sm" data-reader-action="external">Kaynağı aç</button>
        </div>
      `;
      console.warn('PDF okuyucu', err);
    }
  }

  async _renderPdfPage() {
    const { pdf, page, scale, rendering } = this.state;
    if (!pdf || rendering) return;
    const canvas = this.bodyEl?.querySelector('#reader-pdf-canvas');
    if (!canvas) return;

    this.state.rendering = true;
    try {
      const pg = await pdf.getPage(page);
      const viewport = pg.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await pg.render({ canvasContext: ctx, viewport }).promise;
      this._renderToolbar();
      this._saveProgress();
    } finally {
      this.state.rendering = false;
    }
  }

  async prevPage() {
    if (this.state.mode !== 'pdf' || this.state.page <= 1) return;
    this.state.page -= 1;
    await this._renderPdfPage();
  }

  async nextPage() {
    if (this.state.mode !== 'pdf' || this.state.page >= this.state.pages) return;
    this.state.page += 1;
    await this._renderPdfPage();
  }

  async zoom(delta) {
    if (this.state.mode !== 'pdf') return;
    this.state.scale = Math.min(2.5, Math.max(0.6, this.state.scale + delta));
    await this._renderPdfPage();
  }

  async fitWidth() {
    if (this.state.mode !== 'pdf' || !this.state.pdf) return;
    const canvas = this.bodyEl?.querySelector('#reader-pdf-canvas');
    const stage = this.bodyEl?.querySelector('.reader-stage');
    if (!canvas || !stage) return;
    const pg = await this.state.pdf.getPage(this.state.page);
    const base = pg.getViewport({ scale: 1 });
    const pad = 32;
    const w = Math.max(280, (stage.clientWidth || 800) - pad);
    this.state.scale = w / base.width;
    await this._renderPdfPage();
  }

  openExternal() {
    const url = this.state.book?.externalUrl || this.state.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  _openOffice(embedUrl, sourceUrl) {
    this._renderToolbar();
    const src = embedUrl || `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sourceUrl)}`;
    this.bodyEl.innerHTML = `
      <div class="reader-stage reader-office">
        <div class="reader-office-badge">Word / PowerPoint görünümü</div>
        <iframe src="${escapeHtml(src)}" title="${escapeHtml(this.state.book?.title)}" class="reader-iframe" allowfullscreen></iframe>
      </div>
    `;
  }

  _openEmbed(url) {
    this._renderToolbar();
    this.bodyEl.innerHTML = `
      <div class="reader-stage">
        <iframe src="${escapeHtml(url)}" title="${escapeHtml(this.state.book?.title)}" class="reader-iframe"></iframe>
      </div>
    `;
  }
}
