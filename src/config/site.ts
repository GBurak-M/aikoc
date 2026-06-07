/** Site markası — domain, sohbet ve meta için birleşik ad */
export const SITE_NAME = 'aikoc';

/** Görsel wordmark parçaları: ai + logo + koc */
export const SITE_BRAND_PREFIX = 'ai';
export const SITE_BRAND_SUFFIX = 'koc';
export const SITE_TAGLINE = 'Ulusal Sınav AI Koçu · LGS · YKS · KPSS · ALES';
export const SITE_DESCRIPTION =
  'aikoc — LGS, YKS, KPSS, ALES ve tüm ulusal sınavlarda kişisel AI koçluk, deneme takibi, kütüphane ve akıllı çalışma merkezi';
export const SITE_DOMAIN_HINT = 'aikoc.com';

/** Kütüphane editör/admin onay paneli giriş kodu (yerel demo) */
export const LIBRARY_EDITOR_PIN = 'aikoc2026';

/** Özel bootstrap admin kimlikleri — ilk kurulumda otomatik oluşturulur */
export const BOOTSTRAP_ADMINS = [
  {
    email: 'admin@aikoc.com',
    phone: '5000000001',
    firstName: 'Merkez',
    lastName: 'Admin',
    password: 'AikocAdmin!2026',
  },
] as const;
