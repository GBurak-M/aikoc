import type { ExamPaper } from './examArchive/types';
import type { SubjectScore } from './examArchive/stats';
import type { CoachContext } from './localAi';
import { loadLearningProfile } from './userLearning';

const HUMOR_WRONG: ((subject: string) => string)[] = [
  (s) => `${s} bugün sana trip attı ama sen daha güçlüsün — bir sonraki soruda kapak! 😄`,
  (s) => `Bu ${s} sorusu "beni seçme" dedi; sen yine de seçtin. Şimdi ders çıkaralım!`,
  (s) => `${s}: Yanlış cevap da bir cevaptır; doğru olan öğrenmek! Bir daha görürsen tanırsın.`,
  (s) => `ÖSYM bu ${s} sorusunu gizlice zorlaştırmış; sen fark ettin, bu da başarı!`,
  (s) => `${s} konusu "dur bir dakika" dedi. Dur, nefes al, devam!`,
  (s) => `Yanlış yaptın diye moral bozma; ${s} seninle henüz tanışma aşamasında.`,
];

const HUMOR_CORRECT: ((subject: string) => string)[] = [
  (s) => `${s} seninle gurur duyuyor! 🔥`,
  (s) => `İşte bu! ${s} cebinde.`,
  (s) => `${s} sorusu: "Bu öğrenci benim."`,
];

const MORALE_HIGH = [
  'Formun mükemmel; bu tempo seni hedefe taşır. Bugün de aynı enerji!',
  'Her doğru cevap bir tuğla; hedefin duvarı güçleniyor.',
  'Rakamlar senin lehine dönüyor — devam et, vazgeçme yok!',
];

const MORALE_SUPPORT = [
  'Zor bir soru serisi normal; önemli olan vazgeçmemek. Bir mola, sonra devam!',
  'Bugün zor geçiyorsa yarın daha iyi olur — YKS bir maraton, sprint değil.',
  'Yanlışlar öğrenmenin parçası; her hata bir sonraki doğruya yaklaştırır.',
  'Kendine güven: daha önce de zorlandığın konuları çözdün, bunu da çözersin.',
];

export function getHumorousWrongReply(subject: string): string {
  const idx = Math.floor(Math.random() * HUMOR_WRONG.length);
  return HUMOR_WRONG[idx](subject);
}

export function getPositiveCorrectReply(subject: string): string {
  const idx = Math.floor(Math.random() * HUMOR_CORRECT.length);
  return HUMOR_CORRECT[idx](subject);
}

export function getMoraleMessage(): string {
  const profile = loadLearningProfile();
  const pool = profile.moraleLevel === 'destek' ? MORALE_SUPPORT : MORALE_HIGH;
  return pool[Math.floor(Math.random() * pool.length)];
}

const CHAT_HUMOR_LINES: ((topic: string) => string)[] = [
  (t) => `\n\n😄 Mini not: ${t} konusunda biraz sabır — öğrenmek maraton, sprint değil. Sen koşuyorsun, ben tribünden alkışlıyorum.`,
  (t) => `\n\n😏 Şaka bir yana: ${t} ile aranız bugün biraz gergin olsa da, yarın aynı soruya gülümseyerek bakacaksın.`,
  (t) => `\n\n🎯 Komik gerçek: Beyin ${t} öğrenirken "bu ne?" diyor; üçüncü tekrarda "aa, buymuş" diyor. Sen üçüncü tekrardasın sayılır.`,
  (t) => `\n\n📚 Alaycı ama dürüst: ${t} kitapları sessiz konuşur; sen dinlersen net konuşur.`,
];

/** Sohbet konusunu pekiştiren hafif mizah — ~%35 olasılıkla eklenir */
export function maybeAddChatHumor(topic: string): string {
  if (Math.random() > 0.35) return '';
  const idx = Math.floor(Math.random() * CHAT_HUMOR_LINES.length);
  return CHAT_HUMOR_LINES[idx](topic);
}

export function generateArchiveFinishCoachMessage(
  paper: ExamPaper,
  correct: number,
  total: number,
  bySubject: Record<string, SubjectScore>,
  profileName: string,
): string {
  const pct = Math.round((correct / total) * 100);
  const weak = Object.entries(bySubject)
    .filter(([, s]) => s.accuracy < 60 && s.total >= 2)
    .map(([sub, s]) => `${sub} %${s.accuracy}`)
    .join(', ');
  const strong = Object.entries(bySubject)
    .filter(([, s]) => s.accuracy >= 75)
    .map(([sub, s]) => `${sub} %${s.accuracy}`)
    .join(', ');

  return `${profileName}, "${paper.title}" testini tamamladın!

📊 Sonuç: ${correct}/${total} (%${pct})
${strong ? `💪 Güçlü alanlar: ${strong}` : ''}
${weak ? `🎯 Öncelik: ${weak} — bu alanlara haftada 2 ekstra blok ayır.` : 'Tüm alanlar dengeli; deneme tekrarıyla hızını artır.'}

${getMoraleMessage()}

Paneldeki AI koçuna "plan" veya "istatistik" yazarak birleşik analiz alabilirsin.`;
}

export function generateContextualCoachTip(
  eventType: string,
  detail: string | undefined,
  context: CoachContext,
): string | null {
  const name = context.profile.name;

  switch (eventType) {
    case 'tab_visit':
      if (detail === 'ulusalsinav') {
        return `${name}, ulusal sınav arşivindesin. Test bitince alan bazlı istatistikler Grafikler sekmesine düşer; takıldığın konuyu AI koça sor.`;
      }
      if (detail === 'sinavlar') {
        return `${name}, grafikler hem deneme kayıtlarını hem arşiv testlerini alan bazlı gösteriyor. Zayıf alana göre plan iste.`;
      }
      if (detail === 'sorucozucu') {
        return `${name}, takıldığın soruyu buraya yaz; adım adım çözüm ve not defterine kayıt önerisi alırsın.`;
      }
      return null;
    case 'exam_archive_finish':
      return detail
        ? `${name}, test bitti: ${detail}. Grafikler sekmesinden alan analizine bak; moralin yüksek kalsın!`
        : null;
    case 'exam_add':
      return `${name}, yeni deneme kaydın koç analizine eklendi. "Tüm Denemeleri Analiz Et" ile detaylı rapor al.`;
    case 'task_add':
      return `${name}, hedef ekledin — küçük adımlar büyük sıçrama yapar. Tamamladıkça işaretle!`;
    case 'library_search':
      return `${name}, kütüphanede arama yaptın. Bulduğun kaynağı planlayıcıya not olarak ekle.`;
    default:
      return null;
  }
}

export function generateWrongAnswerCoachLine(
  subject: string,
  explanation: string,
): string {
  const humor = getHumorousWrongReply(subject);
  const shortExp = explanation.length > 120 ? `${explanation.slice(0, 120)}…` : explanation;
  return `${humor}\n\n💡 İpucu: ${shortExp}`;
}
