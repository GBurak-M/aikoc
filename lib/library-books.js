/** Yalnızca sitede barındırılan kitaplar (harici yönlendirme yok). */

export const LIBRARY_GRADES = [9, 10, 11, 12];

export function isLibraryGrade(grade) {
  const n = Number(grade);
  return LIBRARY_GRADES.includes(n);
}

export function isOnSitePath(path) {
  if (!path || typeof path !== 'string') return false;
  if (path.startsWith('/library/')) return true;
  if (/^https:\/\/[^/]*\.blob\.vercel-storage\.com\//i.test(path)) return true;
  return false;
}

export function isOnSiteBook(book) {
  return isOnSitePath(book?.localPath);
}

export function filterOnSiteBooks(books) {
  return (books || []).filter((b) => isOnSiteBook(b) && isLibraryGrade(b.grade));
}
