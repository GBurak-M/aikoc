import type { LibraryCategory } from '../data/libraryCatalog';
import type { ExamArchiveType } from './examArchive/types';

export type WeatherVisual = {
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' | 'storm';
  tileBg: string;
  accent: string;
};

export const LIBRARY_COVER: Record<
  LibraryCategory,
  { gradient: string; glyph: string; ring: string }
> = {
  bilimsel_makale: {
    gradient: 'from-sky-400 via-blue-600 to-indigo-800',
    glyph: 'M',
    ring: 'ring-blue-400/30',
  },
  ders_kitabi: {
    gradient: 'from-violet-400 via-purple-600 to-fuchsia-800',
    glyph: 'K',
    ring: 'ring-violet-400/30',
  },
  roman: {
    gradient: 'from-rose-400 via-pink-600 to-red-800',
    glyph: 'R',
    ring: 'ring-rose-400/30',
  },
  harita: {
    gradient: 'from-emerald-400 via-teal-600 to-green-800',
    glyph: 'H',
    ring: 'ring-emerald-400/30',
  },
  ansiklopedi: {
    gradient: 'from-amber-400 via-orange-500 to-yellow-700',
    glyph: 'A',
    ring: 'ring-amber-400/30',
  },
  bilimsel_yayin: {
    gradient: 'from-cyan-400 via-sky-500 to-blue-700',
    glyph: 'Y',
    ring: 'ring-cyan-400/30',
  },
  dini_yayin: {
    gradient: 'from-teal-400 via-emerald-600 to-cyan-900',
    glyph: 'D',
    ring: 'ring-teal-400/30',
  },
  dini_kitap: {
    gradient: 'from-indigo-400 via-blue-700 to-slate-800',
    glyph: 'İ',
    ring: 'ring-indigo-400/30',
  },
};

export const EXAM_TYPE_GRADIENT: Partial<Record<ExamArchiveType, string>> = {
  LGS: 'from-emerald-500 to-teal-700',
  SBS: 'from-lime-500 to-green-700',
  TYT: 'from-sky-500 to-blue-700',
  AYT: 'from-violet-500 to-purple-800',
  YKS: 'from-indigo-500 to-violet-800',
  YDT: 'from-rose-500 to-pink-700',
  KPSS: 'from-amber-500 to-orange-700',
  KPSS_OABT: 'from-yellow-500 to-amber-700',
  ALES: 'from-cyan-500 to-teal-700',
  YDS: 'from-fuchsia-500 to-purple-700',
  DGS: 'from-orange-500 to-red-700',
  MSÜ: 'from-slate-500 to-slate-800',
};

export function weatherVisual(label: string): WeatherVisual {
  const l = label.toLowerCase();
  if (/yağmur|sağanak|çisenti|drizzle/.test(l)) {
    return { icon: 'rain', tileBg: 'bg-sky-500/10 dark:bg-sky-950/40', accent: 'text-sky-500' };
  }
  if (/kar|snow/.test(l)) {
    return { icon: 'snow', tileBg: 'bg-slate-200/50 dark:bg-slate-700/40', accent: 'text-slate-400' };
  }
  if (/fırtına|gök.gür|thunder|storm/.test(l)) {
    return { icon: 'storm', tileBg: 'bg-violet-500/10 dark:bg-violet-950/40', accent: 'text-violet-500' };
  }
  if (/parçalı|bulut|cloud|kapalı/.test(l)) {
    return { icon: 'cloud', tileBg: 'bg-slate-100 dark:bg-slate-800/60', accent: 'text-slate-500' };
  }
  if (/rüzgar|wind/.test(l)) {
    return { icon: 'wind', tileBg: 'bg-amber-500/10 dark:bg-amber-950/30', accent: 'text-amber-600' };
  }
  return { icon: 'sun', tileBg: 'bg-amber-500/10 dark:bg-amber-950/30', accent: 'text-amber-500' };
}

export function avatarGradient(seed: string): string {
  const palettes = [
    'from-sky-400 to-blue-600',
    'from-violet-400 to-purple-700',
    'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % palettes.length;
  return palettes[hash];
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
