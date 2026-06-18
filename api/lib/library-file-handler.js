import { readFileSync, existsSync, statSync, createReadStream } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx']);
const ALLOWED_DIRS = new Set(['tymm', 'ogm', 'custom']);

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function allManifestBooks() {
  const out = [];
  const booksData = loadJson(join(root, 'data', 'books.json'));
  if (Array.isArray(booksData?.books)) out.push(...booksData.books);
  for (const file of ['tymm-manifest.json', 'ogm-manifest.json']) {
    const data = loadJson(join(root, 'data', file));
    if (Array.isArray(data?.books)) out.push(...data.books);
  }
  return out;
}

function findBook({ bookId, relPath }) {
  const books = allManifestBooks();
  if (bookId) {
    const byId = books.find((b) => b.id === bookId);
    if (byId) return byId;
  }
  if (!relPath) return null;
  const name = basename(relPath);
  return (
    books.find((b) => {
      const lp = b.localPath || '';
      if (lp === `/library/${relPath}`) return true;
      if (lp.endsWith(`/${name}`)) return true;
      return lp.includes(name);
    }) || null
  );
}

function parseQuery(req) {
  const out = { ...(req.query || {}) };
  const raw = req.url || '';
  const q = raw.indexOf('?');
  if (q === -1) return out;
  for (const part of raw.slice(q + 1).split('&')) {
    const [k, v] = part.split('=');
    if (!k || out[k] !== undefined) continue;
    try {
      out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
    } catch {
      out[k] = v || '';
    }
  }
  return out;
}

function sanitizeRelPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\\/g, '/').replace(/^(\.\.\/)+/, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const [dir, file] = parts;
  if (!ALLOWED_DIRS.has(dir)) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) return null;
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return null;
  return `${dir}/${file}`;
}

function contentTypeForExt(ext) {
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] || 'application/octet-stream';
}

function setCommonHeaders(res, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
}

function parseRange(rangeHeader, size) {
  if (!rangeHeader || !size) return null;
  const m = String(rangeHeader).match(/bytes=(\d*)-(\d*)/);
  if (!m) return null;
  let start = m[1] === '' ? Math.max(0, size - 1) : parseInt(m[1], 10);
  let end = m[2] === '' ? size - 1 : parseInt(m[2], 10);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

function serveLocalFile(req, res, diskPath, contentType) {
  const stat = statSync(diskPath);
  const size = stat.size;
  setCommonHeaders(res, contentType);

  const range = parseRange(req.headers.range, size);
  if (range) {
    const { start, end } = range;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    if (req.method === 'HEAD') {
      res.end();
      return Promise.resolve();
    }
    return pipeline(createReadStream(diskPath, { start, end }), res);
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', size);
  if (req.method === 'HEAD') {
    res.end();
    return Promise.resolve();
  }
  return pipeline(createReadStream(diskPath), res);
}

async function streamRemote(req, res, url, { auth = false } = {}) {
  const headers = { 'User-Agent': 'ROTA-AI-Library/1.0' };
  if (req.headers.range) headers.Range = req.headers.range;
  if (auth) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('Blob token yok');
    headers.authorization = `Bearer ${token}`;
  }

  const upstream = await fetch(url, {
    method: req.method === 'HEAD' ? 'HEAD' : 'GET',
    headers,
    signal: AbortSignal.timeout(60_000),
  });

  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`HTTP ${upstream.status}`);
  }

  res.statusCode = upstream.status;
  setCommonHeaders(res, upstream.headers.get('content-type') || 'application/pdf');
  for (const name of ['content-length', 'content-range']) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }

  if (req.method === 'HEAD' || !upstream.body) {
    res.end();
    return;
  }

  await pipeline(Readable.fromWeb(upstream.body), res);
}

function resolveSource(book, relPath) {
  if (relPath) {
    const diskPath = join(root, 'public', 'library', relPath);
    if (existsSync(diskPath)) {
      const ext = relPath.slice(relPath.lastIndexOf('.')).toLowerCase();
      return { type: 'disk', diskPath, contentType: contentTypeForExt(ext) };
    }
  }

  const lp = book?.localPath || '';
  if (lp.startsWith('http')) {
    const isBlob = /\.blob\.vercel-storage\.com\//i.test(lp);
    return { type: 'remote', url: lp, auth: isBlob };
  }

  const external = book?.externalUrl || book?.sourceUrl;
  if (external) return { type: 'remote', url: external, auth: false };

  return null;
}

export async function handleLibraryFile(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Yalnızca GET' }));
    return;
  }

  const query = parseQuery(req);
  const bookId = String(query.bookId || '').trim();
  const relPath = sanitizeRelPath(String(query.path || '').trim());
  const book = findBook({ bookId, relPath });

  if (!book && !relPath) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'path veya bookId gerekli' }));
    return;
  }

  const source = resolveSource(book, relPath);
  if (!source) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Dosya bulunamadı' }));
    return;
  }

  try {
    if (source.type === 'disk') {
      await serveLocalFile(req, res, source.diskPath, source.contentType);
      return;
    }
    await streamRemote(req, res, source.url, { auth: source.auth });
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Kaynak indirilemedi', detail: String(err?.message || err) }));
    }
  }
}
