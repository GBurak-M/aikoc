import { signToken, verifyToken } from './auth-utils.js';
import { readSessionFromRequest } from './google-oauth.js';

const ADMIN_PURPOSE = 'library_admin';

export function getLibraryAdminPin() {
  return (process.env.LIBRARY_ADMIN_PIN || 'aikoc2026').trim();
}

export function getLibraryAdminEmails() {
  const raw = process.env.LIBRARY_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function createLibraryAdminToken(email = '') {
  return signToken({ purpose: ADMIN_PURPOSE, email }, 8);
}

export function verifyLibraryAdminToken(token) {
  const payload = verifyToken(token);
  if (!payload || payload.purpose !== ADMIN_PURPOSE) return null;
  return payload;
}

export function verifyLibraryAdminPin(pin) {
  return pin === getLibraryAdminPin();
}

export function readAdminFromRequest(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (bearer && verifyLibraryAdminToken(bearer)) {
    return { via: 'token', email: verifyLibraryAdminToken(bearer).email || '' };
  }

  const pin = req.headers['x-library-admin-pin'];
  if (pin && verifyLibraryAdminPin(String(pin).trim())) {
    return { via: 'pin', email: '' };
  }

  const session = readSessionFromRequest(req);
  const admins = getLibraryAdminEmails();
  if (session?.email && admins.includes(session.email.toLowerCase())) {
    return { via: 'session', email: session.email };
  }

  return null;
}
