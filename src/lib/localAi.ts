import { findGrammarByKeyword, formatGrammarReply } from '../data/languageKnowledge';
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
import { formatGenericTerm, formatTermResult, findTerm } from './academicTerms';
import {
  findDiscipline,
  formatDiscipline,
  formatScienceTaxonomyOverview,
  tryScienceDisciplineReply,
} from './scienceKnowledge';
import { getMoraleMessage } from './aiCoachHub';
import { buildTeacherFallback, tryConceptLesson } from './conceptLessons';
import { sanitizeCoachOutput } from './chatModeration';
import {
  buildDirectAnswerFallback,
  tryConversationalReply,
  type ChatTurn,
} from './conversationEngine';
import { getAllLibraryItems } from './library';
import { buildCoreKnowledgeCoachBlock } from './aiCentralLearning';
import { detectCoachIntent } from './coachIntents';
import { deriveImprovementTips } from './userLearning';
import type { WorldSnapshot } from './worldData';

export type { ChatTurn };

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function translateAcademicTerm(
  term: string,
  direction: 'TR_EN' | 'EN_TR',
): Promise<string> {
  await delay(400);
  const entry = findTerm(term);
  if (entry) return formatTermResult(entry, direction);
  const discipline = findDiscipline(term);
  if (discipline) return formatDiscipline(discipline);
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
  const lines = items.map((i) => `• ${i.title} (${i.language}) — ${i.author}`).join('\n');
  return `Kütüphanede kitap ve makaleler doğrudan site içinde açılır; dış siteye yönlendirme yok.

Öne çıkanlar:
${lines || '• Henüz kayıt yok — Kütüphane sekmesine göz atın.'}

Kütüphane sekmesinden "Kütüphanede Oku" ile okuyabilirsin.`;
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
  history: ChatTurn[] = [],
): Promise<string> {
  await delay(400);

  const conversational = tryConversationalReply(userMessage, context, history);
  if (conversational) {
    return sanitizeCoachOutput(conversational);
  }

  const intent = detectCoachIntent(userMessage);
  const { profile, subjectAverages, recentExamSummary, estimateRank, avgNet, pendingTasks } =
    context;
  const weak = weakestSubjects(subjectAverages)[0];
  const strong = strongestSubjects(subjectAverages)[0];

  const world = context.world;
  const includeTraffic = intent === 'traffic' || intent === 'stats';
  const traffic = includeTraffic ? trafficBlock(context) : '';
  const central = intent === 'traffic' || intent === 'stats' ? centralBlock(context) : '';

  let reply: string;

  switch (intent) {
    case 'national_exam':
      reply = examCoachReply(userMessage, context);
      break;
    case 'library':
      reply = libraryCoachReply();
      break;
    case 'traffic':
      reply = `Site içindeki etkileşimlerini takip ediyorum; önerilerim buna göre şekillenir.\n\n${context.trafficSummary ?? buildTrafficCoachSummary()}${context.targetExam ? `\n\nOdak sınav: ${context.targetExam.shortName}` : ''}`;
      break;
    case 'weather':
      if (!world) {
        reply = `Hava durumu için Zeka Merkezi'nden il veya ilçeni seç (ör. "Kadıköy"). Konum kaydedilince saatlik tahmin güncellenir.`;
      } else {
        reply = `${formatWorldWeather(world)}\n\nÇalışma önerisi: Yağışlı saatlerde paragraf/dil bilgisi, açık saatlerde deneme çöz.`;
      }
      break;
    case 'prayer':
      if (!world) {
        reply = `Namaz vakitleri için Zeka Merkezi'nde konum seç. Diyanet metodu (13) ile hesaplanır.`;
      } else {
        reply = formatWorldPrayer(world);
      }
      break;
    case 'calendar':
      if (!world) {
        reply = `Takvim ve bayram takibi için Zeka Merkezi'ni aç; konum seçildiğinde veriler yüklenir.`;
      } else {
        reply = formatWorldCalendar(world);
      }
      break;
    case 'science_fields': {
      const disciplineReply = tryScienceDisciplineReply(userMessage);
      reply =
        disciplineReply ??
        `${formatScienceTaxonomyOverview()}\n\nTek bir dal sor: örn. "Jeofizik nedir?", "Biyoinformatik YKS bağlantısı", "sosyal bilimler dalları".`;
      break;
    }
    case 'science_news':
      if (!world) {
        reply = `Güncel bilim yayınları OpenAlex üzerinden çekilir. Zeka Merkezi sekmesinde "Verileri Yenile" ile akışı güncelle.`;
      } else {
        reply = `Son bilimsel yayınlar:\n\n${formatScienceDigest(world)}\n\nOkuduğun terimleri Akademik Sözlük'e eklemeyi unutma.`;
      }
      break;
    case 'language': {
      const rule = findGrammarByKeyword(userMessage);
      if (rule) {
        const preferEn = /[a-z]/i.test(userMessage) && !/ğ|ü|ş|ı|ö|ç/i.test(userMessage);
        reply = formatGrammarReply(rule, preferEn);
      } else {
        reply = `Türkçe ve İngilizce gramer, kelime ve çeviri konularında yardımcı olurum. Örneğin "present continuous nedir?" veya "evidence kelimesi ne demek?" diye sorabilirsin.`;
      }
      break;
    }
    case 'motivation': {
      const morale = getMoraleMessage();
      const learn = context.learningSummary
        ? `\n\nKişisel gelişim notların:\n${context.learningSummary}`
        : '';
      reply = `${morale}

${profile.targetUniv} hedefin için bugün ${profile.dailyTargetHours} saatlik planın bile iyi bir adım. Yanlışlar öğrenmenin parçası.${learn}`;
      break;
    }
    case 'plan': {
      const archivePlan = context.archiveStatsSummary
        ? `\n\nArşiv testlerinden:\n${context.archiveStatsSummary}`
        : '';
      const learnPlan = context.learningSummary
        ? `\n\nGelişim önerileri:\n${context.learningSummary}`
        : '';
      if (context.curriculumNote) {
        reply = `Müfredatına göre plan:\n${context.curriculumNote}${archivePlan}${learnPlan}`;
      } else {
        const examHint = context.targetExam
          ? `\n${context.targetExam.shortName} için: ${context.targetExam.prepTips[0]}`
          : '';
        reply = `Önerilen haftalık plan:
• Pazartesi-Çarşamba-Cuma: ${weak?.subject ?? 'zayıf dersin'} (konu + soru)
• Salı-Perşembe: ${strong?.subject ?? 'güçlü dersin'} pekiştirme
• Cumartesi: TYT denemesi veya arşiv testi + analiz
• Pazar: Eksik tekrar + bekleyen ${pendingTasks} hedefinden 2 tanesi
Günlük hedef: ${profile.dailyTargetHours} saat.${examHint}${archivePlan}${learnPlan}`;
      }
      break;
    }
    case 'math': {
      const m = normalize(userMessage);
      if (/logaritma/.test(m)) {
        const entry = findTerm('Logaritma');
        reply = entry
          ? `Logaritmayı adım adım toparlayalım:\n\n${formatTermResult(entry, 'TR_EN')}\n\n**Mini özet:** log_a(b) = c demek a^c = b demektir. Özellikler: log çarpım → toplam; log bölüm → fark; taban değiştirme formülünü ezberle.\n\n**Hemen dene:** log₂8 = ? (İpucu: 2³ = 8 → cevap 3)\n\nTakıldığın alt başlığı yaz (tanım, özellikler, denklem); oradan devam edelim.`
          : `Logaritma, üslü ifadenin ters işlemidir. log_a(b) = c ise a^c = b. Önce tanım + özellikleri (çarpım, bölüm, taban değiştirme), sonra denklem soruları çöz. Hangi kısımda takıldığını yazarsan netleştiririm.`;
      } else {
        reply = `Matematikte net artışı için önce konu eksiklerini kapat, sonra süreli soru çöz. Türev-integral-limit üçlüsünü haftalık döngüyle tekrarla.${recentExamSummary ? ` Son denemeler: ${recentExamSummary}.` : ''}`;
      }
      break;
    }
    case 'turkish':
      reply = `Türkçe/paragraf için günde 20-40 paragraf + 1 dil bilgisi testi iyi bir ritim. Edebiyatta eser-şair-akım tablosu çıkar; gramer sorularında zaman ve bağlaçlara dikkat et.`;
      break;
    case 'science': {
      const disciplineReply = tryScienceDisciplineReply(userMessage);
      reply =
        disciplineReply ??
        `Fen netleri formül + soru dengesiyle yükselir. Her konudan sonra kısa formül kartı hazırla. Fizikte grafik, kimyada mol, biyolojide sistem soruları sık çıkar.\n\nBilim dalları rehberi için "bilim dalları nelerdir" veya "astrofizik nedir" diye sorabilirsin.`;
      break;
    }
    case 'social':
      reply = `Sosyal bilimlerde kronoloji ve harita çalışması kritik. Tarihte olay-neden-sonuç, coğrafyada harita yorumu, felsefede akım-fikir eşleştirmesi yap.`;
      break;
    case 'stats': {
      const archive = context.archiveStatsSummary
        ? `\n\nUlusal sınav arşivi:\n${context.archiveStatsSummary}`
        : '\n\nArşiv: Henüz tamamlanmış test yok — Ulusal Sınavlar sekmesinden dene.';
      const learn = context.learningSummary ? `\n\nÖğrenme profili:\n${context.learningSummary}` : '';
      reply = `Deneme kayıtlarına göre ortalama ${avgNet} net, tahmini sıralama ${estimateRank}. Son denemeler: ${recentExamSummary || 'henüz deneme yok'}.${weak ? ` Öncelik: ${weak.subject} (%${weak.percentage}).` : ''}${archive}${learn}${traffic}`;
      break;
    }
    case 'goal':
      reply = `Hedefin ${profile.targetUniv} — ${profile.targetDept} (${profile.field}). Bu bölüm için AYT netleri belirleyici; haftada en az bir AYT denemesi ve eksik analizi öneririm.`;
      break;
    case 'machine':
      reply = `Yapay zeka ve teknoloji konularında temel kavramları (algoritma, veri, model) not defterine yaz. Kütüphanede arXiv makaleleri var; "Attention Is All You Need" gibi giriş metinleri okuyabilirsin.`;
      break;
    case 'human':
      reply = `İnsan ilişkileri ve duygular çalışma motivasyonunu doğrudan etkiler. Stres olduğunda hedefi küçült, küçük bir başarıyı kutla. İstersen bugün sadece 30 dakika odaklı çalışma planı yapalım — ne dersin?`;
      break;
    case 'society':
      reply = `Toplum ve güncel konular sosyal bilimler netlerine yansır. Haber okurken olay-neden-sonuç çıkar; coğrafya ve tarih sorularında güncel örnekleri not al.`;
      break;
    default: {
      const direct = buildDirectAnswerFallback(userMessage, context, intent);
      if (direct) {
        reply = direct;
        break;
      }
      const shortQ = userMessage.length > 80 ? `${userMessage.slice(0, 80)}…` : userMessage;
      reply = `"${shortQ}" diye sordun — net cevap vereyim:

Sorunu biraz daha açarsan (hangi ders, hangi konu, ne takıldın) doğrudan o noktaya odaklanırım. ${recentExamSummary ? `Deneme tarafında son durum: ${recentExamSummary}.` : 'İlk denemeni girersen kişisel öneri verebilirim.'}

İstersen şunlardan birini de yazabilirsin: plan, matematik, Türkçe/gramer, kütüphane, sınav hazırlığı.`;
      break;
    }
  }

  const prefix = profile.name ? `${profile.name}, ` : '';
  return sanitizeCoachOutput(`${prefix}${reply}${central}${traffic}`);
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

function tryEvaluateExpression(question: string): string | null {
  const exprMatch = question.match(/(\d+)\s*([+\-×x*÷/])\s*(\d+)/);
  if (!exprMatch) return null;
  const a = Number(exprMatch[1]);
  const op = exprMatch[2];
  const b = Number(exprMatch[3]);
  let result: number | null = null;
  if (op === '+' || op === '×' || op === 'x' || op === '*') result = op === '+' ? a + b : a * b;
  else if (op === '-') result = a - b;
  else if (op === '÷' || op === '/') result = b !== 0 ? a / b : null;
  if (result == null || Number.isNaN(result)) return null;
  return `1. **İlgili Formüller/Kurallar:** Temel aritmetik işlem.

2. **Adım Adım Detaylı Çözüm:**
${a} ${op} ${b} = **${Number.isInteger(result) ? result : result.toFixed(2)}**

3. **Kritik YKS Püf Noktası:** İşlem önceliğini (parantez → çarpma/bölme → toplama/çıkarma) kontrol edin.

4. **Pekiştirme:** Benzer 3 işlem sorusunu zihinden çözün.`;
}

function solveQuadratic(): string {
  return `1. **İlgili Formüller/Kurallar:**
İkinci derece denklem: ax² + bx + c = 0 → Δ = b² - 4ac

2. **Adım Adım Detaylı Çözüm:**
Katsayıları belirleyin → diskriminantı hesaplayın → kökleri x = (-b ± √Δ) / 2a ile bulun.

3. **Kritik YKS Püf Noktası:**
Δ < 0 ise reel kök yok; Δ = 0 tek kök; Δ > 0 iki farklı kök.

4. **Pekiştirme:** x² - 5x + 6 = 0 → kökler 2 ve 3.`;
}

function solveOhm(): string {
  return `1. **İlgili Formüller/Kurallar:**
Ohm yasası: V = I · R

2. **Adım Adım Detaylı Çözüm:**
Verilen iki büyüğü formüle yerleştirin, üçüncüyü bulun. Birim: V (volt), I (amper), R (ohm).

3. **Kritik YKS Püf Noktası:**
Seri devrede dirençler toplanır; paralelde 1/R = 1/R₁ + 1/R₂.

4. **Pekiştirme:** 12 V ve 4 Ω için akım kaç A? → 3 A`;
}

type TopicSolver = {
  subjects?: string[];
  pattern: RegExp;
  solve: () => string;
};

const TOPIC_SOLVERS: TopicSolver[] = [
  { subjects: ['Biyoloji'], pattern: /mitokondri|ozmotik|osmotik|turgor|ph/, solve: solveMitochondria },
  { pattern: /momentum|kuvvet.*uygulan|impuls|10\s*n.*5\s*s/i, solve: solveMomentum },
  { pattern: /ohm|direnç|akım|volt|amper/, solve: solveOhm },
  { pattern: /teğet|teget|egim|eğim|türev|trev/, solve: solveDerivativeTangent },
];

function tryTopicSolvers(subject: string, q: string): string | null {
  for (const { subjects, pattern, solve } of TOPIC_SOLVERS) {
    if (subjects && !subjects.includes(subject)) continue;
    if (!pattern.test(q)) continue;
    if (solve === solveDerivativeTangent && !/fonksiyon|f\(x\)|3x|x\^2|x²/.test(q)) continue;
    return solve();
  }
  return null;
}

function tryAcademicTermAnswer(question: string): string | null {
  const discipline = findDiscipline(question);
  if (discipline) return formatDiscipline(discipline);

  const words = question.split(/\s+/).filter((w) => w.length > 3);
  for (const word of words) {
    const entry = findTerm(word);
    if (entry) {
      return `1. **Kavram:** ${entry.tr} (${entry.en})

2. **Tanım:** ${entry.definition}

3. **YKS İpucu:** ${entry.yksTip}

4. **Analoji:** ${entry.analogy}`;
    }
    const wordDiscipline = findDiscipline(word);
    if (wordDiscipline) return formatDiscipline(wordDiscipline);
  }
  return null;
}

function solveBySubject(subject: string, question: string): string {
  const q = normalize(question);

  const arithmetic = tryEvaluateExpression(question);
  if (arithmetic) return arithmetic;

  const topicSolution = tryTopicSolvers(subject, q);
  if (topicSolution) return topicSolution;

  const conceptLesson = tryConceptLesson(subject, question);
  if (conceptLesson) return conceptLesson;

  if (/x\^2|x²|ikinci derece|diskriminant|kök/.test(q) && /denklem|x/.test(q)) {
    return solveQuadratic();
  }
  if (/paragraf|ana (fikir|düşünce)|çıkarım/.test(q)) {
    return `1. **İlgili Kurallar:** Ana düşünce genelde giriş veya sonuç cümlesinde; yardımcı düşünce detay verir.

2. **Adım Adım Çözüm:** Metni bölümlere ayırın → her bölümün konusunu tek cümleyle yazın → seçenekleri metin kanıtıyla eleyin.

3. **Kritik YKS Püf Noktası:** "En", "hiç", "daima" gibi mutlak ifadeler çoğu zaman yanlış şıktır.

4. **Pekiştirme:** Günlük 2 paragraf sorusu + yanlış analizi.`;
  }

  const termAnswer = tryAcademicTermAnswer(question);
  if (termAnswer) return termAnswer;

  return buildTeacherFallback(subject, question);
}

export async function generateQuestionSolution(
  subject: string,
  questionText: string,
  options?: { fromOcr?: boolean },
): Promise<string> {
  await delay(500);

  const text = questionText.trim();
  if (!text) {
    return `Soru metni okunamadı. Lütfen fotoğrafın net olduğundan emin olun veya metni elle yazın. Ders: ${subject}`;
  }

  const ocrNote = options?.fromOcr
    ? '📷 **Fotoğraftan okunan metin** ile çözüm:\n\n'
    : '';

  return `${ocrNote}${solveBySubject(subject, text)}`;
}
