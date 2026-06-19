function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Kitapçık PDF adresi — iframe ile doğrudan ÖSYM (X-Frame-Options yok). */
export function osymPdfProxyUrl(pdfUrl) {
  return pdfUrl || null;
}

let activeRender = 0;

function mountIframeView(stage, pdfUrl, pageNum, loading, fallback) {
  if (!stage || !pdfUrl) return;
  const iframeSrc = `${pdfUrl}#page=${pageNum}`;
  stage.innerHTML = `
    <iframe
      class="exam-pdf-frame"
      src="${escapeHtml(iframeSrc)}"
      title="ÖSYM kitapçık PDF — sayfa ${pageNum}"
      referrerpolicy="no-referrer"
    ></iframe>
  `;
  const iframe = stage.querySelector('iframe');
  iframe?.addEventListener('load', () => {
    loading?.setAttribute('hidden', '');
    fallback?.setAttribute('hidden', '');
  });
  iframe?.addEventListener('error', () => {
    if (loading) loading.textContent = 'PDF yüklenemedi.';
    fallback?.removeAttribute('hidden');
  });
}

/**
 * ÖSYM kitapçık sayfasını iframe ile bire bir gösterir (formül, şekil, şıklar dahil).
 */
export async function mountExamPdfView(container, pdfUrl, page = 1) {
  if (!container || !pdfUrl) return () => {};

  const renderId = ++activeRender;
  let pageNum = Math.max(1, parseInt(page, 10) || 1);

  container.innerHTML = `
    <div class="exam-pdf-panel exam-pdf-panel--primary">
      <div class="exam-pdf-panel-head">
        <strong class="exam-pdf-title">Kitapçık — sayfa ${pageNum}</strong>
        <span class="meta">Soru ve şıklar PDF ile aynı görünümde</span>
        <div class="exam-pdf-tools">
          <button type="button" class="btn btn-ghost btn-sm" data-pdf-page="prev" title="Önceki sayfa">‹ Sayfa</button>
          <button type="button" class="btn btn-ghost btn-sm" data-pdf-page="next" title="Sonraki sayfa">Sayfa ›</button>
          <a class="btn btn-ghost btn-sm exam-pdf-external" href="${escapeHtml(pdfUrl)}#page=${pageNum}" target="_blank" rel="noopener noreferrer">Tam ekran</a>
        </div>
      </div>
      <div class="exam-pdf-stage">
        <p class="exam-pdf-loading">Kitapçık sayfası yükleniyor…</p>
      </div>
      <p class="meta exam-pdf-fallback" hidden>
        PDF açılmazsa <a href="${escapeHtml(pdfUrl)}#page=${pageNum}" target="_blank" rel="noopener noreferrer">kitapçığı yeni sekmede açın</a>.
      </p>
    </div>
  `;

  const stage = container.querySelector('.exam-pdf-stage');
  const loading = container.querySelector('.exam-pdf-loading');
  const fallback = container.querySelector('.exam-pdf-fallback');

  function draw() {
    if (renderId !== activeRender) return;
    mountIframeView(stage, pdfUrl, pageNum, loading, fallback);
    const head = container.querySelector('.exam-pdf-title');
    if (head) head.textContent = `Kitapçık — sayfa ${pageNum}`;
    const ext = container.querySelector('.exam-pdf-external');
    if (ext) ext.href = `${pdfUrl}#page=${pageNum}`;
    const fbLink = fallback?.querySelector('a');
    if (fbLink) fbLink.href = `${pdfUrl}#page=${pageNum}`;
  }

  container.querySelector('[data-pdf-page="prev"]')?.addEventListener('click', () => {
    pageNum = Math.max(1, pageNum - 1);
    draw();
  });
  container.querySelector('[data-pdf-page="next"]')?.addEventListener('click', () => {
    pageNum += 1;
    draw();
  });

  draw();

  return () => {
    if (renderId === activeRender) activeRender += 1;
  };
}
