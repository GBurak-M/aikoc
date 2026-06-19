/** Misafir oturumu — sekme içi veri; çıkışta silinir; üye girişinde birleştirilir. */

import { getItem, setItem } from './storage.js';
import { getCurrentUser } from './sidebar-auth.js';

const SESS_PREFIX = 'aikoc_guest_';
const DEMO_KEY = 'aikoc_demo_used';

export const GUEST_DATA_KEYS = [
  'exam_stats',
  'exam_wrong_bank',
  'exam_active',
  'my_lessons_planner',
  'solver_stats',
];

function sessionRawKey(key) {
  return `${SESS_PREFIX}${key}`;
}

export function isMemberLoggedIn() {
  return Boolean(getCurrentUser()?.id);
}

export function sessionGet(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(sessionRawKey(key));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function sessionSet(key, value) {
  try {
    sessionStorage.setItem(sessionRawKey(key), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function sessionRemove(key) {
  try {
    sessionStorage.removeItem(sessionRawKey(key));
  } catch {
    /* ignore */
  }
}

/** Üye: localStorage (+ kullanıcıya özel). Misafir: yalnızca sessionStorage. */
export function scopedGet(key, fallback = null) {
  const user = getCurrentUser();
  if (user?.id) {
    const scoped = getItem(`user_${user.id}_${key}`, null);
    if (scoped != null) return scoped;
    return getItem(key, fallback);
  }
  return sessionGet(key, fallback);
}

export function scopedSet(key, value) {
  const user = getCurrentUser();
  if (user?.id) {
    setItem(`user_${user.id}_${key}`, value);
    setItem(key, value);
    return true;
  }
  return sessionSet(key, value);
}

function getDemoUsed() {
  try {
    const raw = sessionStorage.getItem(DEMO_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setDemoUsed(map) {
  try {
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function isDemoConsumed(feature) {
  if (isMemberLoggedIn()) return false;
  return Boolean(getDemoUsed()[feature]);
}

export function markDemoConsumed(feature) {
  if (isMemberLoggedIn()) return;
  const map = getDemoUsed();
  map[feature] = true;
  setDemoUsed(map);
}

export function openRegisterPrompt(message) {
  const modal = document.getElementById('modal-register');
  const msg = document.getElementById('register-msg');
  if (msg) {
    msg.textContent =
      message ||
      'Demo hakkını kullandın. Devam etmek için ücretsiz üye ol veya giriş yap.';
    msg.classList.remove('auth-msg-error');
    msg.classList.add('auth-msg-ok');
  }
  if (modal) modal.hidden = false;

  const dropdown = document.getElementById('topbar-member-dropdown');
  const trigger = document.getElementById('topbar-member-trigger');
  if (dropdown) dropdown.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

/** @returns {boolean} işleme izin var mı */
export function assertMemberOrDemo(feature) {
  if (isMemberLoggedIn()) return true;
  if (!isDemoConsumed(feature)) return true;
  openRegisterPrompt();
  return false;
}

function mergeObjectKey(key, userId) {
  const guestVal = sessionGet(key, null);
  if (guestVal == null) return;

  const existing = getItem(`user_${userId}_${key}`, null) ?? getItem(key, null);
  if (existing == null) {
    setItem(`user_${userId}_${key}`, guestVal);
    setItem(key, guestVal);
    return;
  }

  if (key === 'exam_stats' && typeof guestVal === 'object') {
    const merged = {
      ...existing,
      correct: (existing.correct || 0) + (guestVal.correct || 0),
      wrong: (existing.wrong || 0) + (guestVal.wrong || 0),
      blank: (existing.blank || 0) + (guestVal.blank || 0),
      sessions: (existing.sessions || 0) + (guestVal.sessions || 0),
      byExam: { ...(existing.byExam || {}), ...(guestVal.byExam || {}) },
    };
    setItem(`user_${userId}_${key}`, merged);
    setItem(key, merged);
    return;
  }

  if (key === 'exam_wrong_bank' && Array.isArray(guestVal)) {
    const ids = new Set((existing || []).map((x) => x.id));
    const merged = [...(existing || [])];
    for (const item of guestVal) {
      if (!ids.has(item.id)) merged.push(item);
    }
    const capped = merged.slice(-100);
    setItem(`user_${userId}_${key}`, capped);
    setItem(key, capped);
    return;
  }

  if (key === 'solver_stats' && typeof guestVal === 'object') {
    const merged = {
      solved: (existing.solved || 0) + (guestVal.solved || 0),
    };
    setItem(`user_${userId}_${key}`, merged);
    setItem(key, merged);
    return;
  }

  if (key === 'my_lessons_planner' && typeof guestVal === 'object') {
    const hasGuestData =
      (guestVal.courses?.length || 0) > 0 || (guestVal.exams?.length || 0) > 0;
    if (hasGuestData && !(existing.courses?.length || existing.exams?.length)) {
      setItem(`user_${userId}_${key}`, guestVal);
      setItem(key, guestVal);
    }
    return;
  }

  setItem(`user_${userId}_${key}`, guestVal);
  setItem(key, guestVal);
}

export function mergeGuestSessionToMember(user) {
  if (!user?.id) return;

  for (const key of GUEST_DATA_KEYS) {
    mergeObjectKey(key, user.id);
  }

  const guestChats = (() => {
    try {
      const raw = sessionStorage.getItem('aikoc_chat_sessions_guest');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  if (guestChats.length) {
    const memberKey = `chat_sessions_${user.id}`;
    const existing = getItem(memberKey, []);
    const merged = [...guestChats, ...existing].slice(0, 30);
    setItem(memberKey, merged);
  }

  purgeGuestSession({ keepDemoFlags: true });
  window.dispatchEvent(new CustomEvent('aikoc:session-merged', { detail: { user } }));
}

export function purgeGuestSession({ keepDemoFlags = false } = {}) {
  for (const key of GUEST_DATA_KEYS) {
    sessionRemove(key);
  }
  try {
    sessionStorage.removeItem('aikoc_chat_sessions_guest');
  } catch {
    /* ignore */
  }
  if (!keepDemoFlags) {
    try {
      sessionStorage.removeItem(DEMO_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function initGuestSessionLifecycle() {
  window.addEventListener('pagehide', () => {
    if (!isMemberLoggedIn()) purgeGuestSession();
  });
}

export function focusMemberLoginAfterRegister(email) {
  const registerModal = document.getElementById('modal-register');
  if (registerModal) registerModal.hidden = true;

  const dropdown = document.getElementById('topbar-member-dropdown');
  const trigger = document.getElementById('topbar-member-trigger');
  if (dropdown) dropdown.hidden = false;
  if (trigger) trigger.setAttribute('aria-expanded', 'true');

  const emailInput = document.getElementById('sidebar-login-email');
  const passInput = document.getElementById('sidebar-login-password');
  if (email && emailInput) emailInput.value = email;
  if (passInput) passInput.focus();

  const loginMsg = document.getElementById('sidebar-login-msg');
  if (loginMsg) {
    loginMsg.textContent = 'Kayıt tamamlandı. E-postanı doğruladıktan sonra giriş yapabilirsin.';
    loginMsg.classList.remove('auth-msg-error');
    loginMsg.classList.add('auth-msg-ok');
  }
}
