/** AİKOÇ — Hash router ve modül yükleyici */

import { getLang, setLang, t, i18n } from './lib/i18n.js';
import { getAIEngine, resetAIEngine } from './lib/ai-engine.js';
import { onGoogleAuthChange, syncGoogleSession } from './lib/google-auth.js';
import { loadSiteConfig } from './lib/site-config.js';
import { initScene3D } from './lib/scene3d.js';
import { initSidebarAuth } from './lib/sidebar-auth.js';
import { initSidebarGoogleAuth } from './lib/sidebar-google-auth.js';
import { initTopbarAuthUI } from './lib/topbar-auth-ui.js';
import { getItem, setItem, removeItem } from './lib/storage.js';
import { migrateChatStorage } from './lib/chat-storage.js';
import { BRAND_NAME } from './lib/brand.js';

const APP_BUILD = '20260618l';

const routes = {
  '/': { html: 'modules/dashboard/dashboard.html', js: 'modules/dashboard/dashboard.js', title: 'nav.dashboard' },
  '/dersler': { html: 'modules/lessons/lessons.html', js: 'modules/lessons/lessons.js', css: 'modules/lessons/lessons.css', title: 'nav.lessons' },
  '/kutuphane': { html: 'modules/library/library.html', js: 'modules/library/library.js', css: 'modules/library/library.css', title: 'nav.library' },
  '/sinavlar': { html: 'modules/exams/exams.html', js: 'modules/exams/exams.js', css: 'modules/exams/exams.css', title: 'nav.exams' },
  '/ai-sohbet': { html: 'modules/ai-chat/chat.html', js: 'modules/ai-chat/chat.js', css: 'modules/ai-chat/chat.css', title: 'nav.chat' },
  '/soru-coz': { html: 'modules/question-solver/solver.html', js: 'modules/question-solver/solver.js', css: 'modules/question-solver/solver.css', title: 'nav.solver' },
  '/profil': { html: 'modules/auth/auth.html', js: 'modules/auth/auth.js', title: 'nav.profile' },
  '/dogrula': { html: 'modules/verify/verify.html', js: 'modules/verify/verify.js', title: 'E-posta doğrulama' },
  '/sifre-sifirla': { html: 'modules/reset-password/reset.html', js: 'modules/reset-password/reset.js', title: 'Şifre yenile' },
};

let currentModule = null;
let currentCssLink = null;

function getPath() {
  const hash = location.hash.slice(1) || '/';
  return hash.split('?')[0];
}

function setActiveNav(path) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-route') === path);
  });
}

function updateTitle(route) {
  const titleKey = route?.title;
  const label = titleKey
    ? (titleKey.startsWith('nav.') ? t(titleKey) : titleKey)
    : BRAND_NAME;
  document.getElementById('page-title').textContent = label;
  document.title = `${label} — ${BRAND_NAME}`;
}

function showLoading(main) {
  main.innerHTML = `
    <div class="loading-state" id="loading-state">
      <img src="assets/brand/rota-ai-logo.png" alt="" class="loading-logo" width="120" height="120" />
      <p>Yükleniyor…</p>
    </div>`;
}

async function loadModule(path) {
  const route = routes[path] || routes['/'];
  const main = document.getElementById('main-content');

  if (currentModule?.destroy) {
    try { currentModule.destroy(); } catch { /* ignore */ }
    currentModule = null;
  }

  if (currentCssLink) {
    currentCssLink.remove();
    currentCssLink = null;
  }

  showLoading(main);

  try {
    const res = await fetch(route.html);
    if (!res.ok) throw new Error('Modül yüklenemedi');
    const html = await res.text();
    main.innerHTML = html;

    if (route.css) {
      currentCssLink = document.createElement('link');
      currentCssLink.rel = 'stylesheet';
      currentCssLink.href = `${route.css}?v=${APP_BUILD}`;
      document.head.appendChild(currentCssLink);
    }

    if (route.js) {
      const mod = await import(`./${route.js}?v=${APP_BUILD}`);
      if (mod.init) {
        currentModule = mod;
        await mod.init(main);
      }
    }

    refreshIcons();
    updateTitle(route);
    setActiveNav(path);
  } catch (err) {
    main.innerHTML = `<div class="empty-state"><p>Sayfa yüklenirken bir sorun oluştu.</p><button class="btn btn-primary" onclick="location.reload()">Yenile</button></div>`;
    /* yükleme hatası — kullanıcıya mesaj gösterildi */
  }
}

function navigate() {
  const path = getPath();
  if (!routes[path] && path !== '/') {
    location.hash = '#/';
    return;
  }
  loadModule(path);
}

function refreshIcons() {
  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else if (theme === 'dark') root.removeAttribute('data-theme');
  else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', 'light');
  }
  localStorage.setItem('aikoc-theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('aikoc-theme') || 'auto';
  applyTheme(saved);
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const cur = localStorage.getItem('aikoc-theme') || 'auto';
    const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'auto' : 'light';
    applyTheme(next);
  });
}

function initLang() {
  document.documentElement.lang = getLang();
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    const next = getLang() === 'tr' ? 'en' : 'tr';
    setLang(next);
    document.getElementById('lang-toggle').textContent = next.toUpperCase();
    navigate();
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = getLang().toUpperCase();
}

function initMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
  document.querySelectorAll('.nav-link, .tab-link').forEach((a) => {
    a.addEventListener('click', () => sidebar?.classList.remove('open'));
  });
}

function initAIStatus() {
  const label = document.getElementById('ai-status-label');
  const box = document.getElementById('global-ai-status');

  const refreshEngine = async () => {
    const engine = resetAIEngine();
    const update = () => {
      if (label) label.textContent = engine.getStatusLabel();
      if (box) {
        const googleReady = engine.mode === 'window-ai';
        box.classList.toggle('ready', engine.ready && googleReady);
        box.classList.toggle('loading', !!engine.progressText);
      }
    };
    engine.onProgress(update);
    await engine.init();
    update();
  };

  refreshEngine();
  onGoogleAuthChange(() => refreshEngine());
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.update()));

    await navigator.serviceWorker.register(`/service-worker.js?v=${APP_BUILD}`, {
      updateViaCache: 'none',
    });
  } catch {
    /* SW opsiyonel */
  }
}

window.addEventListener('hashchange', navigate);
function handleAuthQuery() {
  const params = new URLSearchParams(location.search);
  if (params.get('auth_error') === 'google') {
    history.replaceState(null, '', location.pathname + location.hash);
  }
}

/** Eski sürüm Google oturumunu `user` anahtarına yazıyordu — üyelikten ayır. */
function migrateLegacyAuth() {
  const user = getItem('user');
  if (!user) return;

  if (user.authProvider === 'local') return;

  const looksGoogle =
    user.authProvider === 'google' ||
    Boolean(user.picture) ||
    /\.googleusercontent\.com/i.test(user.picture || '');

  if (looksGoogle) {
    if (!getItem('google_user')) {
      setItem('google_user', { ...user, authProvider: 'google' });
    }
  }

  removeItem('user');
}

window.addEventListener('DOMContentLoaded', async () => {
  handleAuthQuery();
  if (!location.hash) location.hash = '#/';
  navigate();

  try {
    await loadSiteConfig();
    migrateLegacyAuth();
    migrateChatStorage();
    await syncGoogleSession();
    initTheme();
    initLang();
    initMobileMenu();
    initAIStatus();
    initTopbarAuthUI();
    initSidebarAuth();
    initSidebarGoogleAuth();
    initScene3D();
    registerSW();
    refreshIcons();
  } catch (err) {
    console.error('[ROTA AI] Başlatma hatası:', err);
    refreshIcons();
  }
});

export { getAIEngine, t };
