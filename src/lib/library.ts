import {
  CURATED_LIBRARY,
  LIBRARY_CATEGORY_LABELS,
  type LibraryCategory,
  type LibraryItem,
} from '../data/libraryCatalog';
import type { DiscoveredResource } from './libraryDiscovery';
import { canEmbedInReader, embeddableDomainsHint } from './libraryEmbed';
import { safeParse, safeSetItem } from './storage';

const PENDING_KEY = 'aikoc_library_pending';
const APPROVED_USER_KEY = 'aikoc_library_user_approved';
const ADMIN_ADDED_KEY = 'aikoc_library_admin_added';
const REMOVED_IDS_KEY = 'aikoc_library_removed_ids';
const EDITOR_SESSION_KEY = 'aikoc_library_editor_session';

export { canEmbedInReader, embeddableDomainsHint };

export type LibrarySubmission = {
  id: string;
  category: LibraryCategory;
  title: string;
  summary: string;
  url: string;
  author: string;
  tags: string[];
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNote?: string;
};

function normalizeLibraryItem(item: LibraryItem): LibraryItem {
  return {
    ...item,
    format: item.format ?? (item.url.toLowerCase().includes('.pdf') ? 'pdf' : 'html'),
  };
}

function getRemovedIds(): Set<string> {
  return new Set(safeParse<string[]>(REMOVED_IDS_KEY, []));
}

function getAdminAddedItems(): LibraryItem[] {
  return safeParse<LibraryItem[]>(ADMIN_ADDED_KEY, []).map(normalizeLibraryItem);
}

function getUserApprovedItems(): LibraryItem[] {
  return safeParse<LibraryItem[]>(APPROVED_USER_KEY, []).map(normalizeLibraryItem);
}

function mergeCatalogItems(): LibraryItem[] {
  const removed = getRemovedIds();
  const merged = [
    ...CURATED_LIBRARY,
    ...getAdminAddedItems(),
    ...getUserApprovedItems(),
  ];
  const seen = new Set<string>();
  const out: LibraryItem[] = [];
  for (const item of merged) {
    if (removed.has(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(normalizeLibraryItem(item));
  }
  return out;
}

/** Kullanıcıya gösterilen kaynaklar — yalnızca kütüphane içi okunabilir */
export function getAllLibraryItems(): LibraryItem[] {
  return mergeCatalogItems().filter((item) => canEmbedInReader(item.url));
}

/** Admin paneli — kaldırılmış ve gömülemeyen dahil tam liste */
export function getLibraryCatalogForAdmin(): (LibraryItem & { removed: boolean; embeddable: boolean })[] {
  const removed = getRemovedIds();
  const merged = [
    ...CURATED_LIBRARY,
    ...getAdminAddedItems(),
    ...getUserApprovedItems(),
  ];
  const seen = new Set<string>();
  const out: (LibraryItem & { removed: boolean; embeddable: boolean })[] = [];
  for (const item of merged) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const normalized = normalizeLibraryItem(item);
    out.push({
      ...normalized,
      removed: removed.has(item.id),
      embeddable: canEmbedInReader(normalized.url),
    });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
}

export function searchLibraryItems(query: string, items: LibraryItem[]): LibraryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const words = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const haystack = [
      item.title,
      item.summary,
      item.author,
      item.source,
      LIBRARY_CATEGORY_LABELS[item.category],
      ...item.tags,
    ]
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export function filterByCategory(items: LibraryItem[], category: LibraryCategory | 'all'): LibraryItem[] {
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

export function getPendingSubmissions(): LibrarySubmission[] {
  return safeParse<LibrarySubmission[]>(PENDING_KEY, []).filter((s) => s.status === 'pending');
}

export function getAllSubmissions(): LibrarySubmission[] {
  return safeParse<LibrarySubmission[]>(PENDING_KEY, []);
}

export function submitLibraryItem(input: {
  category: LibraryCategory;
  title: string;
  summary: string;
  url: string;
  author: string;
  tags: string[];
  submittedBy: string;
}): LibrarySubmission {
  const submission: LibrarySubmission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };
  const list = getAllSubmissions();
  list.unshift(submission);
  safeSetItem(PENDING_KEY, list);
  return submission;
}

export function approveSubmission(id: string, reviewNote = ''): boolean {
  const list = getAllSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return false;

  const sub = list[idx];
  sub.status = 'approved';
  sub.reviewedAt = new Date().toISOString();
  sub.reviewNote = reviewNote;
  safeSetItem(PENDING_KEY, list);

  if (!canEmbedInReader(sub.url)) return false;

  const approved = safeParse<LibraryItem[]>(APPROVED_USER_KEY, []);
  approved.unshift({
    id: `user_${sub.id}`,
    category: sub.category,
    title: sub.title,
    summary: sub.summary,
    author: sub.author,
    url: sub.url,
    format: sub.url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
    tags: sub.tags,
    language: 'TR',
    source: `Kullanıcı: ${sub.submittedBy}`,
    approved: true,
  });
  safeSetItem(APPROVED_USER_KEY, approved);
  return true;
}

export function rejectSubmission(id: string, reviewNote = ''): boolean {
  const list = getAllSubmissions();
  const idx = list.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  list[idx].status = 'rejected';
  list[idx].reviewedAt = new Date().toISOString();
  list[idx].reviewNote = reviewNote;
  safeSetItem(PENDING_KEY, list);
  return true;
}

export function isEditorSessionActive(): boolean {
  return safeParse<boolean>(EDITOR_SESSION_KEY, false);
}

export function unlockEditorSession(pin: string, expectedPin: string): boolean {
  if (pin !== expectedPin) return false;
  safeSetItem(EDITOR_SESSION_KEY, true);
  return true;
}

export function lockEditorSession() {
  localStorage.removeItem(EDITOR_SESSION_KEY);
}

/** Tam yetkili admin girişinde editör oturumunu otomatik açar */
export function grantEditorSessionForAdmin(): void {
  safeSetItem(EDITOR_SESSION_KEY, true);
}

export function revokeEditorSessionForAdmin(): void {
  lockEditorSession();
}

function urlExistsInCatalog(url: string): boolean {
  const lower = url.toLowerCase();
  return mergeCatalogItems().some((i) => i.url.toLowerCase() === lower);
}

/** AI keşif veya editör tarafından doğrudan onaylı kütüphaneye ekler */
export function importDiscoveredItem(resource: DiscoveredResource): boolean {
  if (!resource.url?.trim() || urlExistsInCatalog(resource.url)) return false;
  if (!canEmbedInReader(resource.url)) return false;

  const approved = safeParse<LibraryItem[]>(APPROVED_USER_KEY, []);
  approved.unshift({
    id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category: resource.category,
    title: resource.title,
    summary: resource.summary,
    author: resource.author,
    url: resource.url,
    format: resource.format,
    tags: resource.tags,
    language: resource.language,
    source: resource.source,
    approved: true,
  });
  safeSetItem(APPROVED_USER_KEY, approved);
  return true;
}

export function adminRemoveLibraryItem(id: string): boolean {
  const catalog = mergeCatalogItems();
  if (!catalog.some((i) => i.id === id)) return false;
  const removed = safeParse<string[]>(REMOVED_IDS_KEY, []);
  if (!removed.includes(id)) {
    removed.push(id);
    safeSetItem(REMOVED_IDS_KEY, removed);
  }
  return true;
}

export function adminRestoreLibraryItem(id: string): boolean {
  const removed = safeParse<string[]>(REMOVED_IDS_KEY, []);
  const next = removed.filter((x) => x !== id);
  if (next.length === removed.length) return false;
  safeSetItem(REMOVED_IDS_KEY, next);
  return true;
}

export function adminDeleteLibraryItem(id: string): boolean {
  let changed = false;
  const adminAdded = getAdminAddedItems().filter((i) => {
    if (i.id === id) {
      changed = true;
      return false;
    }
    return true;
  });
  if (changed) safeSetItem(ADMIN_ADDED_KEY, adminAdded);

  const userApproved = getUserApprovedItems();
  const filteredUser = userApproved.filter((i) => {
    if (i.id === id) {
      changed = true;
      return false;
    }
    return true;
  });
  if (filteredUser.length !== userApproved.length) {
    safeSetItem(APPROVED_USER_KEY, filteredUser);
    changed = true;
  }

  adminRemoveLibraryItem(id);
  return changed || getRemovedIds().has(id);
}

export function adminAddLibraryItem(input: {
  category: LibraryCategory;
  title: string;
  summary: string;
  url: string;
  author: string;
  tags: string[];
  language?: string;
}): { ok: true; item: LibraryItem } | { ok: false; error: string } {
  const url = input.url.trim();
  if (!url) return { ok: false, error: 'URL gerekli.' };
  if (!canEmbedInReader(url)) {
    return {
      ok: false,
      error: `Bu bağlantı kütüphane içinde açılamaz. Desteklenen kaynaklar: ${embeddableDomainsHint()}`,
    };
  }
  if (urlExistsInCatalog(url)) return { ok: false, error: 'Bu URL zaten kütüphanede.' };

  const item: LibraryItem = {
    id: `adm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category: input.category,
    title: input.title.trim(),
    summary: input.summary.trim() || 'Admin tarafından eklenen kaynak.',
    author: input.author.trim() || 'Admin',
    url,
    format: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
    tags: input.tags,
    language: input.language ?? 'TR',
    source: 'Admin',
    approved: true,
  };

  const list = getAdminAddedItems();
  list.unshift(item);
  safeSetItem(ADMIN_ADDED_KEY, list);

  const removed = safeParse<string[]>(REMOVED_IDS_KEY, []);
  if (removed.includes(item.id)) {
    safeSetItem(REMOVED_IDS_KEY, removed.filter((x) => x !== item.id));
  }
  return { ok: true, item };
}
