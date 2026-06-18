import { hashPassword, signToken, verifyToken, json, handleOptions, getAuthSecret, getSiteUrl } from '../server/lib/auth-utils.js';
import { getUser, saveUser } from '../server/lib/user-store.js';
import { sendEmail, verificationEmailHtml, buildVerifyLink, resetEmailHtml, buildResetLink } from '../server/lib/email.js';
import {
  appendSessionCookie,
  buildGoogleUser,
  clearSessionCookie,
  createOAuthState,
  createSessionToken,
  exchangeCodeForTokens,
  getGoogleClientId,
  getRedirectUri,
  isGoogleOAuthReady,
  readSessionFromRequest,
  verifyGoogleIdToken,
  verifyOAuthState,
} from '../server/lib/google-oauth.js';

function resolveAuthRoute(req) {
  const route = req.query?.route;
  if (Array.isArray(route) && route.length) return route.join('/');
  if (typeof route === 'string' && route) return route;

  const slug = req.query?.slug;
  if (Array.isArray(slug) && slug.length) return slug.join('/');
  if (typeof slug === 'string' && slug) return slug;

  const path = (req.url || '').split('?')[0];
  const match = path.match(/\/api\/auth\/?(.*)$/);
  return match?.[1] || '';
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = (body?.email || '').trim().toLowerCase();
  const password = body?.password || '';

  if (!email || !password) {
    return json(res, 400, { error: 'E-posta ve şifre gerekli.' });
  }

  const user = await getUser(email);
  if (!user || !user.verified) {
    return json(res, 401, { error: 'E-posta veya şifre hatalı.' });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return json(res, 401, { error: 'E-posta veya şifre hatalı.' });
  }

  return json(res, 200, {
    ok: true,
    user: {
      id: user.email,
      name: user.name,
      email: user.email,
      grade: user.grade || '12',
      authProvider: 'local',
      verified: true,
    },
  });
}

async function handleRegister(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });
  if (!getAuthSecret()) {
    return json(res, 503, { error: 'Sunucu kimlik doğrulama anahtarı yapılandırılmamış (AUTH_SECRET).' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const name = (body?.name || '').trim();
  const email = (body?.email || '').trim().toLowerCase();
  const password = body?.password || '';
  const passwordConfirm = body?.passwordConfirm || '';

  if (!name || !email || !password) {
    return json(res, 400, { error: 'Ad, e-posta ve şifre zorunludur.' });
  }
  if (password !== passwordConfirm) {
    return json(res, 400, { error: 'Şifre ve şifre tekrarı aynı olmalıdır.' });
  }
  if (password.length < 6) {
    return json(res, 400, { error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const existing = await getUser(email);
  if (existing?.verified) {
    return json(res, 409, { error: 'Bu e-posta zaten kayıtlı.' });
  }

  await saveUser(email, {
    name,
    passwordHash: hashPassword(password),
    verified: false,
    grade: '12',
    createdAt: Date.now(),
  });

  const token = signToken({ purpose: 'verify', email, name });
  const link = buildVerifyLink(token);
  const mail = await sendEmail({
    to: email,
    subject: 'ROTA AI — E-posta doğrulama',
    html: verificationEmailHtml(name, link),
  });

  if (!mail.ok) {
    return json(res, 503, {
      error: 'Onay e-postası gönderilemedi. Yönetici RESEND_API_KEY ayarlamalı.',
      detail: mail.error,
    });
  }

  return json(res, 200, {
    ok: true,
    message: 'Onay bağlantısı e-posta adresine gönderildi.',
  });
}

async function handleVerify(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const token = body?.token || '';
  const payload = verifyToken(token);

  if (!payload || payload.purpose !== 'verify' || !payload.email) {
    return json(res, 400, { error: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı.' });
  }

  const user = await getUser(payload.email);
  if (!user) {
    return json(res, 404, { error: 'Kayıt bulunamadı. Lütfen yeniden üye ol.' });
  }

  const updated = await saveUser(payload.email, { ...user, verified: true, name: user.name || payload.name });

  return json(res, 200, {
    ok: true,
    user: {
      id: updated.email,
      name: updated.name,
      email: updated.email,
      grade: updated.grade || '12',
      authProvider: 'local',
      verified: true,
    },
  });
}

async function handleForgotPassword(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });
  if (!getAuthSecret()) return json(res, 503, { error: 'Sunucu yapılandırması eksik.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = (body?.email || '').trim().toLowerCase();
  if (!email) return json(res, 400, { error: 'E-posta gerekli.' });

  const user = await getUser(email);
  const generic = { ok: true, message: 'Kayıtlıysa sıfırlama bağlantısı e-postana gönderildi.' };
  if (!user?.verified) return json(res, 200, generic);

  const token = signToken({ purpose: 'reset', email }, 2);
  const link = buildResetLink(token);
  const mail = await sendEmail({
    to: email,
    subject: 'ROTA AI — Şifre sıfırlama',
    html: resetEmailHtml(user.name, link),
  });

  if (!mail.ok) return json(res, 503, { error: 'E-posta gönderilemedi.', detail: mail.error });
  return json(res, 200, generic);
}

async function handleResetPassword(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const token = body?.token || '';
  const password = body?.password || '';
  const passwordConfirm = body?.passwordConfirm || '';

  if (!password || password !== passwordConfirm) {
    return json(res, 400, { error: 'Şifreler aynı olmalıdır.' });
  }
  if (password.length < 6) {
    return json(res, 400, { error: 'Şifre en az 6 karakter olmalıdır.' });
  }

  const payload = verifyToken(token);
  if (!payload || payload.purpose !== 'reset' || !payload.email) {
    return json(res, 400, { error: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı.' });
  }

  const user = await getUser(payload.email);
  if (!user?.verified) return json(res, 404, { error: 'Kullanıcı bulunamadı.' });

  await saveUser(payload.email, { ...user, passwordHash: hashPassword(password) });

  return json(res, 200, {
    ok: true,
    message: 'Şifren güncellendi. Giriş yapabilirsin.',
    user: {
      id: user.email,
      name: user.name,
      email: user.email,
      grade: user.grade || '12',
      authProvider: 'local',
      verified: true,
    },
  });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Yalnızca GET' });
  const user = readSessionFromRequest(req);
  return json(res, 200, { user: user || null });
}

async function handleLogout(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return json(res, 405, { error: 'Yalnızca GET veya POST' });
  }
  clearSessionCookie(res);
  return json(res, 200, { ok: true });
}

async function handleGoogleStart(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Yalnızca GET' });
  if (!isGoogleOAuthReady()) return res.redirect(302, `${getSiteUrl()}/?auth_error=google`);

  const returnTo = typeof req.query?.returnTo === 'string' ? req.query.returnTo : '/';
  const state = createOAuthState(returnTo);

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', getGoogleClientId());
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('access_type', 'online');

  return res.redirect(302, url.toString());
}

async function handleGoogleCallback(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Yalnızca GET' });

  const site = getSiteUrl();
  if (req.query?.error) return res.redirect(302, `${site}/?auth_error=google`);

  const code = req.query?.code;
  const statePayload = verifyOAuthState(req.query?.state);
  if (!code || !statePayload) return res.redirect(302, `${site}/?auth_error=google`);

  try {
    const tokens = await exchangeCodeForTokens(code);
    const claims = await verifyGoogleIdToken(tokens.id_token);
    const user = buildGoogleUser(claims);
    appendSessionCookie(res, createSessionToken(user));
    const returnTo = statePayload.returnTo || '/';
    const dest = returnTo.startsWith('http') ? `${site}/` : `${site}${returnTo}`;
    return res.redirect(302, dest);
  } catch {
    return res.redirect(302, `${site}/?auth_error=google`);
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const key = resolveAuthRoute(req);

  switch (key) {
    case 'login':
      return handleLogin(req, res);
    case 'register':
      return handleRegister(req, res);
    case 'verify':
      return handleVerify(req, res);
    case 'forgot-password':
      return handleForgotPassword(req, res);
    case 'reset-password':
      return handleResetPassword(req, res);
    case 'me':
      return handleMe(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'google/start':
      return handleGoogleStart(req, res);
    case 'google/callback':
      return handleGoogleCallback(req, res);
    default:
      return json(res, 404, { error: 'Bilinmeyen kimlik doğrulama yolu.' });
  }
}
