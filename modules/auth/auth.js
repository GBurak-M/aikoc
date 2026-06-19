import { getCurrentUser, persistSession, clearSession } from '../../lib/sidebar-auth.js';
import { loginMember, registerMember } from '../../lib/member-api.js';
import { focusMemberLoginAfterRegister } from '../../lib/guest-session.js';

let loginMode = false;

function gradeLabel(grade) {
  return grade === 'uni' ? 'Üniversite' : `${grade}. sınıf`;
}

function setMsg(text, isError = true) {
  const el = document.getElementById('auth-member-message');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('auth-msg-error', Boolean(text && isError));
  el.classList.toggle('auth-msg-ok', Boolean(text && !isError));
}

function refreshMemberUI() {
  const user = getCurrentUser();
  const logged = document.getElementById('auth-member-logged');
  const form = document.getElementById('auth-member-form');

  if (user) {
    if (logged) logged.hidden = false;
    if (form) form.hidden = true;
    document.getElementById('auth-member-name').textContent = user.name;
    document.getElementById('auth-member-email').textContent = user.email;
    document.getElementById('auth-member-grade').textContent = gradeLabel(user.grade);
  } else {
    if (logged) logged.hidden = true;
    if (form) form.hidden = false;
  }
}

function onSession() {
  refreshMemberUI();
}

export async function init() {
  refreshMemberUI();
  window.addEventListener('aikoc:session', onSession);

  document.getElementById('auth-toggle-mode')?.addEventListener('click', () => {
    loginMode = !loginMode;
    document.getElementById('auth-submit').textContent = loginMode ? 'Giriş yap' : 'Kayıt ol';
    document.getElementById('auth-toggle-mode').textContent = loginMode ? 'Hesap oluştur' : 'Zaten hesabım var';
    const gradeBlock = document.getElementById('auth-grade-wrap');
    if (gradeBlock) gradeBlock.style.display = loginMode ? 'none' : 'block';
    setMsg('');
  });

  document.getElementById('auth-member-logout')?.addEventListener('click', () => {
    clearSession();
    refreshMemberUI();
  });

  document.getElementById('auth-member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setMsg('');

    const name = document.getElementById('auth-name')?.value?.trim();
    const email = document.getElementById('auth-email')?.value?.trim().toLowerCase();
    const password = document.getElementById('auth-password')?.value || '';
    const grade = document.getElementById('auth-grade')?.value;

    if (!email || !password) {
      setMsg('E-posta ve şifre gerekli.');
      return;
    }

    if (loginMode) {
      try {
        const res = await loginMember({ email, password });
        persistSession(res.user);
        setMsg('Giriş başarılı.', false);
        refreshMemberUI();
      } catch (err) {
        setMsg(err.message);
      }
      return;
    }

    if (!name) {
      setMsg('Kayıt için ad gerekli.');
      return;
    }

    try {
      const res = await registerMember({
        name,
        email,
        password,
        passwordConfirm: password,
      });
      setMsg(res.message || 'Kayıt tamamlandı. Şimdi giriş yapabilirsin.', false);
      loginMode = true;
      document.getElementById('auth-submit').textContent = 'Giriş yap';
      document.getElementById('auth-toggle-mode').textContent = 'Hesap oluştur';
      const gradeBlock = document.getElementById('auth-grade-wrap');
      if (gradeBlock) gradeBlock.style.display = 'none';
      focusMemberLoginAfterRegister(email);
    } catch (err) {
      setMsg(err.message);
    }
  });
}

export function destroy() {
  window.removeEventListener('aikoc:session', onSession);
}
