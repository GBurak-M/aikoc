import { parseExamDate, type Exam } from './exams';
import type { HomeworkItem, ProgressSnapshot, TopicTrackItem } from './membership';

export type GrowthPeriod = 'daily' | 'weekly' | 'monthly' | '3month' | '6month' | 'yearly';

const PERIOD_MS: Record<GrowthPeriod, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  '3month': 90 * 24 * 60 * 60 * 1000,
  '6month': 180 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

export const PERIOD_LABELS: Record<GrowthPeriod, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  '3month': '3 Aylık',
  '6month': '6 Aylık',
  yearly: 'Yıllık',
};

export type PeriodStats = {
  period: GrowthPeriod;
  label: string;
  examCount: number;
  avgNet: number;
  netDelta: number | null;
  avgAccuracy: number;
  accuracyDelta: number | null;
  homeworkDone: number;
  homeworkTotal: number;
  topicAvgProgress: number;
  topicCount: number;
  chartPoints: { label: string; net: number }[];
};

function filterExamsInPeriod(exams: Exam[], period: GrowthPeriod): Exam[] {
  const cutoff = Date.now() - PERIOD_MS[period];
  return exams.filter((e) => parseExamDate(e.date) >= cutoff);
}

function filterSnapshotsInPeriod(snapshots: ProgressSnapshot[], period: GrowthPeriod): ProgressSnapshot[] {
  const cutoff = Date.now() - PERIOD_MS[period];
  return snapshots.filter((s) => new Date(s.at).getTime() >= cutoff);
}

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
}

export function computePeriodStats(
  period: GrowthPeriod,
  exams: Exam[],
  homework: HomeworkItem[],
  topics: TopicTrackItem[],
  snapshots: ProgressSnapshot[],
): PeriodStats {
  const periodExams = filterExamsInPeriod(exams, period);
  const periodSnapshots = filterSnapshotsInPeriod(snapshots, period);

  const nets = periodExams.map((e) => e.totalNet);
  const accuracies = periodExams.map((e) => e.accuracy);

  const hwInPeriod = homework.filter(
    (h) => Date.now() - new Date(h.createdAt).getTime() <= PERIOD_MS[period],
  );
  const topicsInPeriod = topics.filter(
    (t) => Date.now() - new Date(t.updatedAt).getTime() <= PERIOD_MS[period],
  );

  let netDelta: number | null = null;
  let accuracyDelta: number | null = null;

  if (periodSnapshots.length >= 2) {
    const oldest = periodSnapshots[periodSnapshots.length - 1];
    const newest = periodSnapshots[0];
    netDelta = parseFloat((newest.avgNet - oldest.avgNet).toFixed(1));
    accuracyDelta = newest.avgAccuracy - oldest.avgAccuracy;
  } else if (periodExams.length >= 2) {
    const sorted = [...periodExams].sort((a, b) => parseExamDate(a.date) - parseExamDate(b.date));
    netDelta = parseFloat((sorted[sorted.length - 1].totalNet - sorted[0].totalNet).toFixed(1));
    accuracyDelta = sorted[sorted.length - 1].accuracy - sorted[0].accuracy;
  }

  const chartPoints = [...periodExams]
    .sort((a, b) => parseExamDate(a.date) - parseExamDate(b.date))
    .map((e) => ({
      label: e.date,
      net: e.totalNet,
    }));

  return {
    period,
    label: PERIOD_LABELS[period],
    examCount: periodExams.length,
    avgNet: avg(nets),
    netDelta,
    avgAccuracy: avg(accuracies),
    accuracyDelta,
    homeworkDone: hwInPeriod.filter((h) => h.status === 'tamamlandi').length,
    homeworkTotal: hwInPeriod.length,
    topicAvgProgress:
      topicsInPeriod.length > 0
        ? Math.round(
            topicsInPeriod.reduce((s, t) => s + t.progress, 0) / topicsInPeriod.length,
          )
        : topics.length > 0
          ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length)
          : 0,
    topicCount: topicsInPeriod.length || topics.length,
    chartPoints,
  };
}

export function computeAllPeriodStats(
  exams: Exam[],
  homework: HomeworkItem[],
  topics: TopicTrackItem[],
  snapshots: ProgressSnapshot[],
): PeriodStats[] {
  const periods: GrowthPeriod[] = ['daily', 'weekly', 'monthly', '3month', '6month', 'yearly'];
  return periods.map((p) => computePeriodStats(p, exams, homework, topics, snapshots));
}
