import crypto from 'crypto';
import { getSiteUrl, signToken, verifyToken } from './auth-utils.js';

const STATE_HOURS = 10 / 60;

export function getGoogleClientId() {
  return (process.env.GOOGLE_CLIENT_ID || '').trim();
}

export function getGoogleClientSecret() {
  return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
}

export function isGoogleOAuthReady() {
  return getGoogleClientId().length > 10 && getGoogleClientSecret().length > 10;
}

export function getRedirectUri() {
  return `${getSiteUrl()}/api/auth/google/callback`;
}

export function createOAuthState(returnTo) {
  const safeReturn =
    typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')
      ? returnTo.slice(0, 500)
      : '/';

  return signToken(
    {
      kind: 'google_oauth_state',
      returnTo: safeReturn,
      nonce: crypto.randomBytes(16).toString('hex'),
    },
    STATE_HOURS
  );
}

export function verifyOAuthState(state) {
  const payload = verifyToken(state);
  if (!payload || payload.kind !== 'google_oauth_state' || !payload.nonce) return null;
  return payload;
}

export async function exchangeCodeForTokens(code) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || 'Google token alınamadı');
  }
  return data;
}

export async function verifyGoogleIdToken(idToken) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.sub) {
    throw new Error('Google kimlik doğrulaması başarısız');
  }
  if (data.aud !== getGoogleClientId()) {
    throw new Error('Google istemci kimliği uyuşmuyor');
  }
  return data;
}

export function buildGoogleUser(claims) {
  return {
    id: claims.sub,
    name: claims.name || claims.given_name || 'Öğrenci',
    email: (claims.email || '').toLowerCase(),
    picture: claims.picture || '',
    authProvider: 'google',
    grade: '12',
    verified: true,
  };
}

export function sessionCookieName() {
  return 'rota_session';
}

export function createSessionToken(user) {
  return signToken(
    {
      kind: 'session',
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
    },
    24 * 7
  );
}

export function readSessionFromRequest(req) {
  const cookie = req.headers.cookie || '';
  const name = sessionCookieName();
  const match = cookie.match(new RegExp(`${name}=([^;]+)`));
  if (!match) return null;

  const payload = verifyToken(match[1]);
  if (!payload || payload.kind !== 'session') return null;

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    picture: payload.picture || '',
    authProvider: payload.provider || 'google',
    grade: '12',
    verified: true,
  };
}

export function appendSessionCookie(res, token) {
  const maxAge = 7 * 24 * 60 * 60;
  const parts = [
    `${sessionCookieName()}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${sessionCookieName()}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
}
