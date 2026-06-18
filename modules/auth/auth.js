import { getItem, setItem, removeItem, hashPassword, uuid } from '../../lib/storage.js';

import { getCurrentUser, persistSession, clearSession } from '../../lib/sidebar-auth.js';

import {

  renderGoogleSignInButton,

  getGoogleUser,

  isGoogleSignedIn,

  signOutGoogle,

  onGoogleAuthChange,

} from '../../lib/google-auth.js';



let loginMode = false;

let authUnsub = null;



function getUsers() {

  return getItem('users', []);

}



function saveUsers(users) {

  setItem('users', users);

}



function gradeLabel(grade) {

  return grade === 'uni' ? 'Üniversite' : `${grade}. sınıf`;

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



function refreshGoogleUI() {

  const user = getGoogleUser();

  const logged = document.getElementById('auth-google-logged');

  const guest = document.getElementById('auth-google-guest');

  const avatar = document.getElementById('auth-google-avatar');



  if (user && isGoogleSignedIn()) {

    if (logged) logged.hidden = false;

    if (guest) guest.hidden = true;

    document.getElementById('auth-google-name').textContent = user.name;

    document.getElementById('auth-google-email').textContent = user.email;

    if (avatar && user.picture) {

      avatar.src = user.picture;

      avatar.hidden = false;

    } else if (avatar) {

      avatar.hidden = true;

    }

  } else {

    if (logged) logged.hidden = true;

    if (guest) guest.hidden = false;

    mountGoogleButton();

  }

}



function refreshUI() {

  refreshMemberUI();

  refreshGoogleUI();

}



function mountGoogleButton() {

  const wrap = document.getElementById('google-signin-wrap');

  if (!wrap) return;

  renderGoogleSignInButton(wrap);

}



export async function init() {

  refreshUI();



  authUnsub = onGoogleAuthChange(() => refreshGoogleUI());



  document.getElementById('auth-toggle-mode')?.addEventListener('click', () => {

    loginMode = !loginMode;

    document.getElementById('auth-submit').textContent = loginMode ? 'Giriş yap' : 'Kayıt ol';

    document.getElementById('auth-toggle-mode').textContent = loginMode ? 'Hesap oluştur' : 'Zaten hesabım var';

    const gradeBlock = document.getElementById('auth-grade-wrap');

    if (gradeBlock) gradeBlock.style.display = loginMode ? 'none' : 'block';

  });



  document.getElementById('auth-member-logout')?.addEventListener('click', () => {

    clearSession();

    refreshUI();

  });



  document.getElementById('auth-google-logout')?.addEventListener('click', async () => {

    await signOutGoogle();

    refreshGoogleUI();

  });



  document.getElementById('auth-member-form')?.addEventListener('submit', async (e) => {

    e.preventDefault();

    const msg = document.getElementById('auth-member-message');

    const name = document.getElementById('auth-name').value.trim();

    const email = document.getElementById('auth-email').value.trim().toLowerCase();

    const password = document.getElementById('auth-password').value;

    const grade = document.getElementById('auth-grade').value;



    if (!name || !email || !password) {

      if (msg) msg.textContent = 'Ad, e-posta ve şifre gerekli.';

      return;

    }



    const users = getUsers();

    const hash = await hashPassword(password);



    if (loginMode) {

      const found = users.find((u) => u.email === email && u.passwordHash === hash);

      if (!found) {

        if (msg) msg.textContent = 'E-posta veya şifre hatalı.';

        return;

      }

      persistSession({ id: found.id, name: found.name, email: found.email, grade: found.grade });

      if (msg) msg.textContent = '';

      refreshUI();

      return;

    }



    if (users.some((u) => u.email === email)) {

      if (msg) msg.textContent = 'Bu e-posta zaten kayıtlı.';

      return;

    }



    const id = uuid();

    users.push({ id, name, email, passwordHash: hash, grade, created: Date.now() });

    saveUsers(users);

    persistSession({ id, name, email, grade });

    if (msg) msg.textContent = 'Kayıt başarılı.';

    refreshUI();

  });

}



export function destroy() {

  authUnsub?.();

  authUnsub = null;

}

