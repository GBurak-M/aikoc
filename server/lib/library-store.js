/** Kütüphane özel kayıtları — Upstash KV veya bellek içi */

const memory = globalThis.__rotaLibrary ?? (globalThis.__rotaLibrary = new Map());

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

const LIST_KEY = 'library:custom_books';

export async function getCustomBooks() {
  if (kvEnabled()) {
    const data = await kvRequest(`/get/${encodeURIComponent(LIST_KEY)}`);
    return data.result ? JSON.parse(data.result) : [];
  }
  return memory.get(LIST_KEY) ?? [];
}

export async function saveCustomBooks(books) {
  if (kvEnabled()) {
    await kvRequest(`/set/${encodeURIComponent(LIST_KEY)}`, 'POST', books);
  } else {
    memory.set(LIST_KEY, books);
  }
  return books;
}

export async function addCustomBook(book) {
  const list = await getCustomBooks();
  if (list.some((b) => b.id === book.id)) {
    throw new Error('Bu kimlikte bir kayıt zaten var.');
  }
  list.unshift(book);
  await saveCustomBooks(list);
  return book;
}

export async function removeCustomBook(id) {
  const list = await getCustomBooks();
  const next = list.filter((b) => b.id !== id);
  if (next.length === list.length) return false;
  await saveCustomBooks(next);
  return true;
}
