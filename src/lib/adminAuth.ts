import { BOOTSTRAP_ADMINS } from '../config/site';
import { safeParse, safeSetItem } from './storage';

export type AdminAccount = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: string;
  createdBy?: string;
  isBootstrap?: boolean;
};

export type AdminSession = {
  adminId: string;
  email: string;
};

const REGISTRY_KEY = 'aikoc_admin_registry';
const SESSION_KEY = 'aikoc_admin_session';
const BOOTSTRAP_DONE_KEY = 'aikoc_admin_bootstrap_done';

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

export function loadAdminRegistry(): AdminAccount[] {
  return safeParse<AdminAccount[]>(REGISTRY_KEY, []);
}

function saveAdminRegistry(accounts: AdminAccount[]) {
  safeSetItem(REGISTRY_KEY, accounts);
}

export function getAdminSession(): AdminSession | null {
  return safeParse<AdminSession | null>(SESSION_KEY, null);
}

export function setAdminSession(session: AdminSession | null) {
  if (session) safeSetItem(SESSION_KEY, session);
  else localStorage.removeItem(SESSION_KEY);
}

export function getAdminById(id: string): AdminAccount | null {
  return loadAdminRegistry().find((a) => a.id === id) ?? null;
}

export function getLoggedInAdmin(): AdminAccount | null {
  const session = getAdminSession();
  if (!session) return null;
  return getAdminById(session.adminId);
}

export function isAdminLoggedIn(): boolean {
  return getLoggedInAdmin() !== null;
}

/** Giriş e-postasının kayıtlı bir admin hesabına ait olup olmadığını kontrol eder */
export function isAdminEmail(email: string): boolean {
  ensureBootstrapAdmins();
  const normalized = normalizeEmail(email);
  return loadAdminRegistry().some((a) => a.email === normalized);
}

/** İlk kurulumda özel bootstrap admin hesaplarını oluşturur */
export function ensureBootstrapAdmins(): void {
  if (safeParse<boolean>(BOOTSTRAP_DONE_KEY, false)) return;

  const registry = loadAdminRegistry();
  const existingEmails = new Set(registry.map((a) => a.email));

  for (const boot of BOOTSTRAP_ADMINS) {
    const email = normalizeEmail(boot.email);
    if (existingEmails.has(email)) continue;
    registry.push({
      id: `adm_boot_${email.replace(/[^a-z0-9]/g, '_')}`,
      email,
      phone: normalizePhone(boot.phone),
      firstName: boot.firstName,
      lastName: boot.lastName,
      passwordHash: hashPassword(boot.password),
      createdAt: new Date().toISOString(),
      isBootstrap: true,
    });
  }

  saveAdminRegistry(registry);
  safeSetItem(BOOTSTRAP_DONE_KEY, true);
}

export function loginAdmin(
  email: string,
  password: string,
): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  ensureBootstrapAdmins();
  const normalized = normalizeEmail(email);
  const admin = loadAdminRegistry().find((a) => a.email === normalized);
  if (!admin) return { ok: false, error: 'Admin e-posta veya şifre hatalı.' };
  if (admin.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Admin e-posta veya şifre hatalı.' };
  }
  setAdminSession({ adminId: admin.id, email: admin.email });
  return { ok: true, admin };
}

export function logoutAdmin() {
  setAdminSession(null);
}

export function addAdminAccount(
  creatorId: string,
  input: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
  },
): { ok: true; admin: AdminAccount } | { ok: false; error: string } {
  const creator = getAdminById(creatorId);
  if (!creator) return { ok: false, error: 'Admin oturumu gerekli.' };

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const password = input.password;

  if (!email.includes('@')) return { ok: false, error: 'Geçerli bir e-posta girin.' };
  if (phone.length < 10) return { ok: false, error: 'Telefon en az 10 haneli olmalı.' };
  if (!firstName || !lastName) return { ok: false, error: 'Ad ve soyad zorunlu.' };
  if (password.length < 8) return { ok: false, error: 'Admin şifresi en az 8 karakter olmalı.' };

  const registry = loadAdminRegistry();
  if (registry.some((a) => a.email === email)) {
    return { ok: false, error: 'Bu e-posta zaten admin olarak kayıtlı.' };
  }

  const admin: AdminAccount = {
    id: `adm_${Date.now()}`,
    email,
    phone,
    firstName,
    lastName,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    createdBy: creatorId,
  };

  saveAdminRegistry([...registry, admin]);
  return { ok: true, admin };
}

export function removeAdminAccount(
  actorId: string,
  targetId: string,
): { ok: true } | { ok: false; error: string } {
  if (actorId === targetId) return { ok: false, error: 'Kendi admin hesabınızı silemezsiniz.' };
  const target = getAdminById(targetId);
  if (!target) return { ok: false, error: 'Admin bulunamadı.' };
  if (target.isBootstrap) return { ok: false, error: 'Bootstrap admin hesabı silinemez.' };

  const registry = loadAdminRegistry().filter((a) => a.id !== targetId);
  saveAdminRegistry(registry);
  return { ok: true };
}

export function listAdminAccounts(): AdminAccount[] {
  return loadAdminRegistry();
}

export function getAdminDisplayName(admin: AdminAccount) {
  return `${admin.firstName} ${admin.lastName}`;
}

export function changeAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): { ok: true } | { ok: false; error: string } {
  const admin = getAdminById(adminId);
  if (!admin) return { ok: false, error: 'Admin bulunamadı.' };
  if (admin.passwordHash !== hashPassword(currentPassword)) {
    return { ok: false, error: 'Mevcut şifre hatalı.' };
  }
  if (newPassword.length < 8) return { ok: false, error: 'Yeni şifre en az 8 karakter olmalı.' };

  const registry = loadAdminRegistry().map((a) =>
    a.id === adminId ? { ...a, passwordHash: hashPassword(newPassword) } : a,
  );
  saveAdminRegistry(registry);
  return { ok: true };
}
