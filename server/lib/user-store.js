/** Kullanıcı kaydı — Upstash Redis (KV) veya bellek içi yedek */

const memory = globalThis.__rotaUsers ?? (globalThis.__rotaUsers = new Map());

function kvEnabled() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvRequest(path, method = 'GET', body) {
  const base = process.env.KV_REST_API_URL.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`KV hatası: ${res.status}`);
  return res.json();
}

function key(email) {
  return `user:${email.toLowerCase()}`;
}

export async function getUser(email) {
  const e = email.toLowerCase();
  if (kvEnabled()) {
    const data = await kvRequest(`/get/${encodeURIComponent(key(e))}`);
    return data.result ? JSON.parse(data.result) : null;
  }
  return memory.get(e) ?? null;
}

export async function saveUser(email, user) {
  const e = email.toLowerCase();
  const record = { ...user, email: e, updatedAt: Date.now() };
  if (kvEnabled()) {
    await kvRequest(`/set/${encodeURIComponent(key(e))}`, 'POST', record);
  } else {
    memory.set(e, record);
  }
  return record;
}

export async function userExists(email) {
  const u = await getUser(email);
  return Boolean(u);
}
