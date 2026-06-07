import { SITE_NAME } from '../config/site';
import { adminUpdateMember, getMemberByEmail, getMemberById, type MemberAccount } from './membership';
import { safeParse, safeSetItem } from './storage';

export type PasswordResetRequest = {
  id: string;
  memberId: string;
  email: string;
  memberName: string;
  requestedAt: string;
  status: 'pending' | 'ai_sent' | 'completed' | 'expired';
  token: string;
  resetLink: string;
  aiReplyAt?: string;
  aiMessage?: string;
  completedAt?: string;
};

export type SimulatedOutboundEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  requestId: string;
};

type ResetTokenRecord = {
  memberId: string;
  email: string;
  requestId: string;
  expiresAt: string;
  used: boolean;
};

const REQUESTS_KEY = 'aikoc_password_reset_requests';
const TOKENS_KEY = 'aikoc_password_reset_tokens';
const OUTBOX_KEY = 'aikoc_password_reset_outbox';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function loadRequests(): PasswordResetRequest[] {
  return safeParse<PasswordResetRequest[]>(REQUESTS_KEY, []);
}

function saveRequests(requests: PasswordResetRequest[]) {
  safeSetItem(REQUESTS_KEY, requests.slice(0, 200));
}

function loadTokens(): Record<string, ResetTokenRecord> {
  return safeParse<Record<string, ResetTokenRecord>>(TOKENS_KEY, {});
}

function saveTokens(tokens: Record<string, ResetTokenRecord>) {
  safeSetItem(TOKENS_KEY, tokens);
}

function loadOutbox(): SimulatedOutboundEmail[] {
  return safeParse<SimulatedOutboundEmail[]>(OUTBOX_KEY, []);
}

function saveOutbox(emails: SimulatedOutboundEmail[]) {
  safeSetItem(OUTBOX_KEY, emails.slice(0, 100));
}

function generateToken(): string {
  return `rst_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function buildPasswordResetLink(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${base}#sifre-sifirla?token=${encodeURIComponent(token)}`;
}

function buildAiEmailBody(member: MemberAccount, link: string): string {
  return [
    `Merhaba ${member.firstName},`,
    '',
    `${SITE_NAME} hesabınız için şifre yenileme talebiniz alındı.`,
    'Güvenliğiniz için aşağıdaki bağlantı 24 saat geçerlidir:',
    '',
    link,
    '',
    'Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.',
    '',
    `— ${SITE_NAME} Yapay Zeka Destek`,
  ].join('\n');
}

function autoSendResetEmail(request: PasswordResetRequest, member: MemberAccount): PasswordResetRequest {
  const body = buildAiEmailBody(member, request.resetLink);
  const email: SimulatedOutboundEmail = {
    id: `mail_${Date.now()}`,
    to: member.email,
    subject: `${SITE_NAME} — Şifre yenileme bağlantınız`,
    body,
    sentAt: new Date().toISOString(),
    requestId: request.id,
  };
  const outbox = loadOutbox();
  saveOutbox([email, ...outbox]);

  return {
    ...request,
    status: 'ai_sent',
    aiReplyAt: new Date().toISOString(),
    aiMessage:
      'Yapay zeka otomatik yanıt gönderdi: şifre yenileme bağlantısı kullanıcının e-posta adresine iletildi.',
  };
}

export function requestPasswordReset(
  email: string,
): { ok: true; request: PasswordResetRequest; demoLink: string } | { ok: false; error: string } {
  const member = getMemberByEmail(email);
  if (!member) {
    return { ok: false, error: 'Bu e-posta ile kayıtlı üyelik bulunamadı.' };
  }

  const token = generateToken();
  const resetLink = buildPasswordResetLink(token);
  const requestId = `prr_${Date.now()}`;

  let request: PasswordResetRequest = {
    id: requestId,
    memberId: member.id,
    email: member.email,
    memberName: `${member.firstName} ${member.lastName}`,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    token,
    resetLink,
  };

  request = autoSendResetEmail(request, member);

  const tokens = loadTokens();
  tokens[token] = {
    memberId: member.id,
    email: member.email,
    requestId,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    used: false,
  };
  saveTokens(tokens);

  const requests = loadRequests();
  saveRequests([request, ...requests.filter((r) => r.memberId !== member.id || r.status === 'completed')]);

  return { ok: true, request, demoLink: resetLink };
}

export function listPasswordResetRequests(): PasswordResetRequest[] {
  return loadRequests().sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );
}

export function listSimulatedEmails(): SimulatedOutboundEmail[] {
  return loadOutbox();
}

export function validateResetToken(
  token: string,
): { ok: true; memberId: string; email: string } | { ok: false; error: string } {
  const tokens = loadTokens();
  const record = tokens[token];
  if (!record) return { ok: false, error: 'Geçersiz veya süresi dolmuş bağlantı.' };
  if (record.used) return { ok: false, error: 'Bu bağlantı zaten kullanıldı.' };
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: 'Şifre yenileme bağlantısının süresi doldu. Yeni talep oluşturun.' };
  }
  if (!getMemberById(record.memberId)) {
    return { ok: false, error: 'Üyelik bulunamadı.' };
  }
  return { ok: true, memberId: record.memberId, email: record.email };
}

export function completePasswordReset(
  token: string,
  newPassword: string,
): { ok: true } | { ok: false; error: string } {
  const valid = validateResetToken(token);
  if (!valid.ok) return valid;

  if (newPassword.length < 6) {
    return { ok: false, error: 'Yeni şifre en az 6 karakter olmalı.' };
  }

  const result = adminUpdateMember(valid.memberId, { password: newPassword });
  if (!result.ok) return result;

  const tokens = loadTokens();
  if (tokens[token]) {
    tokens[token].used = true;
    saveTokens(tokens);
  }

  const requests = loadRequests();
  saveRequests(
    requests.map((r) =>
      r.token === token
        ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString() }
        : r,
    ),
  );

  return { ok: true };
}

export function purgePasswordResetDataForMember(memberId: string) {
  const requests = loadRequests().filter((r) => r.memberId !== memberId);
  saveRequests(requests);

  const tokens = loadTokens();
  const nextTokens: Record<string, ResetTokenRecord> = {};
  for (const [k, v] of Object.entries(tokens)) {
    if (v.memberId !== memberId) nextTokens[k] = v;
  }
  saveTokens(nextTokens);
}

export function parseResetTokenFromHash(hash: string): string | null {
  if (!hash.startsWith('#sifre-sifirla')) return null;
  const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  return new URLSearchParams(query).get('token');
}
