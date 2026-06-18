import { handleOptions } from './lib/auth-utils.js';
import {
  handleAdd,
  handleAdminStatus,
  handleAdminVerify,
  handleBooks,
  handleRemove,
} from './lib/library-handlers.js';
import { handleLibraryFile } from './lib/library-file-handler.js';

function resolveRoute(req) {
  const q = req.query?.route;
  if (Array.isArray(q)) return q.join('/');
  if (typeof q === 'string' && q) return q;

  const raw = req.url || '';
  const path = raw.split('?')[0];
  const match = path.match(/\/api\/library\/?(.*)$/);
  return match?.[1] || '';
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const route = resolveRoute(req);

  switch (route) {
    case 'books':
    case '':
      return handleBooks(req, res);
    case 'admin/verify':
      return handleAdminVerify(req, res);
    case 'admin/status':
      return handleAdminStatus(req, res);
    case 'add':
      return handleAdd(req, res);
    case 'remove':
      return handleRemove(req, res);
    case 'file':
      return handleLibraryFile(req, res);
    default:
      return handleBooks(req, res);
  }
}
