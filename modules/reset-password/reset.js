import { resetPassword } from '../../lib/member-api.js';
import { persistSession } from '../../lib/sidebar-auth.js';

function getToken() {
  const hash = location.hash.slice(1);
  const q = hash.includes('?') ? hash.split('?')[1] : '';
  return new URLSearchParams(q).get('token') || '';
}

export async function init() {
  const token = getToken();
  const form = document.getElementById('reset-form');
  const msg = document.getElementById('reset-msg');
  const hint = document.getElementById('reset-hint');

  if (!token) {
    if (hint) hint.textContent = 'Sıfırlama bağlantısı geçersiz.';
    form?.remove();
    return;
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('reset-password')?.value || '';
    const passwordConfirm = document.getElementById('reset-password2')?.value || '';

    if (password !== passwordConfirm) {
      if (msg) msg.textContent = 'Şifreler aynı olmalıdır.';
      return;
    }

    try {
      const res = await resetPassword({ token, password, passwordConfirm });
      persistSession(res.user);
      if (msg) {
        msg.textContent = res.message;
        msg.classList.add('auth-msg-ok');
      }
      setTimeout(() => { location.hash = '#/profil'; }, 1200);
    } catch (err) {
      if (msg) msg.textContent = err.message;
    }
  });
}
