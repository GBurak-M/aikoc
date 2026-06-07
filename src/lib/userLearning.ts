import { safeParse, safeSetItem } from './storage';
import type { ArchiveSubjectStat } from './examArchive/stats';
import type { SubjectAverage } from './exams';
import type { WorldSnapshot } from './worldData';

const PROFILE_KEY = 'aikoc_user_learning_profile';

export type LearningProfile = {
  totalAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  wrongBySubject: Record<string, number>;
  correctBySubject: Record<string, number>;
  consecutiveSessions: number;
  lastSessionDate: string;
  moraleLevel: 'yüksek' | 'orta' | 'destek';
  improvementTips: string[];
  lastWebDigestAt: string | null;
};

function emptyProfile(): LearningProfile {
  return {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    wrongBySubject: {},
    correctBySubject: {},
    consecutiveSessions: 0,
    lastSessionDate: '',
    moraleLevel: 'yüksek',
    improvementTips: [],
    lastWebDigestAt: null,
  };
}

export function loadLearningProfile(): LearningProfile {
  return safeParse<LearningProfile>(PROFILE_KEY, emptyProfile());
}

function saveProfile(profile: LearningProfile): void {
  safeSetItem(PROFILE_KEY, profile);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function recordQuestionOutcome(subject: string, correct: boolean): LearningProfile {
  const profile = loadLearningProfile();
  const today = todayKey();

  profile.totalAnswered += 1;
  if (correct) {
    profile.totalCorrect += 1;
    profile.correctBySubject[subject] = (profile.correctBySubject[subject] ?? 0) + 1;
  } else {
    profile.totalWrong += 1;
    profile.wrongBySubject[subject] = (profile.wrongBySubject[subject] ?? 0) + 1;
  }

  if (profile.lastSessionDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    profile.consecutiveSessions =
      profile.lastSessionDate === yKey ? profile.consecutiveSessions + 1 : 1;
    profile.lastSessionDate = today;
  }

  const accuracy =
    profile.totalAnswered > 0
      ? profile.totalCorrect / profile.totalAnswered
      : 0;
  profile.moraleLevel =
    accuracy >= 0.65 ? 'yüksek' : accuracy >= 0.45 ? 'orta' : 'destek';

  saveProfile(profile);
  return profile;
}

export function recordArchiveTestComplete(
  bySubject: Record<string, { correct: number; wrong: number }>,
): LearningProfile {
  let profile = loadLearningProfile();
  for (const [subject, s] of Object.entries(bySubject)) {
    for (let i = 0; i < s.correct; i++) {
      profile = recordQuestionOutcome(subject, true);
    }
    for (let i = 0; i < s.wrong; i++) {
      profile = recordQuestionOutcome(subject, false);
    }
  }
  return profile;
}

export function syncWebDigest(world: WorldSnapshot | null | undefined): string[] {
  if (!world) return [];
  const profile = loadLearningProfile();
  const digestAt = world.fetchedAt;
  if (profile.lastWebDigestAt === digestAt) {
    return profile.improvementTips;
  }

  const tips: string[] = [];
  const topics = world.scienceTopics ?? [];
  for (const t of topics.slice(0, 3)) {
    if (t.articles[0]) {
      tips.push(
        `${t.field} alanında güncel makale: "${t.articles[0].title.slice(0, 60)}…" — bu konuyu deneme analizinde tekrar edin.`,
      );
    }
  }
  if (world.calendar.yksCountdownDays != null) {
    tips.push(
      `YKS'ye yaklaşık ${world.calendar.yksCountdownDays} gün kaldı; zayıf alanlarınıza günde 45 dk ayırın.`,
    );
  }

  profile.lastWebDigestAt = digestAt;
  profile.improvementTips = [...tips, ...profile.improvementTips].slice(0, 12);
  saveProfile(profile);
  return profile.improvementTips;
}

export function deriveImprovementTips(
  archiveStats: ArchiveSubjectStat[],
  manualAverages: SubjectAverage[],
): string[] {
  const tips: string[] = [];

  const weakArchive = archiveStats.filter((s) => s.accuracy < 55 && s.total >= 3).slice(0, 2);
  for (const w of weakArchive) {
    tips.push(
      `${w.subject}: arşiv testlerinde %${w.accuracy} başarı — haftada 3 gün 30 dk konu + 20 dk soru çözün.`,
    );
  }

  const weakManual = [...manualAverages].sort((a, b) => a.percentage - b.percentage).slice(0, 1);
  for (const w of weakManual) {
    if (w.percentage < 70) {
      tips.push(
        `Deneme kayıtlarında ${w.subject} ort. %${w.percentage} — yanlışlarınızı soru çözücüye taşıyın.`,
      );
    }
  }

  return tips.slice(0, 5);
}

export function buildLearningCoachSummary(
  archiveStats: ArchiveSubjectStat[],
  manualAverages: SubjectAverage[],
  world?: WorldSnapshot | null,
): string {
  const profile = loadLearningProfile();
  const webTips = syncWebDigest(world);
  const derived = deriveImprovementTips(archiveStats, manualAverages);

  const topWrong = Object.entries(profile.wrongBySubject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s, n]) => `${s}: ${n} yanlış`)
    .join(' · ');

  const lines = [
    `Çözülen soru: ${profile.totalAnswered} (doğru ${profile.totalCorrect}, yanlış ${profile.totalWrong})`,
    profile.consecutiveSessions > 1
      ? `Arka arkaya ${profile.consecutiveSessions} gün çalışma — harika istikrar!`
      : 'Bugün çalışmaya başladınız; küçük adımlar büyük fark yaratır.',
    topWrong ? `En çok takıldığınız alanlar: ${topWrong}` : '',
    derived.length ? `Kişisel gelişim önerileri:\n${derived.map((t) => `• ${t}`).join('\n')}` : '',
    webTips.length ? `İnternet güncellemelerinden öğrenilenler:\n${webTips.slice(0, 3).map((t) => `• ${t}`).join('\n')}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}
