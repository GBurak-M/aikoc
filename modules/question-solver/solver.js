import { getAIEngine } from '../../lib/ai-engine.js';
import { isGroqAvailable } from '../../lib/groq-api.js';
import { BRAND_LOGO, BRAND_ALT, BRAND_NAME } from '../../lib/brand.js';
import { bumpSolverStats, renderSolverStats } from '../../lib/page-stats.js';

const MAX_BYTES = 25 * 1024 * 1024;
let imageDataUrl = null;

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (file.size > MAX_BYTES) {
      reject(new Error('Dosya 25 MB sınırını aşıyor.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
}

async function updateSolverBanner() {
  const banner = document.getElementById('solver-google-banner');
  const text = document.getElementById('solver-google-banner-text');
  const signin = document.getElementById('solver-google-signin');
  if (!banner || !text) return;
  const groqOk = await isGroqAvailable();
  banner.hidden = groqOk;
  if (groqOk) return;
  text.textContent =
    'Tam yapay zeka yanıtı için sunucuda GROQ_API_KEY tanımlanmalı. Şimdilik temel çevrimdışı öğretmen yanıtları kullanılır.';
  if (signin) signin.innerHTML = '';
}

export async function init() {
  const engine = getAIEngine();
  if (!engine.ready) await engine.init();
  await renderSolverStats();
  await updateSolverBanner();

  document.getElementById('solver-image')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    const preview = document.getElementById('solver-preview');
    try {
      imageDataUrl = await readImage(file);
      if (preview && imageDataUrl) {
        preview.innerHTML = `<img src="${imageDataUrl}" alt="Yüklenen soru görseli" />`;
      } else if (preview) preview.innerHTML = '';
    } catch (err) {
      imageDataUrl = null;
      if (preview) preview.innerHTML = `<p class="meta">${err.message}</p>`;
    }
  });

  document.getElementById('solver-run')?.addEventListener('click', async () => {
    const text = document.getElementById('solver-text')?.value?.trim() || '';
    const subject = document.getElementById('solver-subject')?.value || '';
    const result = document.getElementById('solver-result');

    const resultHead = `
      <div class="solver-result-head">
        <img src="${BRAND_LOGO}" alt="${BRAND_ALT}" class="ai-avatar ai-avatar-sm" width="32" height="32" />
        <h3>${BRAND_NAME} Çözümü</h3>
      </div>
    `;

    if (!text && !imageDataUrl) {
      if (result) result.innerHTML = `${resultHead}<p class="meta">Lütfen soru metni veya görsel ekle.</p>`;
      return;
    }

    if (result) {
      result.innerHTML = `${resultHead}<p class="meta" id="solver-progress">Çözülüyor…</p>`;
    }

    const engine = getAIEngine();
    if (!engine.ready) await engine.init();
    const progressEl = document.getElementById('solver-progress');
    const offProgress = engine.onProgress((text) => {
      if (progressEl && text) progressEl.textContent = text;
      renderSolverStats();
    });

    let prompt = `Aşağıdaki soruyu adım adım çöz. Türkçe, net ve öğretici anlat.\n`;
    if (subject) prompt += `Ders: ${subject}\n`;
    if (text) prompt += `Soru: ${text}\n`;
    if (imageDataUrl) {
      prompt += `Not: Kullanıcı bir soru görseli yükledi. Görseldeki metni okuyup çözmeye çalış. Görsel metni net değilse hangi bilgiye ihtiyaç duyduğunu söyle.\n`;
    }

    const solution = await engine.generate(prompt);
    offProgress();
    bumpSolverStats();
    await renderSolverStats();

    if (result) {
      result.innerHTML = `
        ${resultHead}
        <div class="solution">${solution.replace(/</g, '&lt;')}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="solver-copy" style="margin-top:1rem">Kopyala</button>
      `;
      document.getElementById('solver-copy')?.addEventListener('click', () => {
        navigator.clipboard?.writeText(solution);
      });
    }
  });
}
