import { detectExamFromText } from '../data/nationalExams';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/** Koç sohbet niyeti — localAi ve öğrenme modülü ortak kullanır */
export function detectCoachIntent(message: string): string {
  const m = normalize(message);
  if (detectExamFromText(m) || /sinav|sinavi|hazirlik|osym|sinava nasil/.test(m)) return 'national_exam';
  if (/trafik|aktivite|kullanim|ne yaptim|site.*takip|davranis/.test(m)) return 'traffic';
  if (/hava|weather|yagmur|sicak|derece/.test(m)) return 'weather';
  if (/namaz|ezan|imsak|vakit/.test(m)) return 'prayer';
  if (/takvim|bayram|tatil/.test(m)) return 'calendar';
  if (/bilim|arastirma|makale|openalex|yayin/.test(m)) return 'science_news';
  if (/gramer|grammar|dil bilgisi|ingilizce kelime|turkce kelime|ceviri|çeviri|translate|tense|zaman|article|baglac|bağlaç/.test(m)) return 'language';
  if (/motivasyon|morali|vazgec|umutsuz|yoruldum|stres|kayg/.test(m)) return 'motivation';
  if (/plan|program|hafta|nasil calis/.test(m)) return 'plan';
  if (/matematik|mat\b|turev|integral|logaritma/.test(m)) return 'math';
  if (/turkce|paragraf|edebiyat/.test(m)) return 'turkish';
  if (/fen|fizik|kimya|biyoloji/.test(m)) return 'science';
  if (/sosyal|tarih|cografya|felsefe/.test(m)) return 'social';
  if (/net|deneme|ayt|tyt|siralama/.test(m)) return 'stats';
  if (/hedef|universite|bolum/.test(m)) return 'goal';
  if (/kutuphane|kitap|makale|okuma/.test(m)) return 'library';
  if (/yapay zeka|ai\b|robot|teknoloji|bilgisayar|yazilim/.test(m)) return 'machine';
  if (/insan|duygu|iliski|arkadas|aile|psikoloji/.test(m)) return 'human';
  if (/toplum|sosyal adalet|ekonomi|politika|medya/.test(m)) return 'society';
  return 'general';
}
