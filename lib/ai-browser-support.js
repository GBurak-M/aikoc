/** Ücretsiz tarayıcı Gemini Nano (window.ai / LanguageModel) */

export const AI_SUPPORTED_BROWSERS = [
  'Google Chrome',
  'Microsoft Edge',
  'Brave',
];

/** "Google Chrome, Microsoft Edge ve Brave" */
export function formatSupportedBrowsersList() {
  const items = [...AI_SUPPORTED_BROWSERS];
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} ve ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ve ${items[items.length - 1]}`;
}

export function getFlagsPageUrl() {
  if (typeof navigator === 'undefined') return 'chrome://flags';
  const ua = navigator.userAgent || '';
  if (/Brave/i.test(ua) || navigator.brave) return 'brave://flags';
  if (/Edg\//.test(ua)) return 'edge://flags';
  return 'chrome://flags';
}

export const BRAVE_FLAG_STEPS = [
  'Adres çubuğuna brave://flags yaz ve Enter’a bas.',
  '“Optimization Guide On Device Model” aramasını Etkinleştirilmiş (Enabled) yap.',
  '“Prompt API for Gemini Nano” aramasını Etkinleştirilmiş yap.',
  'Brave’i tamamen kapatıp yeniden aç (tüm pencereler).',
  'İlk kullanımda Gemini Nano modeli birkaç dakika indirilebilir; bekleyip tekrar dene.',
];

export const BUILTIN_AI_HINT = [
  `Tam yapay zeka yanıtı için ${formatSupportedBrowsersList()} kullan ve tarayıcıda ücretsiz Gemini Nano’yu aç.`,
  '',
  'Brave ayarı:',
  ...BRAVE_FLAG_STEPS.map((s, i) => `${i + 1}. ${s}`),
  '',
  'Telefondaki Gemini uygulaması veya Google araması bu siteye bağlanmaz; model doğrudan tarayıcında çalışır, API anahtarı gerekmez.',
].join('\n');

export const BUILTIN_AI_STATUS_LABEL = 'Gemini Nano (ücretsiz, cihazda)';

export const BUILTIN_AI_SHORT_HINT =
  `${formatSupportedBrowsersList()} ile Google girişi sonrası ücretsiz Gemini Nano kullanılır; API anahtarı gerekmez.`;
