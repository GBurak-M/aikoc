import crypto from 'crypto';

const DEFAULT_EXP_HOURS = 24;

export function getSiteUrl() {
  return (process.env.SITE_URL || 'https://rotaai.vercel.app').replace(/\/$/, '');
}

export function getAuthSecret() {
  return process.env.AUTH_SECRET || '';
}

export function hashPassword(password) {
  const salt = 'rota-ai-v1';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function b64urlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signToken(payload, hours = DEFAULT_EXP_HOURS) {
  const secret = getAuthSecret();
  if (!secret) throw new Error('AUTH_SECRET tanımlı değil');

  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(
    JSON.stringify({
      ...payload,
      exp: Date.now() + hours * 60 * 60 * 1000,
    })
  );
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  const secret = getAuthSecret();
  if (!secret || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  if (sig !== expected) return null;

  try {
    const payload = JSON.parse(b64urlDecode(body));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Library-Admin-Pin');
  return res.status(status).json(data);
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Library-Admin-Pin');
    return res.status(204).end();
  }
  return false;
}
