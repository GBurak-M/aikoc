import {
  CURATED_LIBRARY,
  LIBRARY_CATEGORY_LABELS,
  type LibraryCategory,
  type LibraryItem,
} from '../data/libraryCatalog';
import type { DiscoveredResource } from './libraryDiscovery';
import { safeParse, safeSetItem } from './storage';

const PENDING_KEY = 'aikoc_library_pending';
const APPROVED_USER_KEY = 'aikoc_library_user_approved';
const EDITOR_SESSION_KEY = 'aikoc_library_editor_session';

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

export function getAllLibraryItems(): LibraryItem[] {
  const userApproved = safeParse<LibraryItem[]>(APPROVED_USER_KEY, []);
  return [...CURATED_LIBRARY, ...userApproved.map(normalizeLibraryItem)];
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
  return getAllLibraryItems().some((i) => i.url.toLowerCase() === lower);
}

/** AI keşif veya editör tarafından doğrudan onaylı kütüphaneye ekler */
export function importDiscoveredItem(resource: DiscoveredResource): boolean {
  if (!resource.url?.trim() || urlExistsInCatalog(resource.url)) return false;

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
