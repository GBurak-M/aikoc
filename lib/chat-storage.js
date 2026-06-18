/** Üye girişi: kalıcı sohbet geçmişi. Misafir/Google-only: sekme kapanınca silinir. */

import { getItem, setItem, removeItem } from './storage.js';
import { getCurrentUser } from './sidebar-auth.js';

const GUEST_KEY = 'chat_sessions_guest';
const LEGACY_KEY = 'chat_sessions';

function memberStorageKey(userId) {
  return `chat_sessions_${userId}`;
}

function readGuestSessions() {
  try {
    const raw = sessionStorage.getItem(`aikoc_${GUEST_KEY}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestSessions(list) {
  try {
    sessionStorage.setItem(`aikoc_${GUEST_KEY}`, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function loadChatSessions() {
  const member = getCurrentUser();
  if (member?.id) {
    return getItem(memberStorageKey(member.id), []);
  }
  return readGuestSessions();
}

export function saveChatSessions(list) {
  const capped = list.slice(0, 30);
  const member = getCurrentUser();
  if (member?.id) {
    setItem(memberStorageKey(member.id), capped);
    return;
  }
  writeGuestSessions(capped);
}

/** Eski localStorage sohbetlerini temizle; misafir için sessionStorage kullan. */
export function migrateChatStorage() {
  const legacy = getItem(LEGACY_KEY, null);
  if (legacy?.length && !getCurrentUser()) {
    writeGuestSessions(legacy);
  }
  removeItem(LEGACY_KEY);
  removeItem(GUEST_KEY);
}

export function clearGuestChatSessions() {
  try {
    sessionStorage.removeItem(`aikoc_${GUEST_KEY}`);
  } catch {
    /* ignore */
  }
}

export function countChatMessages() {
  return loadChatSessions().reduce((n, s) => n + (s.messages?.length || 0), 0);
}
