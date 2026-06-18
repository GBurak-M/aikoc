import {
  getGoogleUser,
  isGoogleSignedIn,
  renderGoogleSignInButton,
  signOutGoogle,
  onGoogleAuthChange,
} from './google-auth.js';
import { resetAIEngine } from './ai-engine.js';
import { updateGoogleTriggerLabel } from './topbar-auth-ui.js';

let googleButtonMounted = false;

function qs(id) {
  return document.getElementById(id);
}

function setGoogleMsg(text, isError = true) {
  const el = qs('sidebar-google-msg');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('auth-msg-error', Boolean(text && isError));
  el.classList.toggle('auth-msg-ok', Boolean(text && !isError));
}

function renderGooglePanel(user) {
  const panel = qs('sidebar-google-panel');
  const guest = qs('sidebar-google-guest');
  const logged = qs('sidebar-google-logged');

  if (user && isGoogleSignedIn()) {
    panel?.classList.add('is-logged-in');
    if (guest) guest.hidden = true;
    if (logged) logged.hidden = false;

    const nameEl = qs('sidebar-google-name');
    const emailEl = qs('sidebar-google-email');
    if (nameEl) nameEl.textContent = user.name || 'Google kullanıcısı';
    if (emailEl) emailEl.textContent = user.email || '';

    const avatar = qs('sidebar-google-avatar');
    if (avatar) {
      if (user.picture) {
        avatar.src = user.picture;
        avatar.hidden = false;
      } else {
        avatar.hidden = true;
      }
    }
    setGoogleMsg('');
    updateGoogleTriggerLabel(user);
    googleButtonMounted = false;
  } else {
    panel?.classList.remove('is-logged-in');
    if (guest) guest.hidden = false;
    if (logged) logged.hidden = true;
    updateGoogleTriggerLabel(null);
    googleButtonMounted = false;
    const signin = qs('sidebar-google-signin');
    if (signin) signin.innerHTML = '';
  }
}

/** Google butonunu yalnızca panel açıldığında yükle (gizli GSI katmanı tıklamaları engellemesin). */
export async function mountGoogleSignInWhenNeeded() {
  if (googleButtonMounted) return;
  const guest = qs('sidebar-google-guest');
  const signin = qs('sidebar-google-signin');
  if (!guest || guest.hidden || !signin) return;

  googleButtonMounted = true;
  signin.innerHTML = '';
  await renderGoogleSignInButton(signin, {
    onError: (msg) => setGoogleMsg(msg),
  });
}

export function initSidebarGoogleAuth() {
  renderGooglePanel(getGoogleUser());

  window.addEventListener('aikoc:open-google-auth', () => {
    mountGoogleSignInWhenNeeded();
  });

  onGoogleAuthChange((user) => {
    renderGooglePanel(user);
    resetAIEngine();
    setGoogleMsg(user ? 'Google AI girişi başarılı.' : '', false);
  });

  qs('sidebar-google-logout')?.addEventListener('click', async () => {
    await signOutGoogle();
    resetAIEngine();
    setGoogleMsg('');
  });
}
