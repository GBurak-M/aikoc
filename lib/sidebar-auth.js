import { getItem, setItem, removeItem } from './storage.js';
import { loginMember, registerMember, forgotPassword } from './member-api.js';
import { updateMemberTriggerLabel } from './topbar-auth-ui.js';
import {
  mergeGuestSessionToMember,
  focusMemberLoginAfterRegister,
} from './guest-session.js';

let unsub = null;

function qs(id) {
  return document.getElementById(id);
}

function showModal(id, show) {
  const el = qs(id);
  if (el) el.hidden = !show;
}

function setMsg(id, text, isError = true) {
  const el = qs(id);
  if (el) {
    el.textContent = text || '';
    el.classList.toggle('auth-msg-error', Boolean(text && isError));
    el.classList.toggle('auth-msg-ok', Boolean(text && !isError));
  }
}

function renderLoggedIn(user) {
  const panel = qs('sidebar-auth-panel');
  const logged = qs('sidebar-auth-logged');
  const guest = qs('sidebar-auth-guest');
  if (user) {
    if (panel) panel.classList.add('is-logged-in');
    if (logged) logged.hidden = false;
    if (guest) guest.hidden = true;
    const nameEl = qs('sidebar-user-name');
    const emailEl = qs('sidebar-user-email');
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    const avatar = qs('sidebar-user-avatar');
    if (avatar) avatar.hidden = true;
    updateMemberTriggerLabel(user);
  } else {
    if (panel) panel.classList.remove('is-logged-in');
    if (logged) logged.hidden = true;
    if (guest) guest.hidden = false;
    updateMemberTriggerLabel(null);
  }
}

export function getCurrentUser() {
  const user = getItem('user');
  if (!user || user.authProvider !== 'local') return null;
  return user;
}

export function persistSession(user) {
  const member = { ...user, authProvider: 'local' };
  mergeGuestSessionToMember(member);
  setItem('user', member);
  renderLoggedIn(member);
  window.dispatchEvent(new CustomEvent('aikoc:session', { detail: { user: member } }));
}

export function clearSession() {
  removeItem('user');
  renderLoggedIn(null);
  window.dispatchEvent(new CustomEvent('aikoc:session', { detail: { user: null } }));
}

function onSessionChange() {
  renderLoggedIn(getCurrentUser());
}

/** Tarayıcıda kalmış eski `user` kaydını (Google) üyelikten ayır. */
function sanitizeMemberStorage() {
  const user = getItem('user');
  if (!user || user.authProvider === 'local') return;

  const isGoogle =
    user.authProvider === 'google' ||
    Boolean(user.picture) ||
    /\.googleusercontent\.com/i.test(user.picture || '');

  if (isGoogle && !getItem('google_user')) {
    setItem('google_user', { ...user, authProvider: 'google' });
  }
  removeItem('user');
}

export function initSidebarAuth() {
  sanitizeMemberStorage();
  renderLoggedIn(getCurrentUser());
  window.addEventListener('aikoc:session', onSessionChange);

  qs('sidebar-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('sidebar-login-msg', '');
    const email = qs('sidebar-login-email')?.value?.trim().toLowerCase();
    const password = qs('sidebar-login-password')?.value || '';
    try {
      const res = await loginMember({ email, password });
      persistSession(res.user);
      setMsg('sidebar-login-msg', 'Giriş başarılı.', false);
    } catch (err) {
      setMsg('sidebar-login-msg', err.message);
    }
  });

  qs('sidebar-forgot-btn')?.addEventListener('click', () => {
    setMsg('forgot-msg', '');
    showModal('modal-forgot', true);
  });

  qs('sidebar-register-btn')?.addEventListener('click', () => {
    setMsg('register-msg', '');
    showModal('modal-register', true);
  });

  qs('sidebar-logout-btn')?.addEventListener('click', () => {
    clearSession();
    setMsg('sidebar-login-msg', 'Üyelikten çıkıldı.', false);
  });
  qs('sidebar-panel-link')?.addEventListener('click', () => {
    location.hash = '#/profil';
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => showModal(btn.dataset.closeModal, false));
  });

  qs('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('register-msg', '');
    const name = qs('register-name')?.value?.trim();
    const email = qs('register-email')?.value?.trim().toLowerCase();
    const password = qs('register-password')?.value || '';
    const passwordConfirm = qs('register-password2')?.value || '';

    if (password !== passwordConfirm) {
      setMsg('register-msg', 'Şifre ve şifre tekrarı aynı olmalıdır.');
      return;
    }

    try {
      const res = await registerMember({ name, email, password, passwordConfirm });
      setMsg('register-msg', res.message || 'Kayıt tamamlandı.', false);
      focusMemberLoginAfterRegister(email);
    } catch (err) {
      setMsg('register-msg', err.message);
    }
  });

  qs('forgot-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('forgot-msg', '');
    const email = qs('forgot-email')?.value?.trim().toLowerCase();
    try {
      const res = await forgotPassword(email);
      setMsg('forgot-msg', res.message, false);
    } catch (err) {
      setMsg('forgot-msg', err.message);
    }
  });
}

export function destroySidebarAuth() {
  window.removeEventListener('aikoc:session', onSessionChange);
  unsub?.();
  unsub = null;
}
