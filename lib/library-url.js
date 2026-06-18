/** Kitap kaynağını okuyucunun yükleyebileceği URL'ye çevirir. */

function libraryFileApi(query) {
  const params = new URLSearchParams({ route: 'file', ...query });
  return `/api/library?${params.toString()}`;
}

export function resolveBookReadUrl(book) {
  const path = book?.localPath;
  if (!path || typeof path !== 'string') return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (/\.public\.blob\.vercel-storage\.com\//i.test(path)) {
      return path;
    }
    if (/\.blob\.vercel-storage\.com\//i.test(path)) {
      return libraryFileApi({ bookId: book.id || '' });
    }
    return path;
  }

  if (path.startsWith('/library/')) {
    const rel = path.slice('/library/'.length);
    return libraryFileApi({ path: rel });
  }

  return path;
}
