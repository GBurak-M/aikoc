import type { Exam } from './exams';
import { getSubjectAverages, type SubjectAverage } from './exams';
import type { GradeLevel } from '../data/mebCurriculum';
import { getCurriculumForGrade } from '../data/mebCurriculum';

/**
 * Araştırma özeti (YKS koçluk kaynakları):
 * - Zayıf derse toplam çalışma süresinin %35–45'i, orta derse %25–30, güçlü derse %15–20 ayrılır.
 * - Günlük etkili çalışma: lise/mezun için 3–5 saat; 9–10. sınıf için 2–3 saat önerilir.
 * - Pomodoro: 25 dk odak + 5 dk mola; derse geçmeden önce 10 dk tekrar.
 * - Haftada en az 1 tam deneme + günlük 20–40 dk paragraf (TYT Türkçe) dengesi korunmalı.
 */
export const STUDY_TIME_RESEARCH_NOTE =
  'Öneriler: zayıf derse ağırlık, güçlü derse bakım; günlük süre sınıf düzeyine göre ölçeklenir (kaynak: YKS koçluk ve zaman yönetimi rehberleri).';

export type DailySubjectPlan = {
  subject: string;
  minutes: number;
  reason: string;
  priority: 'yüksek' | 'orta' | 'düşük';
};

export type StudyTimeReport = {
  grade: GradeLevel;
  totalDailyMinutes: number;
  totalDailyLabel: string;
  subjects: DailySubjectPlan[];
  summary: string;
  researchNote: string;
};

function baseDailyMinutes(grade: GradeLevel): number {
  if (grade === '9' || grade === '10') return 150;
  if (grade === '11') return 210;
  if (grade === '12' || grade === 'mezun') return 270;
  return 180;
}

function weaknessWeight(percentage: number): number {
  if (percentage < 0) return 1.4;
  if (percentage < 45) return 1.35;
  if (percentage < 60) return 1.15;
  if (percentage < 75) return 0.95;
  return 0.75;
}

export function buildStudyTimeReport(exams: Exam[], grade: GradeLevel = '11'): StudyTimeReport {
  const curriculum = getCurriculumForGrade(grade);
  const averages = getSubjectAverages(exams);
  const avgMap = new Map(averages.map((a) => [a.subject, a]));

  const subjectRows: Array<{ subject: string; percentage: number; avgNet: number }> = [];

  for (const subj of curriculum.subjects) {
    let best: SubjectAverage | undefined;
    for (const avg of averages) {
      if (
        avg.subject.toLowerCase().includes(subj.name.toLowerCase().split(' ')[0]) ||
        subj.name.toLowerCase().includes(avg.subject.toLowerCase().split(' ')[0])
      ) {
        if (!best || avg.percentage < best.percentage) best = avg;
      }
    }
    subjectRows.push({
      subject: subj.name,
      percentage: best?.percentage ?? -1,
      avgNet: best?.avgNet ?? 0,
    });
  }

  for (const avg of averages) {
    if (!subjectRows.some((r) => r.subject === avg.subject)) {
      subjectRows.push({ subject: avg.subject, percentage: avg.percentage, avgNet: avg.avgNet });
    }
  }

  const totalBase = baseDailyMinutes(grade);
  const weights = subjectRows.map((r) => ({
    ...r,
    w: weaknessWeight(r.percentage),
  }));
  const sumW = weights.reduce((s, r) => s + r.w, 0) || 1;

  const plans: DailySubjectPlan[] = weights
    .map((r) => {
      const minutes = Math.max(15, Math.round((r.w / sumW) * totalBase));
      const priority: DailySubjectPlan['priority'] =
        r.percentage < 0 || r.percentage < 50
          ? 'yüksek'
          : r.percentage < 70
            ? 'orta'
            : 'düşük';
      const reason =
        r.percentage < 0
          ? 'Henüz deneme verisi yok — müfredat önceliği'
          : r.percentage < 50
            ? `Düşük performans (%${r.percentage}) — öncelikli çalışma`
            : r.percentage < 70
              ? `Geliştirilebilir (%${r.percentage}) — düzenli tekrar`
              : `İyi seviye (%${r.percentage}) — bakım ve soru`;
      return { subject: r.subject, minutes, reason, priority };
    })
    .sort((a, b) => b.minutes - a.minutes);

  const allocated = plans.reduce((s, p) => s + p.minutes, 0);
  const diff = totalBase - allocated;
  if (diff !== 0 && plans[0]) plans[0].minutes += diff;

  const weak = plans.filter((p) => p.priority === 'yüksek').slice(0, 2).map((p) => p.subject);
  const summary =
    exams.length === 0
      ? `${grade}. sınıf müfredatına göre günlük ~${Math.round(totalBase / 60)} saat çalışma planı oluşturuldu. İlk deneme sonucunu girince süreler otomatik kişiselleşir.`
      : weak.length > 0
        ? `Son ${exams.length} denemeye göre bugün öncelik: ${weak.join(', ')}. Toplam ~${Math.round(totalBase / 60)} saat.`
        : `Genel denge iyi; toplam ~${Math.round(totalBase / 60)} saat ile deneme + tekrar ritmini koru.`;

  return {
    grade,
    totalDailyMinutes: totalBase,
    totalDailyLabel: `${Math.floor(totalBase / 60)} sa ${totalBase % 60} dk`,
    subjects: plans,
    summary,
    researchNote: STUDY_TIME_RESEARCH_NOTE,
  };
}

export function formatStudyTimeReport(report: StudyTimeReport): string {
  const lines = report.subjects
    .slice(0, 8)
    .map((p) => `• ${p.subject}: ${p.minutes} dk/gün — ${p.reason}`);
  return `📚 Günlük Çalışma Planı (${report.totalDailyLabel})
${report.summary}

${lines.join('\n')}

${report.researchNote}`;
}
