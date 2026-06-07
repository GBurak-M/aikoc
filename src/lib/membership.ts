import { loadCurriculumState, loadEducationProfile } from './memberEducation';
import { chatStorageKey, safeParse, safeSetItem } from './storage';

export type MemberAccount = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  /** Admin panelinde görüntüleme (yerel demo — üretimde kullanılmaz) */
  passwordPlain?: string;
  createdAt: string;
};

export type MemberAdminStats = {
  visitCount: number;
  searchCount: number;
  uploadCount: number;
  homeworkCount: number;
  topicCount: number;
  snapshotCount: number;
  lastVisitAt: string | null;
  lastSearchAt: string | null;
  avgNet: number | null;
  avgAccuracy: number | null;
  curriculumGrade: string | null;
  school: string | null;
};

export type MemberAdminDetail = {
  account: MemberAccount;
  activity: MemberActivity;
  education: ReturnType<typeof loadEducationProfile>;
  curriculum: ReturnType<typeof loadCurriculumState>;
  stats: MemberAdminStats;
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

export function getMemberByEmail(email: string): MemberAccount | null {
  const normalized = normalizeEmail(email);
  return loadRegistry().find((m) => m.email === normalized) ?? null;
}

export function getMemberStats(memberId: string): MemberAdminStats {
  const activity = loadMemberActivity(memberId);
  const education = loadEducationProfile(memberId);
  const latest = activity.snapshots[0];
  const visits = activity.visits;
  const searches = activity.searchHistory;

  return {
    visitCount: visits.length,
    searchCount: searches.length,
    uploadCount: activity.uploads.length,
    homeworkCount: activity.homework.length,
    topicCount: activity.topics.length,
    snapshotCount: activity.snapshots.length,
    lastVisitAt: visits[0]?.at ?? null,
    lastSearchAt: searches[0]?.at ?? null,
    avgNet: latest?.avgNet ?? null,
    avgAccuracy: latest?.avgAccuracy ?? null,
    curriculumGrade: education?.effectiveGrade ?? null,
    school: education?.school || null,
  };
}

export function getMemberAdminDetail(memberId: string): MemberAdminDetail | null {
  const account = getMemberById(memberId);
  if (!account) return null;
  return {
    account,
    activity: loadMemberActivity(memberId),
    education: loadEducationProfile(memberId),
    curriculum: loadCurriculumState(memberId),
    stats: getMemberStats(memberId),
  };
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
    passwordPlain: password,
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

/** Admin girişinde tam üye hizmetleri için bağlı üye oturumu açar veya oluşturur */
export function ensureMemberSessionForAdmin(admin: {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
}): MemberAccount {
  const existing = getMemberByEmail(admin.email);
  if (existing) {
    setMemberSession({ memberId: existing.id, email: existing.email });
    return existing;
  }

  const registry = loadRegistry();
  let phone = normalizePhone(admin.phone);
  if (phone.length < 10) phone = '5000000001';
  if (registry.some((m) => m.phone === phone)) {
    phone = `5${Date.now().toString().slice(-9)}`;
  }

  const member: MemberAccount = {
    id: `mbr_admin_${admin.id}`,
    email: normalizeEmail(admin.email),
    phone,
    firstName: admin.firstName,
    lastName: admin.lastName,
    passwordHash: admin.passwordHash,
    createdAt: admin.createdAt,
  };

  saveRegistry([...registry, member]);
  saveMemberActivity(member.id, emptyActivity());
  setMemberSession({ memberId: member.id, email: member.email });
  return member;
}

/** Oturumdaki üye, verilen admin e-postasıyla eşleşiyor mu */
export function isAdminLinkedMemberSession(adminEmail: string): boolean {
  const session = getMemberSession();
  if (!session) return false;
  const member = getMemberById(session.memberId);
  if (!member) return false;
  return normalizeEmail(member.email) === normalizeEmail(adminEmail);
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

/** Admin: üye bilgilerini ve isteğe bağlı şifreyi günceller */
export function adminUpdateMember(
  memberId: string,
  patch: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
  },
): { ok: true; member: MemberAccount } | { ok: false; error: string } {
  const registry = loadRegistry();
  const idx = registry.findIndex((m) => m.id === memberId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı.' };

  const current = registry[idx];
  const email = patch.email !== undefined ? normalizeEmail(patch.email) : current.email;
  const phone = patch.phone !== undefined ? normalizePhone(patch.phone) : current.phone;
  const firstName = patch.firstName !== undefined ? patch.firstName.trim() : current.firstName;
  const lastName = patch.lastName !== undefined ? patch.lastName.trim() : current.lastName;

  if (!email.includes('@')) return { ok: false, error: 'Geçerli e-posta gerekli.' };
  if (phone.length < 10) return { ok: false, error: 'Telefon en az 10 haneli olmalı.' };
  if (!firstName || !lastName) return { ok: false, error: 'Ad ve soyad zorunlu.' };

  if (registry.some((m) => m.id !== memberId && m.email === email)) {
    return { ok: false, error: 'Bu e-posta başka üyede kayıtlı.' };
  }
  if (registry.some((m) => m.id !== memberId && m.phone === phone)) {
    return { ok: false, error: 'Bu telefon başka üyede kayıtlı.' };
  }

  if (patch.password !== undefined && patch.password.length > 0 && patch.password.length < 6) {
    return { ok: false, error: 'Şifre en az 6 karakter olmalı.' };
  }

  const passwordChanged = Boolean(patch.password && patch.password.length > 0);
  const updated: MemberAccount = {
    ...current,
    email,
    phone,
    firstName,
    lastName,
    passwordHash: passwordChanged ? hashPassword(patch.password!) : current.passwordHash,
    passwordPlain: passwordChanged ? patch.password : current.passwordPlain,
  };

  registry[idx] = updated;
  saveRegistry(registry);

  const session = getMemberSession();
  if (session?.memberId === memberId) {
    setMemberSession({ memberId, email });
  }

  return { ok: true, member: updated };
}

function purgeMemberStorage(member: MemberAccount) {
  localStorage.removeItem(activityKey(member.id));
  localStorage.removeItem(`aikoc_member_education_${member.id}`);
  localStorage.removeItem(`aikoc_member_curriculum_${member.id}`);
  localStorage.removeItem(chatStorageKey(member.firstName));

  const requests = safeParse<{ memberId: string }[]>('aikoc_password_reset_requests', []).filter(
    (r) => r.memberId !== member.id,
  );
  safeSetItem('aikoc_password_reset_requests', requests);

  const tokens = safeParse<Record<string, { memberId: string }>>('aikoc_password_reset_tokens', {});
  const nextTokens: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tokens)) {
    if (v.memberId !== member.id) nextTokens[k] = v;
  }
  safeSetItem('aikoc_password_reset_tokens', nextTokens);
}

/** Admin: üyeyi ve tüm kayıtlarını kalıcı olarak siler */
export function adminDeleteMember(
  memberId: string,
): { ok: true } | { ok: false; error: string } {
  const registry = loadRegistry();
  const member = registry.find((m) => m.id === memberId);
  if (!member) return { ok: false, error: 'Üye bulunamadı.' };

  purgeMemberStorage(member);
  saveRegistry(registry.filter((m) => m.id !== memberId));

  const session = getMemberSession();
  if (session?.memberId === memberId) {
    setMemberSession(null);
  }

  return { ok: true };
}
