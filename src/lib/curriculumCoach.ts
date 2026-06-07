import { getCurriculumForGrade, type GradeLevel } from '../data/mebCurriculum';
import { findExamScoresForCurriculumSubject, type Exam } from './exams';
import type {
  CurriculumCoachReport,
  MemberCurriculumState,
  MemberEducationProfile,
  TopicProgress,
} from './memberEducation';
import { syncEffectiveGrade } from './memberEducation';
import type { MemberActivity } from './membership';

export function analyzeExamsAgainstCurriculum(
  exams: Exam[],
  grade: GradeLevel,
): Map<string, { subject: string; avgScore: number; weakTopics: string[] }> {
  const curriculum = getCurriculumForGrade(grade);
  const result = new Map<string, { subject: string; avgScore: number; weakTopics: string[] }>();

  for (const subj of curriculum.subjects) {
    const related = findExamScoresForCurriculumSubject(exams, subj.id, subj.name);
    if (related.length === 0) {
      result.set(subj.id, {
        subject: subj.name,
        avgScore: -1,
        weakTopics: subj.topics.filter((t) => t.priority === 'yks').map((t) => t.name),
      });
      continue;
    }

    const scores = related.map((r) => r.pct);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const weakTopics = subj.topics
      .filter((t) => avg < 60 || t.priority === 'yks')
      .slice(0, 4)
      .map((t) => t.name);

    result.set(subj.id, { subject: subj.name, avgScore: avg, weakTopics });
  }

  return result;
}

export function buildTopicProgress(
  exams: Exam[],
  activity: MemberActivity,
  grade: GradeLevel,
): TopicProgress[] {
  const curriculum = getCurriculumForGrade(grade);
  const progress: TopicProgress[] = [];
  const now = new Date().toISOString();

  for (const subj of curriculum.subjects) {
    const relatedScores = findExamScoresForCurriculumSubject(exams, subj.id, subj.name);
    const avg =
      relatedScores.length > 0
        ? Math.round(relatedScores.reduce((s, r) => s + r.pct, 0) / relatedScores.length)
        : 0;

    const manualTopics = activity.topics.filter(
      (t) => t.subject.toLowerCase().includes(subj.name.toLowerCase().split(' ')[0]),
    );

    for (const topic of subj.topics) {
      const manual = manualTopics.find((t) => t.topic.toLowerCase().includes(topic.name.toLowerCase().slice(0, 6)));
      const manualPct = manual ? Math.min(100, manual.progress) : 0;
      const examPct = avg > 0 ? avg : 0;
      const combined = Math.max(manualPct, examPct);
      const status: TopicProgress['status'] =
        combined >= 75 ? 'tamam' : combined >= 40 ? 'devam' : 'eksik';

      progress.push({
        topicId: topic.id,
        subjectId: subj.id,
        topicName: topic.name,
        progress: combined,
        status,
        source: manual ? 'manual' : relatedScores.length ? 'exam' : 'coach',
        updatedAt: now,
      });
    }
  }

  return progress;
}

export function generateCurriculumCoachReport(input: {
  education: MemberEducationProfile;
  exams: Exam[];
  activity: MemberActivity;
  completedTasks: number;
  totalTasks: number;
}): CurriculumCoachReport {
  const { education, exams, activity, completedTasks, totalTasks } = input;
  const grade = education.effectiveGrade;
  const analysis = analyzeExamsAgainstCurriculum(exams, grade);
  const curriculum = getCurriculumForGrade(grade);

  const prioritySubjects = [...analysis.entries()]
    .map(([, v]) => v)
    .filter((v) => v.avgScore < 70 || v.avgScore < 0)
    .sort((a, b) => (a.avgScore < 0 ? -1 : a.avgScore) - (b.avgScore < 0 ? -1 : b.avgScore))
    .slice(0, 5)
    .map((v) => ({
      subject: v.subject,
      weakTopics: v.weakTopics,
      recommendation:
        v.avgScore < 0
          ? `${v.subject} için henüz sınav verisi yok. Müfredat konularından başlayarak deneme ekleyin.`
          : v.avgScore < 50
            ? `${v.subject} kritik seviyede (≈%${v.avgScore}). Zayıf konulara günde 45 dk ayırın.`
            : `${v.subject} geliştirilebilir (≈%${v.avgScore}). YKS öncelikli konulara odaklanın.`,
    }));

  if (prioritySubjects.length === 0) {
    const first = [...analysis.values()][0];
    if (first) {
      prioritySubjects.push({
        subject: first.subject,
        weakTopics: first.weakTopics.slice(0, 3),
        recommendation: 'Genel performans iyi; tekrar ve deneme sıklığını koruyun.',
      });
    }
  }

  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const examCount = exams.length;
  const homeworkCount = activity.homework.filter((h) => h.status !== 'tamamlandi').length;

  const location =
    [education.mahalle, education.ilce, education.il, education.ulke].filter(Boolean).join(', ') ||
    'Konum belirtilmedi';
  const schoolLine = education.school ? `${education.school} · ` : '';

  const summary = [
    `${schoolLine}${grade}. sınıf (${education.curriculumLabel}) müfredatına göre kişisel koçluk raporu.`,
    `Konum: ${location}.`,
    `MEB: ${education.mebFramework}. YÖK/YKS: ${education.yokAlignment}.`,
    examCount > 0
      ? `${examCount} sınav kaydı analiz edildi.`
      : 'Henüz sınav kaydı yok; müfredat konularından başlamanız önerilir.',
    homeworkCount > 0 ? `${homeworkCount} bekleyen ödev var.` : '',
    `Görev tamamlama: %${taskPct}.`,
    education.yksField ? `Alan hedefi: ${education.yksField}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const weeklyPlan = [
    'Pzt–Sal: Zayıf derste konu anlatımı + 20 soru',
    'Çar: Deneme analizi (üye paneli sınavlar)',
    'Per: Eksik konu tekrarı (müfredat haritası)',
    'Cum: Haftalık mini deneme',
    'Cmt: Ödev ve konu takibi güncelleme',
    'Paz: Dinlenme + hafif tekrar',
  ];

  if (prioritySubjects[0]) {
    weeklyPlan[0] = `Pzt–Sal: ${prioritySubjects[0].subject} — ${prioritySubjects[0].weakTopics[0] ?? 'temel konular'}`;
  }

  return {
    generatedAt: new Date().toISOString(),
    effectiveGrade: grade,
    summary,
    prioritySubjects,
    weeklyPlan,
    mebNote: education.webEnrichmentNote || education.mebFramework,
    yokNote: education.yokAlignment,
  };
}

export function runCoachCycle(input: {
  state: MemberCurriculumState;
  exams: Exam[];
  activity: MemberActivity;
  completedTasks: number;
  totalTasks: number;
}): MemberCurriculumState {
  const education = syncEffectiveGrade({ ...input.state.education });

  const topicProgress = buildTopicProgress(input.exams, input.activity, education.effectiveGrade);
  const report = generateCurriculumCoachReport({
    education,
    exams: input.exams,
    activity: input.activity,
    completedTasks: input.completedTasks,
    totalTasks: input.totalTasks,
  });

  return {
    education,
    topicProgress,
    coachReports: [report, ...input.state.coachReports].slice(0, 30),
    lastBackgroundRunAt: new Date().toISOString(),
  };
}
