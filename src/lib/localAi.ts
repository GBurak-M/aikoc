import {
  detectExamFromText,
  findExamsByQuery,
  formatExamCoachBlock,
  NATIONAL_EXAMS,
  type NationalExam,
} from '../data/nationalExams';
import {
  getLatestExamByType,
  getSubjectAverages,
  sortExamsByDate,
  type Exam,
  type SubjectAverage,
} from './exams';
import { formatArchiveStatsSummary, getArchiveSubjectStats } from './examArchive/stats';
import { buildTrafficCoachSummary } from './siteTraffic';
import { getMoraleMessage, maybeAddChatHumor } from './aiCoachHub';
import { sanitizeCoachOutput } from './chatModeration';
import { getAllLibraryItems } from './library';
import { buildCoreKnowledgeCoachBlock } from './aiCentralLearning';
import { detectCoachIntent } from './coachIntents';
import { deriveImprovementTips } from './userLearning';
import type { WorldSnapshot } from './worldData';

export type CoachProfile = {
  name: string;
  field: string;
  targetUniv: string;
  targetDept: string;
  dailyTargetHours: string;
};

export type CoachContext = {
  profile: CoachProfile;
  exams: Exam[];
  subjectAverages: SubjectAverage[];
  pendingTasks: number;
  completedTasks: number;
  recentExamSummary: string;
  estimateRank: string;
  avgNet: number;
  world?: WorldSnapshot | null;
  /** Üye müfredat koçluğu özeti (yalnızca giriş yapmış üyeler) */
  curriculumNote?: string;
  /** Site içi trafik ve etkileşim özeti — kişisel koçluk için */
  trafficSummary?: string;
  /** Kullanıcının mesajından veya trafikten çıkarılan sınav odağı */
  targetExam?: NationalExam | null;
  /** Ulusal sınav arşivi alan bazlı özet */
  archiveStatsSummary?: string;
  /** Öğrenme profili + internet güncellemelerinden türetilen gelişim özeti */
  learningSummary?: string;
  /** Tüm kullanıcı sohbetlerinden öğrenilen merkezi davranış modeli özeti */
  centralAiInsight?: string;
};

type TermEntry = {
  tr: string;
  en: string;
  category: string;
  definition: string;
  yksTip: string;
  analogy: string;
};

const ACADEMIC_DICTIONARY: TermEntry[] = [
  {
    tr: 'Türev',
    en: 'Derivative',
    category: 'MAT',
    definition: 'Bir fonksiyonun belirli bir noktadaki anlık değişim hızını gösteren matematiksel işlemdir.',
    yksTip: 'TYT/AYT’de grafik yorumu, teğet eğimi ve maksimum-minimum sorularında sık çıkar.',
    analogy: 'Bir arabanın hız göstergesi gibi: konumu değil, o anda ne kadar hızlı değiştiğini söyler.',
  },
  {
    tr: 'Mitokondri',
    en: 'Mitochondrion',
    category: 'BİY',
    definition: 'Hücrede ATP üretiminden sorumlu, çift zarlı organeldir; “hücrenin enerji santrali” olarak bilinir.',
    yksTip: 'Aerobik solunum, ATP sentezi ve hücresel solunum sorularında doğrudan sorulur.',
    analogy: 'Şehirdeki elektrik santrali gibi; hücrenin çalışması için enerji üretir.',
  },
  {
    tr: 'Momentum',
    en: 'Momentum',
    category: 'FİZ',
    definition: 'p = m·v formülüyle tanımlanan fiziksel büyüklük; cismin hareket miktarını ifade eder.',
    yksTip: 'İmpuls-momentum teoremi ve çarpışma sorularında Δp = F·Δt ilişkisine dikkat edin.',
    analogy: 'Koşan birinin durması zorlaşır; kütle ve hız arttıkça “durma direnci” artar.',
  },
  {
    tr: 'Kovalent Bağ',
    en: 'Covalent Bond',
    category: 'KİM',
    definition: 'İki atomun ortaklaşa elektron çifti paylaşmasıyla oluşan kimyasal bağdır.',
    yksTip: 'Lewis yapısı, molekül geometrisi ve polar/apolar ayrımında temel kavramdır.',
    analogy: 'İki kişinin aynı kitabı birlikte okuması gibi; elektronları ortak kullanırlar.',
  },
  {
    tr: 'Ozmotik Basınç',
    en: 'Osmotic Pressure',
    category: 'BİY',
    definition: 'Yarı geçirgen zardan su geçişini durdurmak için gereken ek basınçtır.',
    yksTip: 'Hücre zarı, plazmoliz ve turgor konularında yoğun sorulur.',
    analogy: 'Tuzlu suya konan salatalığın buruşması; suyun yoğun taraftan seyrek tarafa gitmesi.',
  },
  {
    tr: 'İvme',
    en: 'Acceleration',
    category: 'FİZ',
    definition: 'Hızın zamana göre değişim oranıdır; birimi m/s².',
    yksTip: 'Grafik sorularında eğim = ivme; sabit ivmeli hareket formüllerini bilin.',
    analogy: 'Gaz pedalına bastığınızda hızın artma hızı; fren yaptığınızda negatif ivme.',
  },
  {
    tr: 'İntegral',
    en: 'Integral',
    category: 'MAT',
    definition: 'Bir fonksiyonun belirli aralıktaki toplam değişimini veya alanını hesaplayan işlemdir.',
    yksTip: 'Alan-hacim ve hız-yol integral sorularında sınır değerlerine dikkat edin.',
    analogy: 'Hız grafiğinin altındaki alan, gidilen yolu verir.',
  },
  {
    tr: 'Fotosentez',
    en: 'Photosynthesis',
    category: 'BİY',
    definition: 'Bitkilerin ışık enerjisiyle CO₂ ve sudan glikoz üretmesi sürecidir.',
    yksTip: 'Klorofil, ışık/karanlık reaksiyonları ve Calvin döngüsü sorulur.',
    analogy: 'Güneş paneli gibi; ışığı kimyasal enerjiye çevirir.',
  },
  {
    tr: 'Logaritma',
    en: 'Logarithm',
    category: 'MAT',
    definition: 'Üslü ifadenin ters işlemidir; log_a(b) = c ise a^c = b.',
    yksTip: 'Taban değiştirme, logaritma özellikleri ve denklem çözümünde sık çıkar.',
    analogy: 'Üslü sayıyı “indirgeme” aracı; büyük sayıları yönetilebilir hale getirir.',
  },
  {
    tr: 'Elektrokimya',
    en: 'Electrochemistry',
    category: 'KİM',
    definition: 'Kimyasal reaksiyonlarla elektrik enerjisi arasındaki dönüşümü inceleyen bilim dalıdır.',
    yksTip: 'Pil, elektroliz ve indirgenme-yükseltgenme numaraları birlikte sorulur.',
    analogy: 'Pil: içerideki reaksiyon dışarıya elektrik verir.',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findTerm(term: string): TermEntry | null {
  const n = normalize(term);
  return (
    ACADEMIC_DICTIONARY.find(
      (e) => normalize(e.tr) === n || normalize(e.en) === n,
    ) ?? null
  );
}

function formatTermResult(entry: TermEntry, direction: 'TR_EN' | 'EN_TR'): string {
  const translation = direction === 'TR_EN' ? entry.en : entry.tr;
  return `Çeviri: ${translation}
Tanım: ${entry.definition}
YKS İpucu: ${entry.yksTip}
Analoji (Benzetme): ${entry.analogy}`;
}

function formatGenericTerm(term: string, direction: 'TR_EN' | 'EN_TR'): string {
  const from = direction === 'TR_EN' ? 'Türkçe' : 'İngilizce';
  const to = direction === 'TR_EN' ? 'İngilizce' : 'Türkçe';
  return `Çeviri: [${term} — ${to} karşılığı sözlükte henüz yok]
Tanım: "${term}" terimi YKS ${from} kaynaklarında geçen akademik bir kavramdır. Ders kitabınızda ve konu anlatım notlarınızda bu terimin tanımını mutlaka işaretleyin.
YKS İpucu: Bilmediğiniz terimleri deneme sonrası not defterine ekleyin; tekrar sıklığı net artışı sağlar.
Analoji (Benzetme): Yeni bir kelimeyi öğrenmek, haritaya yeni bir sokak eklemek gibidir — bir kez öğrenince o konuya her gidişiniz hızlanır.`;
}

export async function translateAcademicTerm(
  term: string,
  direction: 'TR_EN' | 'EN_TR',
): Promise<string> {
  await delay(400);
  const entry = findTerm(term);
  if (entry) return formatTermResult(entry, direction);
  return formatGenericTerm(term.trim(), direction);
}

function weakestSubjects(averages: SubjectAverage[]): SubjectAverage[] {
  return [...averages].sort((a, b) => a.percentage - b.percentage);
}

function strongestSubjects(averages: SubjectAverage[]): SubjectAverage[] {
  return [...averages].sort((a, b) => b.percentage - a.percentage);
}

export async function generateFullExamAnalysis(
  exams: Exam[],
  profile: CoachProfile,
): Promise<string> {
  await delay(600);

  const sorted = sortExamsByDate(exams);
  const averages = getSubjectAverages(exams);
  const weak = weakestSubjects(averages).slice(0, 2);
  const strong = strongestSubjects(averages).slice(0, 2);
  const latestTyt = getLatestExamByType(exams, 'TYT');
  const latestAyt = getLatestExamByType(exams, 'AYT');
  const totalAvg =
    exams.length > 0
      ? (exams.reduce((s, e) => s + e.totalNet, 0) / exams.length).toFixed(1)
      : '0';

  const trend =
    sorted.length >= 2
      ? sorted[sorted.length - 1].totalNet - sorted[sorted.length - 2].totalNet
      : 0;
  const trendText =
    trend > 2
      ? `Son denemede netiniz ${trend.toFixed(1)} arttı — ivme pozitif!`
      : trend < -2
        ? `Son denemede net ${Math.abs(trend).toFixed(1)} düştü — eksik konulara odaklanma zamanı.`
        : 'Netleriniz istikrarlı; küçük optimizasyonlarla sıçrama yapabilirsiniz.';

  const weeklyPlan = weak
    .map(
      (s, i) =>
        `${i + 1}. ${s.subject}: Haftada 3 gün, 45 dk konu + 30 dk soru. Hedef: %${s.percentage} → %${Math.min(100, s.percentage + 12)}`,
    )
    .join('\n');

  return `Merhaba ${profile.name}! aikoc deneme analizin hazır. (Ücretsiz — API anahtarı gerekmez)

📊 Genel Durum
• Toplam deneme: ${exams.length}
• Ortalama net: ${totalAvg}
• Son TYT: ${latestTyt ? `${latestTyt.totalNet} net (${latestTyt.name})` : 'Henüz kayıt yok'}
• Son AYT: ${latestAyt ? `${latestAyt.totalNet} net (${latestAyt.name})` : 'Henüz kayıt yok'}
• ${trendText}

💪 Güçlü Alanlar
${strong.map((s) => `• ${s.subject}: ort. ${s.avgNet} net (%${s.percentage})`).join('\n')}

🎯 Geliştirilmesi Gerekenler
${weak.map((s) => `• ${s.subject}: ort. ${s.avgNet} net (%${s.percentage}) — öncelikli çalışma alanı`).join('\n')}

📅 Haftalık Öneri (${profile.dailyTargetHours} saat/gün hedefinize uygun)
${weeklyPlan || '• Önce en az bir deneme girerek kişisel plan oluşturun.'}

🎓 Hedef: ${profile.targetUniv} — ${profile.targetDept}
Alanınız (${profile.field}) için AYT ağırlıklı derslere hafta içi 2 blok ayırın.

💡 Motivasyon
"${profile.targetDept}" hedefi uzun bir maraton. Bugün çözdüğünüz her 10 soru, yarınki denemede 1-2 net farkı yaratabilir. Devam edin!

📂 Ulusal Sınav Arşivi (alan bazlı)
${formatArchiveStatsSummary()}

🧠 Kişisel gelişim
${deriveImprovementTips(getArchiveSubjectStats(), averages).map((t) => `• ${t}`).join('\n') || '• Arşiv testleri tamamladıkça alan önerileri burada görünür.'}`;
}

function centralBlock(context: CoachContext): string {
  const block = context.centralAiInsight ?? buildCoreKnowledgeCoachBlock();
  return block ? `\n\n${block}` : '';
}

function libraryCoachReply(): string {
  const items = getAllLibraryItems().slice(0, 6);
  const lines = items.map((i) => `• ${i.title} (${i.language}) — ${i.source}`).join('\n');
  return `Kütüphanemizde doğrudan okunabilir ücretsiz kitap ve makaleler var. Admin bilgisayarı açıkken yapay zeka internetten yeni kaynaklar arayıp Türkçeye çevirerek ekler.

Öne çıkanlar:
${lines || '• Henüz kayıt yok — Kütüphane sekmesine göz atın.'}

Kütüphane sekmesinden "Okumaya Başla" ile site içinde okuyabilirsin.`;
}

function trafficBlock(context: CoachContext): string {
  const summary = context.trafficSummary ?? buildTrafficCoachSummary();
  return `\n\n📊 Site içi trafiğiniz (kişisel koçluk verisi):\n${summary}`;
}

function examCoachReply(message: string, context: CoachContext): string {
  const detected =
    context.targetExam ??
    detectExamFromText(message) ??
    findExamsByQuery(message)[0] ??
    null;

  if (detected) {
    return `${formatExamCoachBlock(detected)}${trafficBlock(context)}`;
  }

  const list = NATIONAL_EXAMS.slice(0, 8)
    .map((e) => `• ${e.shortName} — ${EXAM_LEVEL_LABELS_SHORT(e)}`)
    .join('\n');

  return `Türkiye'deki başlıca ulusal sınavlara hazırlık konusunda yardımcı olabilirim:

${list}
…ve daha fazlası (LGS, TYT, AYT, YKS, KPSS, ALES, YDS, DGS, MSÜ, TUS, DUS, EKPSS).

Hangi sınava hazırlanıyorsunuz? Sınav adını yazın; size özel hazırlık planı ve aikoc araç önerisi sunayım.${trafficBlock(context)}`;
}

function EXAM_LEVEL_LABELS_SHORT(exam: NationalExam): string {
  const labels: Record<string, string> = {
    ortaogretim: 'Ortaöğretim',
    lise: 'Lise',
    universite: 'Üniversite',
    yuksek_lisans: 'Y. Lisans',
    kamu: 'Kamu',
    meslek: 'Meslek',
  };
  return labels[exam.level] ?? exam.level;
}

function formatWorldWeather(world: WorldSnapshot): string {
  const loc = world.settlement.displayName;
  const nextHours = world.weather.slice(0, 6);
  const lines = nextHours.map((h) => {
    const wind =
      h.windSpeedMs != null
        ? `, rüzgar ${h.windSpeedMs.toFixed(1)} m/s (${(h.windSpeedMs * 3.6).toFixed(0)} km/sa)`
        : '';
    const gust =
      h.windGustMs != null
        ? `, ani ${h.windGustMs.toFixed(1)} m/s (${(h.windGustMs * 3.6).toFixed(0)} km/sa)`
        : '';
    return `• ${h.hourLabel}: ${h.temp}°C, ${h.label} (yağış %${h.precipProb}${wind}${gust})`;
  });
  return `${loc} için saatlik özet (şu an ${world.currentTemp ?? '—'}°C):\n${lines.join('\n')}`;
}

function formatWorldPrayer(world: WorldSnapshot): string {
  const p = world.prayer;
  return `${world.settlement.displayName} — ${p.date}\n• İmsak ${p.imsak} | Güneş ${p.gunes}\n• Öğle ${p.ogle} | İkindi ${p.ikindi}\n• Akşam ${p.aksam} | Yatsı ${p.yatsi}\nSıradaki: ${p.nextPrayer} (${p.nextPrayerTime})`;
}

function formatWorldCalendar(world: WorldSnapshot): string {
  const c = world.calendar;
  const events = c.upcomingEvents.map((e) => `• ${e.date}: ${e.title}`).join('\n');
  return `📅 ${c.dayName}, ${c.gregorianDate}\nHicri: ${c.hijriDate || pFromPrayer(world)}\nHafta: ${c.weekOfYear}${c.yksCountdownDays != null ? `\nYKS'ye ~${c.yksCountdownDays} gün` : ''}\n\nYaklaşan:\n${events || '—'}`;
}

function pFromPrayer(world: WorldSnapshot): string {
  return world.prayer.hijriDate || '—';
}

const KIND_TR: Record<string, string> = { makale: 'Makale', kitap: 'Kitap', yayin: 'Yayın' };

function formatScienceDigest(world: WorldSnapshot): string {
  if (world.science.length === 0) return 'Bilim akışı şu an yüklenemedi. Zeka Merkezi sekmesinden verileri yenileyin.';
  const topics = world.scienceTopics ?? [];
  if (topics.length > 0) {
    return topics
      .slice(0, 4)
      .map((t) => {
        const lines: string[] = [`▸ ${t.field}`];
        for (const s of t.articles.slice(0, 2)) {
          lines.push(`  • [Makale] ${s.title} (${s.date})`);
        }
        for (const s of t.books.slice(0, 1)) {
          lines.push(`  • [Kitap] ${s.title} (${s.date})`);
        }
        for (const s of t.publications.slice(0, 1)) {
          lines.push(`  • [Yayın] ${s.title} (${s.date})`);
        }
        return lines.join('\n');
      })
      .join('\n\n');
  }
  return world.science
    .slice(0, 5)
    .map((s, i) => {
      const kind = KIND_TR[s.kind] ?? 'Kayıt';
      return `${i + 1}. [${s.field} · ${kind}] ${s.title}\n   ${s.summary}\n   (${s.date} — ${s.source})`;
    })
    .join('\n\n');
}

export async function generateCoachChatResponse(
  userMessage: string,
  context: CoachContext,
): Promise<string> {
  await delay(500);

  const intent = detectCoachIntent(userMessage);
  const { profile, subjectAverages, recentExamSummary, estimateRank, avgNet, pendingTasks } =
    context;
  const weak = weakestSubjects(subjectAverages)[0];
  const strong = strongestSubjects(subjectAverages)[0];

  const intro = `${profile.name}, sorunu aldım. `;
  const world = context.world;

  const traffic = trafficBlock(context);
  const humorTopic = weak?.subject ?? profile.field ?? 'öğrenme';

  let reply: string;

  switch (intent) {
    case 'national_exam':
      reply = `${profile.name}, ${examCoachReply(userMessage, context)}`;
      break;
    case 'library':
      reply = `${intro}${libraryCoachReply()}`;
      break;
    case 'traffic':
      reply = `${intro}Site içindeki tüm etkileşimlerinizi takip ediyorum; koçluk önerilerim bu trafiğe göre şekillenir.\n\n${context.trafficSummary ?? buildTrafficCoachSummary()}${context.targetExam ? `\n\nOdak sınav: ${context.targetExam.shortName}` : ''}`;
      break;
    case 'weather':
      if (!world) {
        reply = `${intro}Hava durumu için Zeka Merkezi'nden il veya ilçenizi seçin (ör. "Kadıköy", "Çankaya"). Konum kaydedilince saatlik tahmin otomatik güncellenir.`;
      } else {
        reply = `${intro}\n${formatWorldWeather(world)}\n\nÇalışma önerisi: Yağışlı saatlerde paragraf/dil bilgisi, açık saatlerde deneme çözün.`;
      }
      break;
    case 'prayer':
      if (!world) {
        reply = `${intro}Namaz vakitleri için Zeka Merkezi'nde konum seçin. Diyanet metodu (13) ile hesaplanır.`;
      } else {
        reply = `${intro}\n${formatWorldPrayer(world)}`;
      }
      break;
    case 'calendar':
      if (!world) {
        reply = `${intro}Takvim ve bayram takibi için Zeka Merkezi'ni açın; konum seçildiğinde takvim verileri yüklenir.`;
      } else {
        reply = `${intro}\n${formatWorldCalendar(world)}`;
      }
      break;
    case 'science_news':
      if (!world) {
        reply = `${intro}Güncel bilim yayınları OpenAlex üzerinden çekilir. Zeka Merkezi sekmesinde "Verileri Yenile" ile akışı güncelleyin.`;
      } else {
        reply = `${intro}Son bilimsel yayınlar (otomatik güncellenir):\n\n${formatScienceDigest(world)}\n\nYKS bağlantısı: Bu konulardan okuduğunuz terimleri Akademik Sözlük'e ekleyin.`;
      }
      break;
    case 'motivation': {
      const morale = getMoraleMessage();
      const learn = context.learningSummary
        ? `\n\n🧠 Kişisel gelişim notları:\n${context.learningSummary}`
        : '';
      reply = `${intro}${morale}

${profile.targetUniv} hedefin için bugün ${profile.dailyTargetHours} saatlik planını tamamlaman yeterli bir adım. Yanlışlar öğrenmenin parçası; önemli olan vazgeçmemek.${learn}${traffic}`;
      break;
    }
    case 'plan': {
      const archivePlan = context.archiveStatsSummary
        ? `\n\n📂 Arşiv testlerinden:\n${context.archiveStatsSummary}`
        : '';
      const learnPlan = context.learningSummary
        ? `\n\n🎯 Gelişim önerileri:\n${context.learningSummary}`
        : '';
      if (context.curriculumNote) {
        reply = `${intro}Müfredatınıza göre plan:\n${context.curriculumNote}${archivePlan}${learnPlan}${traffic}`;
      } else {
        const examHint = context.targetExam
          ? `\n${context.targetExam.shortName} hazırlığı için: ${context.targetExam.prepTips[0]}`
          : '';
        reply = `${intro}Önerilen haftalık plan:
• Pazartesi-Çarşamba-Cuma: ${weak?.subject ?? 'Zayıf dersiniz'} (konu + soru)
• Salı-Perşembe: ${strong?.subject ?? 'Güçlü dersiniz'} pekiştirme
• Cumartesi: Tam TYT denemesi veya arşiv testi + analiz
• Pazar: Eksik konu tekrarı + ${pendingTasks} bekleyen hedefinizden 2 tanesi
Günlük hedef: ${profile.dailyTargetHours} saat.${examHint}${archivePlan}${learnPlan}${traffic}`;
      }
      break;
    }
    case 'math':
      reply = `${intro}Matematikte net artışı için: önce konu eksiklerini kapatın, sonra süreli soru çözün. Türev-integral-limit üçlüsünü haftalık döngüyle tekrarlayın. Son denemeler: ${recentExamSummary || 'Henüz deneme yok'}.`;
      break;
    case 'turkish':
      reply = `${intro}Türkçe/Paragraf için günde 20-40 paragraf + 1 dil bilgisi testi idealdir. Edebiyatta ezber yerine eser-şair-akım tablosu çıkarın. Yanlış yaptığınız soru tiplerini not defterine işaretleyin.`;
      break;
    case 'science':
      reply = `${intro}Fen netleri formül + soru dengesiyle yükselir. Her konudan sonra 15 dk “formül kartı” hazırlayın. Fizikte grafik, kimyada mol hesabı, biyolojide sistem soruları ÖSYM favorisidir.`;
      break;
    case 'social':
      reply = `${intro}Sosyal bilimlerde kronoloji ve harita çalışması kritik. Tarihte olay-neden-sonuç, coğrafyada harita yorumu, felsefede akım-fikir eşleştirmesi yapın.`;
      break;
    case 'stats': {
      const archive = context.archiveStatsSummary
        ? `\n\n📂 Ulusal sınav arşivi (alan bazlı):\n${context.archiveStatsSummary}`
        : '\n\n📂 Ulusal sınav arşivi: Henüz tamamlanmış test yok — Ulusal Sınavlar sekmesinden deneyin.';
      const learn = context.learningSummary ? `\n\n🧠 Öğrenme profili:\n${context.learningSummary}` : '';
      reply = `${intro}Deneme kayıtları: ortalama ${avgNet} net, tahmini sıralama ${estimateRank}. Son denemeler: ${recentExamSummary || 'Henüz deneme girilmedi'}. ${weak ? `Öncelik: ${weak.subject} (%${weak.percentage}).` : ''}${archive}${learn}${traffic}`;
      break;
    }
    case 'goal':
      reply = `${intro}Hedefiniz ${profile.targetUniv} — ${profile.targetDept} (${profile.field}). Bu bölüm için AYT netleriniz belirleyici. Haftalık en az 1 AYT denemesi ve eksik analizi şart.`;
      break;
    default: {
      const curr = context.curriculumNote ? `\n\n📚 Müfredat koçluğu: ${context.curriculumNote}` : '';
      const archive = context.archiveStatsSummary ? `\n\n📂 Arşiv: ${context.archiveStatsSummary}` : '';
      const learn = context.learningSummary ? `\n\n🧠 Gelişim: ${context.learningSummary.split('\n').slice(0, 3).join('\n')}` : '';
      const examNote = context.targetExam
        ? `\n🎯 Odak sınavınız: ${context.targetExam.shortName}. ${context.targetExam.prepTips[0]}`
        : '\nLGS, YKS, KPSS, ALES, YDS, DGS ve diğer ulusal sınavlar hakkında soru sorabilirsiniz.';
      reply = `${intro}"${userMessage}" hakkında: Düzenli deneme + arşiv testi + eksik analizi en etkili yöntemdir. ${recentExamSummary ? `Son durumunuz: ${recentExamSummary}.` : 'İlk denemenizi veya arşiv testini tamamlayarak kişisel öneri alabilirsiniz.'}${examNote}${archive}${learn}${curr}${traffic}
${world ? `\nKonum: ${world.settlement.displayName} | Hava: ${world.currentTemp ?? '—'}°C | Sıradaki vakit: ${world.prayer.nextPrayer}` : ''}
Sorabilecekleriniz: ulusal sınav hazırlığı, istatistik, motivasyon, kütüphane, site trafiğim, hava, namaz, takvim, bilim, plan.`;
      break;
    }
  }

  return sanitizeCoachOutput(reply + centralBlock(context) + maybeAddChatHumor(humorTopic));
}

export async function generateScienceBrief(world: WorldSnapshot): Promise<string> {
  await delay(400);
  const topics = world.scienceTopics ?? [];
  const stats = topics.map((t) => {
    const n = t.articles.length + t.books.length + t.publications.length;
    return `${t.field}: ${t.articles.length} makale, ${t.books.length} kitap, ${t.publications.length} yayın (toplam ${n})`;
  });

  return `🔬 Bilim Gündemi — Küresel Akış (${world.settlement.displayName})
Son güncelleme: ${new Date(world.fetchedAt).toLocaleString('tr-TR')}
Kaynak: OpenAlex (dünya geneli) · Başlık ve özetler Türkçeye çevrildi

Konu bazlı dağılım:
${stats.length ? stats.map((s) => `• ${s}`).join('\n') : '—'}

Öne çıkanlar (Türkçe):
${formatScienceDigest(world)}

YKS ipucu: Okuduğunuz terimleri Akademik Sözlük'e ekleyin; fen ve sosyal bilimlerde güncel kavram takibi net artışına yardımcı olur.`;
}

function solveDerivativeTangent(): string {
  return `1. **İlgili Formüller/Kurallar:**
f(x) = 3x² - 4x + 5 için türev: f'(x) = 6x - 4. Teğet eğimi = f'(a).

2. **Adım Adım Detaylı Çözüm:**
f'(x) = 6x - 4
x = 2 için f'(2) = 6·2 - 4 = 12 - 4 = **8**

3. **Kritik YKS Püf Noktası (ÖSYM Tarzı):**
"Teğetin eğimi" ifadesi doğrudan türev değerini sorar; önce fonksiyonu sadeleştirmeden türev alın.

4. **Pekiştirme Sorusu:**
f(x) = x² + 2x için x = 1 noktasındaki teğetin eğimi kaçtır?
Doğru Cevap: 4`;
}

function solveMomentum(): string {
  return `1. **İlgili Formüller/Kurallar:**
İmpuls-momentum: F·Δt = Δp = m·Δv. Başlangıç hızı 0 kabul edilirse Δp = m·v.

2. **Adım Adım Detaylı Çözüm:**
F = 10 N, Δt = 5 s → İmpuls = 10 · 5 = 50 N·s
Momentum değişimi Δp = 50 kg·m/s (kütle 2 kg olsa da impuls aynıdır).

3. **Kritik YKS Püf Noktası (ÖSYM Tarzı):**
Sürtünmesiz düzlemde sadece yatay kuvvet varsa tüm impuls momentum değişimine eşittir; kütle ayrı çarpım olarak tekrar yazılmaz.

4. **Pekiştirme Sorusu:**
4 N kuvvet 3 s uygulanırsa momentum değişimi kaç N·s olur?
Doğru Cevap: 12 N·s`;
}

function solveMitochondria(): string {
  return `1. **İlgili Formüller/Kurallar:**
Mitokondri → aerobik solunum → ATP artışı. ATP kullanımı hücre metabolizmasını hızlandırır.

2. **Adım Adım Detaylı Çözüm:**
• Mitokondri faaliyeti artınca ATP üretimi yükselir.
• pH: CO₂ üretimi artabilir → hücre içi pH hafif **düşebilir** (asitlik artar).
• Ozmotik basınç: Metabolit artışı ile **artabilir**.
• Turgor basıncı (bitki hücresinde): osmotik değişime bağlı; hayvan hücresinde turgor yerine hücre hacmi değişimi konuşulur.

3. **Kritik YKS Püf Noktası (ÖSYM Tarzı):**
"Mitokondri artışı" sorularında enerji, pH ve osmotik etkileri birlikte düşünün; tek boyutlu cevap tuzaktır.

4. **Pekiştirme Sorusu:**
Aerobik solunumun hızlandığı bir hücrede ATP ve CO₂ üretimi nasıl değişir?
Doğru Cevap: İkisi de artar.`;
}

function solveBySubject(subject: string, question: string): string {
  const q = normalize(question);

  if (/teğet|teget|egim|eğim|türev|trev/.test(q) && /fonksiyon|f\(x\)|3x/.test(q)) {
    return solveDerivativeTangent();
  }
  if (/momentum|kuvvet.*uygulan|impuls/.test(q)) {
    return solveMomentum();
  }
  if (/mitokondri|ozmotik|osmotik|turgor|ph/.test(q)) {
    return solveMitochondria();
  }

  const guides: Record<string, string> = {
    Matematik: `1. **İlgili Formüller/Kurallar:** Sorudaki ana kavramı (denklem, fonksiyon, geometri) belirleyin; TYT'de temel, AYT'de ileri formüller gerekir.
2. **Adım Adım Detaylı Çözüm:** Verilenleri yazın → bilinmeyeni tanımlayın → işlem adımlarını sırayla uygulayın.
3. **Kritik YKS Püf Noktası:** İşaret hataları ve sınır durumları en yaygın tuzaktır.
4. **Pekiştirme Sorusu:** Aynı konudan 5 benzer soru çözün.`,
    Fizik: `1. **İlgili Formüller/Kurallar:** SI birimleri, vektör yönü ve uygun fizik yasasını (Newton, enerji, elektrik) seçin.
2. **Adım Adım Detaylı Çözüm:** Şema çizin, verilenleri listeleyin, birim analizi yapın.
3. **Kritik YKS Püf Noktası:** "Sürtünmesiz", "ihmal edilebilir" gibi anahtar ifadelere dikkat edin.
4. **Pekiştirme Sorusu:** Konu testinden 10 soru çözüp yanlışları analiz edin.`,
    Kimya: `1. **İlgili Formüller/Kurallar:** Mol, denge, asit-baz ve redoks formüllerini kontrol edin.
2. **Adım Adım Detaylı Çözüm:** Denklemi dengeleyin, mol oranlarını adım adım kurun.
3. **Kritik YKS Püf Noktası:** Periyodik özellikler ve çözelti hesapları sık sorulur.
4. **Pekiştirme Sorusu:** Benzer 3 soruyu zamanlayarak çözün.`,
    Biyoloji: `1. **İlgili Formüller/Kurallar:** Hücre, sistem ve ekoloji kavramlarını eşleştirin.
2. **Adım Adım Detaylı Çözüm:** Süreç akışı (ör. fotosentez, solunum) çizerek ilerleyin.
3. **Kritik YKS Püf Noktası:** "Artar/azalır" tipi sorularda neden-sonuç zinciri kurun.
4. **Pekiştirme Sorusu:** Konu şeması çıkarıp 24 saat sonra tekrar edin.`,
    Türkçe: `1. **İlgili Kurallar:** Paragraf (ana düşünce, yapı), dil bilgisi (ses, yapım, çekim) kuralları.
2. **Adım Adım Çözüm:** Seçenekleri elemine edin; metin kanıtı olmayan şıkları eleyin.
3. **Kritik YKS Püf Noktası:** "En", "dışında", "yalnızca" gibi mutlak ifadelere dikkat.
4. **Pekiştirme:** 1 paragraf testi + yanlış analizi.`,
  };

  const body = guides[subject] ?? guides.Matematik;
  return `${body}

---
**Sorunuz:** "${question.slice(0, 200)}${question.length > 200 ? '…' : ''}"

Yerel AI çözücü bu soruyu örnek veritabanında tam eşleştiremedi; yukarıdaki ${subject} çözüm stratejisini uygulayın. Soruyu daha net yazarsanız veya örnek sorulardan birini seçerseniz adım adım çözüm üretilir.`;
}

export async function generateQuestionSolution(
  subject: string,
  questionText: string,
  hasImage: boolean,
): Promise<string> {
  await delay(700);

  if (hasImage && !questionText.trim()) {
    return `📷 **Görsel soru (ücretsiz yerel mod)**

Görseldeki metni otomatik okumak için ücretli bulut API kullanılmıyor; gizliliğiniz ve maliyet için tüm AI işlemleri cihazınızda çalışır.

**Ne yapmalısınız?**
1. Sorunun metnini "Soru Metni" alanına yazın (veya fotoğraftaki ifadeyi kopyalayın)
2. Dersi doğru seçin: ${subject}
3. Tekrar "Çözümü Getir" deyin — adım adım çözüm üretilir

**${subject} için genel strateji:**
• Verilenleri listeleyin
• Kullanılacak formül/kuralı belirleyin
• İşlemleri sırayla yazın
• Sonucu birim/kavram ile kontrol edin`;
  }

  const text = questionText.trim() || '(Görsel soru — metin eklenirse daha iyi çözüm)';
  return solveBySubject(subject, text);
}
