/** Site yapılandırması — Google OAuth istemci kimliği */

/**
 * Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web)
 * Authorized JavaScript origins:
 *   https://rotaai.vercel.app
 *   http://localhost:3000
 *   http://127.0.0.1:3000
 *
 * Vercel: GOOGLE_CLIENT_ID ortam değişkeni veya index.html meta etiketi.
 */
export const GOOGLE_CLIENT_ID_FALLBACK = '';

let cachedClientId = null;
let configPromise = null;

export function getGoogleClientId() {
  if (cachedClientId) return cachedClientId;

  if (typeof window !== 'undefined' && window.__AIKOC_GOOGLE_CLIENT_ID__) {
    const fromWindow = String(window.__AIKOC_GOOGLE_CLIENT_ID__).trim();
    if (fromWindow) {
      cachedClientId = fromWindow;
      return fromWindow;
    }
  }

  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="google-client-id"]');
    const fromMeta = meta?.getAttribute('content')?.trim();
    if (fromMeta) {
      cachedClientId = fromMeta;
      return fromMeta;
    }
  }

  return GOOGLE_CLIENT_ID_FALLBACK.trim();
}

export function isGoogleAuthConfigured() {
  return getGoogleClientId().length > 10;
}

function applyClientId(id) {
  const trimmed = (id || '').trim();
  if (!trimmed) return;
  cachedClientId = trimmed;
  if (typeof window !== 'undefined') {
    window.__AIKOC_GOOGLE_CLIENT_ID__ = trimmed;
  }
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="google-client-id"]');
    if (meta) meta.setAttribute('content', trimmed);
  }
}

/**
 * Meta boşsa Vercel API'den GOOGLE_CLIENT_ID yükler (tek seferlik).
 * @returns {Promise<{ googleClientId: string }>}
 */
export async function loadSiteConfig() {
  const existing = getGoogleClientId();
  if (existing.length > 10) {
    return { googleClientId: existing, googleAuthMode: 'button' };
  }

  if (!configPromise) {
    configPromise = fetch('/api/config/public', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        applyClientId(data?.googleClientId || '');
        return {
          googleClientId: getGoogleClientId(),
          googleAuthMode: data?.googleAuthMode || 'none',
        };
      })
      .catch(() => ({ googleClientId: '', googleAuthMode: 'none' }));
  }

  return configPromise;
}
