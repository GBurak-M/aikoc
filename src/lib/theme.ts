export type ThemeColor = 'ocean' | 'indigo' | 'pink' | 'amber' | 'teal' | 'violet';

export type ThemeClasses = {
  bg: string;
  hover: string;
  text: string;
  textMuted: string;
  border: string;
  borderLight: string;
  borderDark: string;
  lightBg: string;
  lightBgMuted: string;
  darkText: string;
  gradient: string;
  ring: string;
  glow: string;
  chartStroke: string;
  chartFill: string;
  logoGradient: string;
  navShadow: string;
  pickerRing: string;
  headerChipLight: string;
  headerChipDark: string;
  navRail: string;
  navPillIdle: string;
  heroStrip: string;
  metricBorder: string;
  metricAccent: string;
  intelBorder: string;
  surfaceTint: string;
  surfacePanel: string;
  surfaceBorder: string;
  swatch: string;
  accentLine: string;
};

export const THEME_LABELS: Record<ThemeColor, string> = {
  ocean: 'Deniz Teması',
  indigo: 'İndigo Tema',
  pink: 'Pembe Tema',
  amber: 'Kehribar Tema',
  teal: 'Turkuaz Tema',
  violet: 'Mor Tema',
};

const THEME_MAP: Record<ThemeColor, ThemeClasses> = {
  ocean: {
    bg: 'bg-sky-600',
    hover: 'hover:bg-sky-700',
    text: 'text-sky-600',
    textMuted: 'text-sky-500',
    border: 'border-sky-500/30',
    borderLight: 'border-sky-200/70',
    borderDark: 'border-sky-900/40',
    lightBg: 'bg-sky-50',
    lightBgMuted: 'bg-sky-50/40',
    darkText: 'dark:text-cyan-400',
    gradient: 'from-cyan-400 via-sky-500 to-blue-700',
    ring: 'focus:ring-sky-500',
    glow: 'shadow-sky-500/25',
    chartStroke: '#0284c7',
    chartFill: '#0ea5e9',
    logoGradient: 'from-slate-900 via-sky-700 to-cyan-600 dark:from-white dark:via-cyan-200 dark:to-sky-300',
    navShadow: 'shadow-sky-500/25',
    pickerRing: 'ring-sky-400',
    headerChipLight: 'border-sky-200/80 hover:bg-sky-50/90',
    headerChipDark: 'border-sky-900/50',
    navRail: 'bg-sky-50/85 border-sky-200/70 dark:border-sky-900/40',
    navPillIdle: 'hover:text-sky-800 dark:hover:text-cyan-100',
    heroStrip: 'from-cyan-50/90 via-sky-50/70 to-blue-50/90 dark:from-slate-900/90 dark:via-sky-950/50 dark:to-cyan-950/40',
    metricBorder: 'border-sky-200/70 dark:border-sky-900/40',
    metricAccent: 'from-cyan-400 via-sky-500 to-blue-700',
    intelBorder: 'border-sky-200/60 dark:border-sky-900/40',
    surfaceTint: 'bg-sky-50/40',
    surfacePanel: 'border-sky-100',
    surfaceBorder: 'border-sky-50',
    swatch: 'bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700',
    accentLine: 'border-l-sky-500',
  },
  indigo: {
    bg: 'bg-indigo-600',
    hover: 'hover:bg-indigo-700',
    text: 'text-indigo-600',
    textMuted: 'text-indigo-500',
    border: 'border-indigo-500/30',
    borderLight: 'border-indigo-200/70',
    borderDark: 'border-indigo-900/40',
    lightBg: 'bg-indigo-50',
    lightBgMuted: 'bg-indigo-50/40',
    darkText: 'dark:text-indigo-400',
    gradient: 'from-indigo-500 via-violet-500 to-purple-600',
    ring: 'focus:ring-indigo-500',
    glow: 'shadow-indigo-500/20',
    chartStroke: '#4f46e5',
    chartFill: '#4f46e5',
    logoGradient: 'from-slate-900 via-indigo-800 to-violet-700 dark:from-white dark:via-indigo-200 dark:to-violet-200',
    navShadow: 'shadow-indigo-500/25',
    pickerRing: 'ring-indigo-400',
    headerChipLight: 'border-indigo-200/80 hover:bg-indigo-50/90',
    headerChipDark: 'border-indigo-900/50',
    navRail: 'bg-indigo-50/85 border-indigo-200/70 dark:border-indigo-900/40',
    navPillIdle: 'hover:text-indigo-800 dark:hover:text-indigo-200',
    heroStrip: 'from-indigo-50/90 via-violet-50/70 to-purple-50/90 dark:from-slate-900/90 dark:via-indigo-950/50 dark:to-violet-950/40',
    metricBorder: 'border-indigo-200/70 dark:border-indigo-900/40',
    metricAccent: 'from-indigo-400 via-violet-500 to-purple-700',
    intelBorder: 'border-indigo-200/60 dark:border-indigo-900/40',
    surfaceTint: 'bg-indigo-50/40',
    surfacePanel: 'border-indigo-100',
    surfaceBorder: 'border-indigo-50',
    swatch: 'bg-indigo-600',
    accentLine: 'border-l-indigo-500',
  },
  pink: {
    bg: 'bg-pink-600',
    hover: 'hover:bg-pink-700',
    text: 'text-pink-600',
    textMuted: 'text-pink-500',
    border: 'border-pink-500/30',
    borderLight: 'border-pink-200/70',
    borderDark: 'border-pink-900/40',
    lightBg: 'bg-pink-50',
    lightBgMuted: 'bg-pink-50/40',
    darkText: 'dark:text-pink-400',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
    ring: 'focus:ring-pink-500',
    glow: 'shadow-pink-500/20',
    chartStroke: '#db2777',
    chartFill: '#db2777',
    logoGradient: 'from-slate-900 via-pink-700 to-rose-600 dark:from-white dark:via-pink-200 dark:to-rose-200',
    navShadow: 'shadow-pink-500/25',
    pickerRing: 'ring-pink-400',
    headerChipLight: 'border-pink-200/80 hover:bg-pink-50/90',
    headerChipDark: 'border-pink-900/50',
    navRail: 'bg-pink-50/85 border-pink-200/70 dark:border-pink-900/40',
    navPillIdle: 'hover:text-pink-800 dark:hover:text-pink-200',
    heroStrip: 'from-pink-50/90 via-rose-50/70 to-fuchsia-50/90 dark:from-slate-900/90 dark:via-pink-950/50 dark:to-rose-950/40',
    metricBorder: 'border-pink-200/70 dark:border-pink-900/40',
    metricAccent: 'from-pink-400 via-rose-500 to-fuchsia-700',
    intelBorder: 'border-pink-200/60 dark:border-pink-900/40',
    surfaceTint: 'bg-pink-50/40',
    surfacePanel: 'border-pink-100',
    surfaceBorder: 'border-pink-50',
    swatch: 'bg-pink-600',
    accentLine: 'border-l-pink-500',
  },
  amber: {
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-600',
    text: 'text-amber-600',
    textMuted: 'text-amber-500',
    border: 'border-amber-500/30',
    borderLight: 'border-amber-200/70',
    borderDark: 'border-amber-900/40',
    lightBg: 'bg-amber-50',
    lightBgMuted: 'bg-amber-50/40',
    darkText: 'dark:text-amber-400',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    ring: 'focus:ring-amber-500',
    glow: 'shadow-amber-500/20',
    chartStroke: '#f59e0b',
    chartFill: '#f59e0b',
    logoGradient: 'from-slate-900 via-amber-700 to-orange-600 dark:from-white dark:via-amber-200 dark:to-orange-200',
    navShadow: 'shadow-amber-500/25',
    pickerRing: 'ring-amber-400',
    headerChipLight: 'border-amber-200/80 hover:bg-amber-50/90',
    headerChipDark: 'border-amber-900/50',
    navRail: 'bg-amber-50/85 border-amber-200/70 dark:border-amber-900/40',
    navPillIdle: 'hover:text-amber-800 dark:hover:text-amber-200',
    heroStrip: 'from-amber-50/90 via-orange-50/70 to-yellow-50/90 dark:from-slate-900/90 dark:via-amber-950/50 dark:to-orange-950/40',
    metricBorder: 'border-amber-200/70 dark:border-amber-900/40',
    metricAccent: 'from-amber-400 via-orange-500 to-red-600',
    intelBorder: 'border-amber-200/60 dark:border-amber-900/40',
    surfaceTint: 'bg-amber-50/40',
    surfacePanel: 'border-amber-100',
    surfaceBorder: 'border-amber-50',
    swatch: 'bg-amber-500',
    accentLine: 'border-l-amber-500',
  },
  teal: {
    bg: 'bg-teal-600',
    hover: 'hover:bg-teal-700',
    text: 'text-teal-600',
    textMuted: 'text-teal-500',
    border: 'border-teal-500/30',
    borderLight: 'border-teal-200/70',
    borderDark: 'border-teal-900/40',
    lightBg: 'bg-teal-50',
    lightBgMuted: 'bg-teal-50/40',
    darkText: 'dark:text-teal-400',
    gradient: 'from-teal-500 via-emerald-500 to-cyan-600',
    ring: 'focus:ring-teal-500',
    glow: 'shadow-teal-500/20',
    chartStroke: '#0d9488',
    chartFill: '#0d9488',
    logoGradient: 'from-slate-900 via-teal-700 to-emerald-600 dark:from-white dark:via-teal-200 dark:to-emerald-200',
    navShadow: 'shadow-teal-500/25',
    pickerRing: 'ring-teal-400',
    headerChipLight: 'border-teal-200/80 hover:bg-teal-50/90',
    headerChipDark: 'border-teal-900/50',
    navRail: 'bg-teal-50/85 border-teal-200/70 dark:border-teal-900/40',
    navPillIdle: 'hover:text-teal-800 dark:hover:text-teal-200',
    heroStrip: 'from-teal-50/90 via-emerald-50/70 to-cyan-50/90 dark:from-slate-900/90 dark:via-teal-950/50 dark:to-emerald-950/40',
    metricBorder: 'border-teal-200/70 dark:border-teal-900/40',
    metricAccent: 'from-teal-400 via-emerald-500 to-cyan-700',
    intelBorder: 'border-teal-200/60 dark:border-teal-900/40',
    surfaceTint: 'bg-teal-50/40',
    surfacePanel: 'border-teal-100',
    surfaceBorder: 'border-teal-50',
    swatch: 'bg-teal-600',
    accentLine: 'border-l-teal-500',
  },
  violet: {
    bg: 'bg-violet-600',
    hover: 'hover:bg-violet-700',
    text: 'text-violet-600',
    textMuted: 'text-violet-500',
    border: 'border-violet-500/30',
    borderLight: 'border-violet-200/70',
    borderDark: 'border-violet-900/40',
    lightBg: 'bg-violet-50',
    lightBgMuted: 'bg-violet-50/40',
    darkText: 'dark:text-violet-400',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    ring: 'focus:ring-violet-500',
    glow: 'shadow-violet-500/20',
    chartStroke: '#7c3aed',
    chartFill: '#7c3aed',
    logoGradient: 'from-slate-900 via-violet-700 to-purple-600 dark:from-white dark:via-violet-200 dark:to-purple-200',
    navShadow: 'shadow-violet-500/25',
    pickerRing: 'ring-violet-400',
    headerChipLight: 'border-violet-200/80 hover:bg-violet-50/90',
    headerChipDark: 'border-violet-900/50',
    navRail: 'bg-violet-50/85 border-violet-200/70 dark:border-violet-900/40',
    navPillIdle: 'hover:text-violet-800 dark:hover:text-violet-200',
    heroStrip: 'from-violet-50/90 via-purple-50/70 to-fuchsia-50/90 dark:from-slate-900/90 dark:via-violet-950/50 dark:to-purple-950/40',
    metricBorder: 'border-violet-200/70 dark:border-violet-900/40',
    metricAccent: 'from-violet-400 via-purple-500 to-fuchsia-700',
    intelBorder: 'border-violet-200/60 dark:border-violet-900/40',
    surfaceTint: 'bg-violet-50/40',
    surfacePanel: 'border-violet-100',
    surfaceBorder: 'border-violet-50',
    swatch: 'bg-violet-600',
    accentLine: 'border-l-violet-500',
  },
};

export const THEME_OPTIONS: ThemeColor[] = ['ocean', 'indigo', 'pink', 'amber', 'teal', 'violet'];

export function getThemeClasses(themeColor: string): ThemeClasses {
  return THEME_MAP[themeColor as ThemeColor] ?? THEME_MAP.ocean;
}

export function isThemeColor(value: string): value is ThemeColor {
  return THEME_OPTIONS.includes(value as ThemeColor);
}

type MeshPalette = {
  base: string;
  image: string;
  wave1: string;
  wave2: string;
  darkBase: string;
  darkImage: string;
  darkWave1: string;
  darkWave2: string;
  scrollThumb: string;
};

const MESH_PALETTES: Record<ThemeColor, MeshPalette> = {
  ocean: {
    base: '#e0f7fa',
    image: 'linear-gradient(180deg, #ecfeff 0%, #cffafe 22%, #a5f3fc 48%, #7dd3fc 72%, #38bdf8 100%), radial-gradient(ellipse 90% 55% at 15% -5%, rgba(34, 211, 238, 0.35) 0%, transparent 58%), radial-gradient(ellipse 70% 45% at 88% 8%, rgba(14, 165, 233, 0.28) 0%, transparent 52%)',
    wave1: '#22d3ee',
    wave2: '#0284c7',
    darkBase: '#082f49',
    darkImage: 'linear-gradient(180deg, #0c4a6e 0%, #075985 30%, #0369a1 58%, #0284c7 82%, #0e7490 100%), radial-gradient(ellipse 90% 55% at 15% -5%, rgba(34, 211, 238, 0.18) 0%, transparent 58%)',
    darkWave1: '#38bdf8',
    darkWave2: '#0ea5e9',
    scrollThumb: 'rgb(56 189 248 / 0.45)',
  },
  indigo: {
    base: '#eef2ff',
    image: 'linear-gradient(180deg, #eef2ff 0%, #e0e7ff 30%, #c7d2fe 60%, #a5b4fc 100%), radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99, 102, 241, 0.25) 0%, transparent 55%)',
    wave1: '#818cf8',
    wave2: '#4f46e5',
    darkBase: '#1e1b4b',
    darkImage: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #3730a3 70%, #4338ca 100%), radial-gradient(ellipse 80% 50% at 20% -10%, rgba(99, 102, 241, 0.2) 0%, transparent 55%)',
    darkWave1: '#6366f1',
    darkWave2: '#4f46e5',
    scrollThumb: 'rgb(99 102 241 / 0.45)',
  },
  pink: {
    base: '#fdf2f8',
    image: 'linear-gradient(180deg, #fdf2f8 0%, #fce7f3 30%, #fbcfe8 60%, #f9a8d4 100%), radial-gradient(ellipse 80% 50% at 80% 0%, rgba(236, 72, 153, 0.2) 0%, transparent 55%)',
    wave1: '#f472b6',
    wave2: '#db2777',
    darkBase: '#500724',
    darkImage: 'linear-gradient(180deg, #500724 0%, #831843 40%, #9d174d 70%, #be185d 100%)',
    darkWave1: '#ec4899',
    darkWave2: '#db2777',
    scrollThumb: 'rgb(236 72 153 / 0.45)',
  },
  amber: {
    base: '#fffbeb',
    image: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 30%, #fde68a 60%, #fcd34d 100%), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245, 158, 11, 0.2) 0%, transparent 55%)',
    wave1: '#fbbf24',
    wave2: '#d97706',
    darkBase: '#451a03',
    darkImage: 'linear-gradient(180deg, #451a03 0%, #78350f 40%, #92400e 70%, #b45309 100%)',
    darkWave1: '#f59e0b',
    darkWave2: '#d97706',
    scrollThumb: 'rgb(245 158 11 / 0.45)',
  },
  teal: {
    base: '#f0fdfa',
    image: 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 30%, #99f6e4 60%, #5eead4 100%), radial-gradient(ellipse 80% 50% at 30% 0%, rgba(20, 184, 166, 0.2) 0%, transparent 55%)',
    wave1: '#2dd4bf',
    wave2: '#0d9488',
    darkBase: '#042f2e',
    darkImage: 'linear-gradient(180deg, #042f2e 0%, #134e4a 40%, #115e59 70%, #0f766e 100%)',
    darkWave1: '#14b8a6',
    darkWave2: '#0d9488',
    scrollThumb: 'rgb(20 184 166 / 0.45)',
  },
  violet: {
    base: '#f5f3ff',
    image: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 30%, #ddd6fe 60%, #c4b5fd 100%), radial-gradient(ellipse 80% 50% at 70% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 55%)',
    wave1: '#a78bfa',
    wave2: '#7c3aed',
    darkBase: '#2e1065',
    darkImage: 'linear-gradient(180deg, #2e1065 0%, #4c1d95 40%, #5b21b6 70%, #6d28d9 100%)',
    darkWave1: '#8b5cf6',
    darkWave2: '#7c3aed',
    scrollThumb: 'rgb(139 92 246 / 0.45)',
  },
};

function waveSvg(color: string, path: string): string {
  const fill = encodeURIComponent(color);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 140' preserveAspectRatio='none'%3E%3Cpath fill='${fill}' fill-opacity='0.5' d='${path}'/%3E%3C/svg%3E")`;
}

const WAVE_PATH_A = 'M0,70 C150,120 300,20 450,70 C600,120 750,20 900,70 C1050,120 1200,20 1200,70 L1200,140 L0,140 Z';
const WAVE_PATH_B = 'M0,90 C200,40 400,110 600,70 C800,30 1000,100 1200,60 L1200,140 L0,140 Z';

export function getThemeSurfaceStyle(themeColor: string, darkMode: boolean): Record<string, string> {
  const palette = MESH_PALETTES[themeColor as ThemeColor] ?? MESH_PALETTES.ocean;
  const wave1 = darkMode ? palette.darkWave1 : palette.wave1;
  const wave2 = darkMode ? palette.darkWave2 : palette.wave2;

  return {
    ['--mesh-base' as string]: darkMode ? palette.darkBase : palette.base,
    ['--mesh-image' as string]: darkMode ? palette.darkImage : palette.image,
    ['--wave-image-a' as string]: waveSvg(wave1, WAVE_PATH_A),
    ['--wave-image-b' as string]: waveSvg(wave2, WAVE_PATH_B),
    ['--scroll-thumb' as string]: palette.scrollThumb,
  };
}
