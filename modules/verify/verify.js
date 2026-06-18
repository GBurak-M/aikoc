import { verifyEmail } from '../../lib/member-api.js';
import { persistSession } from '../../lib/sidebar-auth.js';

function getToken() {
  const hash = location.hash.slice(1);
  const q = hash.includes('?') ? hash.split('?')[1] : '';
  return new URLSearchParams(q).get('token') || '';
}

export async function init() {
  const status = document.getElementById('verify-status');
  const btn = document.getElementById('verify-go-panel');
  const token = getToken();

  if (!token) {
    if (status) status.textContent = 'Doğrulama bağlantısı geçersiz.';
    return;
  }

  try {
    const res = await verifyEmail(token);
    persistSession(res.user);
    if (status) status.textContent = `Hoş geldin ${res.user.name}! Üyeliğin tamamlandı.`;
    if (btn) {
      btn.hidden = false;
      btn.onclick = () => { location.hash = '#/profil'; };
    }
  } catch (err) {
    if (status) status.textContent = err.message || 'Doğrulama başarısız.';
  }
}
