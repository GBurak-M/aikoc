import { getLoggedInMember } from './membership';
import { GUEST_CHAT_KEY, GUEST_PROFILE } from './guestProfile';

export const GUEST_TAB_FLAG = 'aikoc_guest_tab_active';

/** Cihaz genelinde korunur — tüm kullanıcı sohbetlerinden merkezi AI öğrenimi */
const DEVICE_WIDE_KEYS = [
  'aikoc_ai_learning_queue',
  'aikoc_ai_knowledge_core',
  'aikoc_ai_learning_bypass',
  'aikoc_ai_learning_motor',
  'aikoc_admin_registry',
  'aikoc_admin_session',
  'aikoc_admin_bootstrap_done',
];

const GUEST_DATA_PREFIXES = [
  'guidance_core_exams',
  'guidance_core_tasks',
  'guidance_core_notes',
  'guidance_core_profile',
  'guidance_core_trans_history',
  'guidance_core_unsolved_archive',
  'guidance_core_chat_',
  'aikoc_exam_archive_progress',
  'aikoc_user_learning_profile',
  'aikoc_site_traffic',
  'aikoc_world_snapshot',
  'aikoc_settlement',
  'aikoc_library_pending',
  'aikoc_library_user_approved',
  'aikoc_library_editor_session',
];

const TRANSLATION_CACHE_PREFIX = 'aikoc_tr_v1_';

const MEMBER_KEY_PATTERNS = [
  'aikoc_members_registry',
  'aikoc_member_session',
  'aikoc_admin_registry',
  'aikoc_admin_session',
  'aikoc_admin_bootstrap_done',
  'aikoc_member_activity_',
  'aikoc_member_education_',
  'aikoc_member_curriculum_',
];

function isMemberStorageKey(key: string): boolean {
  return MEMBER_KEY_PATTERNS.some((p) => key === p || key.startsWith(p));
}

function shouldClearGuestKey(key: string): boolean {
  if (isMemberStorageKey(key)) return false;
  if (DEVICE_WIDE_KEYS.includes(key)) return false;
  if (key.startsWith(TRANSLATION_CACHE_PREFIX)) return true;
  return GUEST_DATA_PREFIXES.some((p) => key === p || key.startsWith(p));
}

/** Misafir oturumuna ait tüm kalıcı verileri temizler (üyelik verileri korunur). */
export function clearGuestPersistedData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && shouldClearGuestKey(key)) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* quota / private mode */
  }
  try {
    sessionStorage.removeItem(GUEST_TAB_FLAG);
  } catch {
    /* ignore */
  }
}

/**
 * Yeni sekme veya sayfa kapanışından sonra misafir verisini sıfırlar.
 * Aynı sekmede yenileme sırasında veri korunur (sessionStorage bayrağı).
 */
export function initGuestSessionOnLoad(): void {
  if (getLoggedInMember()) return;
  try {
    if (sessionStorage.getItem(GUEST_TAB_FLAG)) return;
    clearGuestPersistedData();
    sessionStorage.setItem(GUEST_TAB_FLAG, '1');
  } catch {
    clearGuestPersistedData();
  }
}

/** Sayfa kapanırken misafir verisini sıfırlamak için dinleyici. */
export function registerGuestSessionCleanup(): () => void {
  const onPageHide = () => {
    if (getLoggedInMember()) return;
    clearGuestPersistedData();
  };
  window.addEventListener('pagehide', onPageHide);
  return () => window.removeEventListener('pagehide', onPageHide);
}

export function markGuestTabActive(): void {
  if (getLoggedInMember()) return;
  try {
    sessionStorage.setItem(GUEST_TAB_FLAG, '1');
  } catch {
    /* ignore */
  }
}

export function guestChatStorageId(profileName: string): string {
  if (profileName === GUEST_PROFILE.name) return GUEST_CHAT_KEY;
  return profileName.trim() || GUEST_CHAT_KEY;
}
