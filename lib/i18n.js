/** TR / EN arayüz metinleri */

export const i18n = {
  tr: {
    brand: 'ROTA AI',
    tagline: 'Yolunu bul, hedefe yapay zeka ile var',
    nav: {
      dashboard: 'Pano',
      lessons: 'Dersler',
      library: 'Kütüphane',
      exams: 'Sınavlar',
      chat: 'AI Sohbet',
      solver: 'Soru Çöz',
      profile: 'Profilim',
    },
    actions: { search: 'Ara', filter: 'Filtrele', save: 'Kaydet', cancel: 'İptal', refresh: 'Yenile' },
    theme: { light: 'Açık', dark: 'Koyu', auto: 'Otomatik' },
  },
  en: {
    brand: 'ROTA AI',
    tagline: 'Find your path, reach your goal with AI',
    nav: {
      dashboard: 'Dashboard',
      lessons: 'Lessons',
      library: 'Library',
      exams: 'Exams',
      chat: 'AI Chat',
      solver: 'Solve',
      profile: 'Profile',
    },
    actions: { search: 'Search', filter: 'Filter', save: 'Save', cancel: 'Cancel', refresh: 'Refresh' },
    theme: { light: 'Light', dark: 'Dark', auto: 'Auto' },
  },
};

export function getLang() {
  return localStorage.getItem('aikoc-lang') || 'tr';
}

export function setLang(lang) {
  localStorage.setItem('aikoc-lang', lang);
  document.documentElement.lang = lang;
}

export function t(key) {
  const lang = getLang();
  const parts = key.split('.');
  let node = i18n[lang];
  for (const p of parts) {
    node = node?.[p];
  }
  return node ?? key;
}
