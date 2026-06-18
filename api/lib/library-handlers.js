import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { isOnSiteBook } from '../../lib/library-books.js';
import { json } from './auth-utils.js';
import { addCustomBook, getCustomBooks, removeCustomBook } from './library-store.js';
import {
  createLibraryAdminToken,
  readAdminFromRequest,
  verifyLibraryAdminPin,
} from './library-admin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);
const MAX_BYTES = 8 * 1024 * 1024;

function loadStaticBooks() {
  try {
    const raw = readFileSync(join(root, 'data', 'books.json'), 'utf8');
    const data = JSON.parse(raw);
    return data.books || [];
  } catch {
    return [];
  }
}

async function uploadToBlob(filename, buffer, contentType) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://blob.vercel-storage.com/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-vercel-blob-file-name': filename,
      'content-type': contentType || 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.url || null;
}

function saveLocalUpload(filename, buffer) {
  const dir = join(root, 'public', 'library', 'custom');
  mkdirSync(dir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = join(dir, safe);
  writeFileSync(path, buffer);
  return `/library/custom/${safe}`;
}

function formatFromExt(ext) {
  const map = {
    '.pdf': 'PDF',
    '.doc': 'DOC',
    '.docx': 'DOCX',
    '.ppt': 'PPT',
    '.pptx': 'PPTX',
  };
  return map[ext] || 'PDF';
}

export async function handleBooks(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Yalnızca GET' });
  const staticBooks = loadStaticBooks().filter(isOnSiteBook);
  const custom = (await getCustomBooks()).filter(isOnSiteBook);
  return json(res, 200, { books: [...custom, ...staticBooks] });
}

export async function handleAdminVerify(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const pin = String(body?.pin || '').trim();
  if (!verifyLibraryAdminPin(pin)) {
    return json(res, 401, { error: 'Yönetici kodu hatalı.' });
  }
  const token = createLibraryAdminToken();
  return json(res, 200, { ok: true, token });
}

export async function handleAdminStatus(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Yalnızca GET' });
  const admin = readAdminFromRequest(req);
  return json(res, 200, { isAdmin: Boolean(admin) });
}

export async function handleAdd(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Yalnızca POST' });
  if (!readAdminFromRequest(req)) return json(res, 403, { error: 'Yönetici yetkisi gerekli.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const title = String(body?.title || '').trim();
  const author = String(body?.author || 'ROTA AI').trim();
  const grade = Number(body?.grade) || 12;
  const subject = String(body?.subject || 'Genel').trim();
  const description = String(body?.description || '').trim();
  const fileName = String(body?.fileName || '').trim();
  const fileBase64 = body?.fileBase64 || '';
  const mimeType = String(body?.mimeType || 'application/octet-stream');

  if (!title) return json(res, 400, { error: 'Kitap başlığı zorunludur.' });
  if (!fileName || !fileBase64) {
    return json(res, 400, { error: 'Kitap dosyası yüklemeniz gerekir (PDF, DOC, DOCX, PPT).' });
  }

  const id = `custom-${Date.now()}`;
  let localPath = null;
  let format = 'PDF';

  if (fileName && fileBase64) {
    const ext = extname(fileName).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return json(res, 400, { error: 'Yalnızca PDF, DOC, DOCX, PPT dosyaları kabul edilir.' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.length > MAX_BYTES) {
      return json(res, 400, { error: 'Dosya en fazla 8 MB olabilir.' });
    }

    const storedName = `${id}${ext}`;
    const blobUrl = await uploadToBlob(storedName, buffer, mimeType);
    localPath = blobUrl || saveLocalUpload(storedName, buffer);
    format = formatFromExt(ext);
  }

  if (!localPath) {
    return json(res, 500, { error: 'Dosya kaydedilemedi.' });
  }

  const book = {
    id,
    title,
    author,
    publisher: author,
    grade,
    subject,
    category: 'admin-yukleme',
    language: 'tr',
    year: new Date().getFullYear(),
    pages: 0,
    format,
    localPath,
    externalUrl: null,
    cover: null,
    description: description || `${title} — yönetici tarafından eklendi.`,
    tags: [subject.toLowerCase(), 'admin', format.toLowerCase()],
    isFree: true,
    isOffline: Boolean(localPath),
    addedAt: Date.now(),
  };

  await addCustomBook(book);
  return json(res, 200, { ok: true, book });
}

export async function handleRemove(req, res) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return json(res, 405, { error: 'Yalnızca DELETE veya POST' });
  }
  if (!readAdminFromRequest(req)) return json(res, 403, { error: 'Yönetici yetkisi gerekli.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const id = String(body?.id || req.query?.id || '').trim();
  if (!id.startsWith('custom-')) {
    return json(res, 400, { error: 'Yalnızca yönetici eklemeleri silinebilir.' });
  }

  const ok = await removeCustomBook(id);
  if (!ok) return json(res, 404, { error: 'Kayıt bulunamadı.' });
  return json(res, 200, { ok: true });
}
