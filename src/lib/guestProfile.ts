export type UserProfile = {
  name: string;
  field: string;
  targetUniv: string;
  targetDept: string;
  dailyTargetHours: string;
};

export const GUEST_PROFILE: UserProfile = {
  name: 'Misafir',
  field: 'Sayısal',
  targetUniv: 'Belirtilmedi',
  targetDept: 'Belirtilmedi',
  dailyTargetHours: '4',
};

/** Misafir sohbet geçmişi anahtarı — kişisel isim kullanılmaz */
export const GUEST_CHAT_KEY = 'misafir';

export function isGuestProfile(profile: UserProfile): boolean {
  return profile.name === GUEST_PROFILE.name && profile.targetUniv === GUEST_PROFILE.targetUniv;
}

/** Kişisel profil yalnızca üyelere uygulanır */
export function getEffectiveProfile(isMember: boolean, stored: UserProfile): UserProfile {
  return isMember ? stored : { ...GUEST_PROFILE };
}

export function loadUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('guidance_core_profile');
    if (!saved) return { ...GUEST_PROFILE };
    const parsed = JSON.parse(saved) as UserProfile;
    if (parsed?.name) return parsed;
  } catch {
    localStorage.removeItem('guidance_core_profile');
  }
  return { ...GUEST_PROFILE };
}
