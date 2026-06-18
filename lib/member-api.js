/** Üyelik API istemcisi */

async function post(path, data) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'İstek başarısız');
  return json;
}

export function registerMember({ name, email, password, passwordConfirm }) {
  return post('/api/auth/register', { name, email, password, passwordConfirm });
}

export function loginMember({ email, password }) {
  return post('/api/auth/login', { email, password });
}

export function verifyEmail(token) {
  return post('/api/auth/verify', { token });
}

export function forgotPassword(email) {
  return post('/api/auth/forgot-password', { email });
}

export function resetPassword({ token, password, passwordConfirm }) {
  return post('/api/auth/reset-password', { token, password, passwordConfirm });
}
