/** Google AI girişi — site üyeliğinden ayrı oturum (google_user). */

import { getItem, setItem, removeItem } from './storage.js';
import { getGoogleClientId, loadSiteConfig } from './site-config.js';
import { BUILTIN_AI_SHORT_HINT } from './ai-browser-support.js';

const AUTH_EVENT = 'aikoc:google-auth';
const GOOGLE_USER_KEY = 'google_user';

let gsiReady = null;
let authMode = null;

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function loadGsiScript() {
  if (gsiReady) return gsiReady;
  gsiReady = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google giriş betiği yüklenemedi'));
    document.head.appendChild(script);
  });
  return gsiReady;
}

async function resolveAuthMode() {
  if (authMode) return authMode;
  await loadSiteConfig();
  const res = await fetch('/api/config/public', { credentials: 'same-origin' }).catch(() => null);
  if (res?.ok) {
    const data = await res.json();
    authMode = data.googleAuthMode || (data.googleClientId ? 'button' : 'none');
    return authMode;
  }
  authMode = getGoogleClientId() ? 'button' : 'none';
  return authMode;
}

function persistGoogleUser(user) {
  const prev = getItem(GOOGLE_USER_KEY);
  const merged = {
    ...user,
    grade: prev?.grade || user.grade || '12',
    signedInAt: Date.now(),
    authProvider: 'google',
  };
  setItem(GOOGLE_USER_KEY, merged);
  setItem('google_credential', { updated: Date.now() });
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: merged } }));
  return merged;
}

function persistGoogleCredential(credential) {
  const payload = parseJwt(credential);
  if (!payload?.sub) return null;
  return persistGoogleUser({
    id: payload.sub,
    name: payload.name || payload.given_name || 'Öğrenci',
    email: (payload.email || '').toLowerCase(),
    picture: payload.picture || '',
  });
}

function googleSignInUrl() {
  const returnTo = `${location.pathname}${location.search}${location.hash}` || '/';
  return `/api/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
}

function mountRedirectButton(container) {
  container.innerHTML = '';
  const link = document.createElement('a');
  link.href = googleSignInUrl();
  link.className = 'btn-google-signin';
  link.setAttribute('aria-label', 'Google ile AI girişi');
  link.innerHTML = `
    <span class="btn-google-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    </span>
    <span>Google ile AI girişi</span>`;
  container.appendChild(link);
}

async function mountGsiButton(container, opts = {}) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    mountRedirectButton(container);
    return;
  }

  try {
    await loadGsiScript();
  } catch {
    opts.onError?.('Google giriş servisi yüklenemedi. İnternet bağlantını kontrol et.');
    return;
  }

  container.innerHTML = '';

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (!response?.credential) {
        opts.onError?.('Google girişi tamamlanamadı.');
        return;
      }
      persistGoogleCredential(response.credential);
    },
    auto_select: false,
    cancel_on_tap_outside: false,
    context: 'signin',
    itp_support: true,
    locale: 'tr',
  });

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: Math.min(400, container.offsetWidth || 320),
    locale: 'tr',
  });
}

export function isGoogleSignedIn() {
  const user = getItem(GOOGLE_USER_KEY);
  return Boolean(user?.authProvider === 'google' && user?.email);
}

export function getGoogleUser() {
  const user = getItem(GOOGLE_USER_KEY);
  if (user?.authProvider === 'google') return user;
  return null;
}

export async function signOutGoogle() {
  const user = getItem(GOOGLE_USER_KEY);
  if (!user || user.authProvider !== 'google') return;
  removeItem(GOOGLE_USER_KEY);
  removeItem('google_credential');
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: null } }));
}

export function onGoogleAuthChange(callback) {
  const handler = (e) => callback(e.detail?.user ?? getGoogleUser());
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
}

/**
 * Sunucu oturumunu tarayıcı depolamasıyla eşitler.
 * @returns {Promise<object|null>}
 */
export async function syncGoogleSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.user?.email && data.user.authProvider === 'google') {
      return persistGoogleUser(data.user);
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @param {HTMLElement} container
 * @param {{ onError?: (msg: string) => void }} [opts]
 */
export async function renderGoogleSignInButton(container, opts = {}) {
  if (!container) return;

  const mode = await resolveAuthMode();
  if (mode === 'redirect') {
    mountRedirectButton(container);
    return;
  }
  if (mode === 'button') {
    await mountGsiButton(container, opts);
    return;
  }
  mountRedirectButton(container);
}

export async function getGoogleAuthHint() {
  if (!isGoogleSignedIn()) {
    return `AI özellikleri için Google hesabınla giriş yap. ${BUILTIN_AI_SHORT_HINT}`;
  }
  return '';
}
