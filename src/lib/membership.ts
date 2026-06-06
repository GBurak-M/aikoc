import { safeParse, safeSetItem } from './storage';

export type MemberAccount = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
};

export type MemberSession = {
  memberId: string;
  email: string;
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  type: 'konum' | 'sozluk' | 'uye' | 'kutuphane' | 'genel';
  at: string;
};

export type VisitItem = {
  id: string;
  tab: string;
  label: string;
  at: string;
};

export type UploadItem = {
  id: string;
  type: 'sinav' | 'soru_gorsel' | 'soru_metin' | 'not' | 'odev';
  title: string;
  at: string;
  meta?: string;
};

export type HomeworkItem = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'bekliyor' | 'devam' | 'tamamlandi';
  notes: string;
  createdAt: string;
};

export type TopicTrackItem = {
  id: string;
  subject: string;
  topic: string;
  progress: number;
  targetDate: string;
  notes: string;
  updatedAt: string;
};

export type ProgressSnapshot = {
  at: string;
  examCount: number;
  avgNet: number;
  avgAccuracy: number;
  completedTasks: number;
  totalTasks: number;
};

export type MemberActivity = {
  searchHistory: SearchHistoryItem[];
  visits: VisitItem[];
  uploads: UploadItem[];
  homework: HomeworkItem[];
  topics: TopicTrackItem[];
  snapshots: ProgressSnapshot[];
};

const REGISTRY_KEY = 'aikoc_members_registry';
const SESSION_KEY = 'aikoc_member_session';

export const TAB_LABELS: Record<string, string> = {
  panel: 'Panel',
  merkez: 'Zeka Merkezi',
  sorucozucu: 'AI Soru Çözücü',
  planlayici: 'Planlayıcı',
  kutuphane: 'Kütüphane',
  sinavlar: 'Sınavlar',
  uyepanel: 'Üye Paneli',
};

function activityKey(memberId: string) {
  return `aikoc_member_activity_${memberId}`;
}

function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return `h${h}_${password.length}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function emptyActivity(): MemberActivity {
  return {
    searchHistory: [],
    visits: [],
    uploads: [],
    homework: [],
    topics: [],
    snapshots: [],
  };
}

export function loadRegistry(): MemberAccount[] {
  return safeParse<MemberAccount[]>(REGISTRY_KEY, []);
}

function saveRegistry(accounts: MemberAccount[]) {
  safeSetItem(REGISTRY_KEY, accounts);
}

export function getMemberSession(): MemberSession | null {
  return safeParse<MemberSession | null>(SESSION_KEY, null);
}

export function setMemberSession(session: MemberSession | null) {
  if (session) safeSetItem(SESSION_KEY, session);
  else localStorage.removeItem(SESSION_KEY);
}

export function getMemberById(id: string): MemberAccount | null {
  return loadRegistry().find((m) => m.id === id) ?? null;
}

export function getLoggedInMember(): MemberAccount | null {
  const session = getMemberSession();
  if (!session) return null;
  return getMemberById(session.memberId);
}

export function loadMemberActivity(memberId: string): MemberActivity {
  return safeParse<MemberActivity>(activityKey(memberId), emptyActivity());
}

function saveMemberActivity(memberId: string, activity: MemberActivity) {
  safeSetItem(activityKey(memberId), activity);
}

function trimList<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

export function registerMember(input: {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
}): { ok: true; member: MemberAccount } | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password;

  if (!email.includes('@')) return { ok: false, error: 'Geçerli bir e-posta adresi girin.' };
  if (phone.length < 10) return { ok: false, error: 'Telefon numarası en az 10 haneli olmalı.' };
  if (!firstName || !lastName) return { ok: false, error: 'Ad ve soyad zorunludur.' };
  if (password.length < 6) return { ok: false, error: 'Şifre en az 6 karakter olmalı.' };

  const registry = loadRegistry();
  if (registry.some((m) => m.email === email)) {
    return { ok: false, error: 'Bu e-posta ile kayıtlı üyelik zaten var.' };
  }
  if (registry.some((m) => m.phone === phone)) {
    return { ok: false, error: 'Bu telefon numarası başka bir üyede kayıtlı.' };
  }

  const member: MemberAccount = {
    id: `mem_${Date.now()}`,
    email,
    phone,
    firstName,
    lastName,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  saveRegistry([...registry, member]);
  saveMemberActivity(member.id, emptyActivity());
  setMemberSession({ memberId: member.id, email: member.email });

  return { ok: true, member };
}

export function loginMember(
  email: string,
  password: string,
): { ok: true; member: MemberAccount } | { ok: false; error: string } {
  const normalized = normalizeEmail(email);
  const member = loadRegistry().find((m) => m.email === normalized);
  if (!member) return { ok: false, error: 'E-posta veya şifre hatalı.' };
  if (member.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'E-posta veya şifre hatalı.' };
  }
  setMemberSession({ memberId: member.id, email: member.email });
  return { ok: true, member };
}

export function logoutMember() {
  setMemberSession(null);
}

export function logMemberSearch(
  memberId: string,
  query: string,
  type: SearchHistoryItem['type'],
) {
  if (!query.trim()) return;
  const activity = loadMemberActivity(memberId);
  const item: SearchHistoryItem = {
    id: `s_${Date.now()}`,
    query: query.trim(),
    type,
    at: new Date().toISOString(),
  };
  activity.searchHistory = trimList([item, ...activity.searchHistory], 100);
  saveMemberActivity(memberId, activity);
}

export function logMemberVisit(memberId: string, tab: string, label?: string) {
  const activity = loadMemberActivity(memberId);
  const last = activity.visits[0];
  if (last && last.tab === tab) return;
  const item: VisitItem = {
    id: `v_${Date.now()}`,
    tab,
    label: label ?? TAB_LABELS[tab] ?? tab,
    at: new Date().toISOString(),
  };
  activity.visits = trimList([item, ...activity.visits], 150);
  saveMemberActivity(memberId, activity);
}

export function logMemberUpload(
  memberId: string,
  type: UploadItem['type'],
  title: string,
  meta?: string,
) {
  const activity = loadMemberActivity(memberId);
  const item: UploadItem = {
    id: `u_${Date.now()}`,
    type,
    title,
    at: new Date().toISOString(),
    meta,
  };
  activity.uploads = trimList([item, ...activity.uploads], 100);
  saveMemberActivity(memberId, activity);
}

export function addProgressSnapshot(
  memberId: string,
  snapshot: Omit<ProgressSnapshot, 'at'>,
) {
  const activity = loadMemberActivity(memberId);
  const item: ProgressSnapshot = { ...snapshot, at: new Date().toISOString() };
  const last = activity.snapshots[0];
  const sameDay =
    last &&
    new Date(last.at).toDateString() === new Date(item.at).toDateString();
  if (sameDay) {
    activity.snapshots[0] = item;
  } else {
    activity.snapshots = trimList([item, ...activity.snapshots], 400);
  }
  saveMemberActivity(memberId, activity);
}

export function addHomework(memberId: string, hw: Omit<HomeworkItem, 'id' | 'createdAt'>) {
  const activity = loadMemberActivity(memberId);
  const item: HomeworkItem = {
    ...hw,
    id: `hw_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  activity.homework = [item, ...activity.homework];
  saveMemberActivity(memberId, activity);
  return item;
}

export function updateHomework(memberId: string, id: string, patch: Partial<HomeworkItem>) {
  const activity = loadMemberActivity(memberId);
  activity.homework = activity.homework.map((h) => (h.id === id ? { ...h, ...patch } : h));
  saveMemberActivity(memberId, activity);
}

export function deleteHomework(memberId: string, id: string) {
  const activity = loadMemberActivity(memberId);
  activity.homework = activity.homework.filter((h) => h.id !== id);
  saveMemberActivity(memberId, activity);
}

export function addTopicTrack(memberId: string, topic: Omit<TopicTrackItem, 'id' | 'updatedAt'>) {
  const activity = loadMemberActivity(memberId);
  const item: TopicTrackItem = {
    ...topic,
    id: `tp_${Date.now()}`,
    updatedAt: new Date().toISOString(),
  };
  activity.topics = [item, ...activity.topics];
  saveMemberActivity(memberId, activity);
  return item;
}

export function updateTopicTrack(memberId: string, id: string, patch: Partial<TopicTrackItem>) {
  const activity = loadMemberActivity(memberId);
  activity.topics = activity.topics.map((t) =>
    t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
  );
  saveMemberActivity(memberId, activity);
}

export function deleteTopicTrack(memberId: string, id: string) {
  const activity = loadMemberActivity(memberId);
  activity.topics = activity.topics.filter((t) => t.id !== id);
  saveMemberActivity(memberId, activity);
}

export function searchMembers(query: string): MemberAccount[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return loadRegistry().filter(
    (m) =>
      m.email.includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q) ||
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q),
  );
}

export function getMemberDisplayName(member: MemberAccount) {
  return `${member.firstName} ${member.lastName}`;
}
