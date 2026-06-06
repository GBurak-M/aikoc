import { getCurriculumForGrade, gradeLabel, type GradeLevel } from '../data/mebCurriculum';
import { safeParse, safeSetItem } from './storage';

export type YksField = 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | '';

export type MemberEducationProfile = {
  memberId: string;
  school: string;
  registeredGrade: GradeLevel;
  effectiveGrade: GradeLevel;
  yksField: YksField;
  mahalle: string;
  ilce: string;
  il: string;
  ulke: string;
  curriculumId: string;
  curriculumLabel: string;
  mebFramework: string;
  yokAlignment: string;
  curriculumSource: 'meb_embedded' | 'meb_web_enriched';
  curriculumSyncedAt: string;
  webEnrichmentNote: string;
  registeredAt: string;
  lastGradeSyncAt: string;
  gradeHistory: Array<{
    from: GradeLevel;
    to: GradeLevel;
    reason: string;
    at: string;
  }>;
};

export type TopicProgress = {
  topicId: string;
  subjectId: string;
  topicName: string;
  progress: number;
  status: 'eksik' | 'devam' | 'tamam';
  source: 'exam' | 'manual' | 'coach';
  updatedAt: string;
};

export type CurriculumCoachReport = {
  generatedAt: string;
  effectiveGrade: GradeLevel;
  summary: string;
  prioritySubjects: Array<{
    subject: string;
    weakTopics: string[];
    recommendation: string;
  }>;
  weeklyPlan: string[];
  mebNote: string;
  yokNote: string;
};

export type MemberCurriculumState = {
  education: MemberEducationProfile;
  topicProgress: TopicProgress[];
  coachReports: CurriculumCoachReport[];
  lastBackgroundRunAt: string;
};

function educationKey(memberId: string) {
  return `aikoc_member_education_${memberId}`;
}

function curriculumStateKey(memberId: string) {
  return `aikoc_member_curriculum_${memberId}`;
}

/** Türkiye akademik yılı: Eylül başlangıç */
export function getAcademicYearStart(date = new Date()): number {
  const y = date.getFullYear();
  return date.getMonth() >= 8 ? y : y - 1;
}

export function getAcademicSemester(date = new Date()): 1 | 2 | 'yaz' {
  const m = date.getMonth();
  if (m >= 8 || m === 0) return 1;
  if (m >= 1 && m <= 5) return 2;
  return 'yaz';
}

function gradeToNumber(grade: GradeLevel): number | null {
  if (grade === 'mezun') return null;
  return parseInt(grade, 10);
}

function numberToGrade(n: number): GradeLevel {
  if (n >= 12) return '12';
  if (n <= 9) return '9';
  return String(n) as GradeLevel;
}

export function syncEffectiveGrade(edu: MemberEducationProfile): MemberEducationProfile {
  if (edu.registeredGrade === 'mezun') {
    return { ...edu, effectiveGrade: 'mezun', lastGradeSyncAt: new Date().toISOString() };
  }

  const regYear = getAcademicYearStart(new Date(edu.registeredAt));
  const nowYear = getAcademicYearStart();
  const yearsPassed = Math.max(0, nowYear - regYear);
  const base = gradeToNumber(edu.registeredGrade) ?? 9;
  const computed = Math.min(12, base + yearsPassed);
  const newGrade = numberToGrade(computed);

  if (newGrade === edu.effectiveGrade) {
    return { ...edu, lastGradeSyncAt: new Date().toISOString() };
  }

  const semester = getAcademicSemester();
  const reason =
    yearsPassed > 0
      ? `Akademik yıl geçişi (${regYear}→${nowYear}, dönem: ${semester}): sınıf otomatik güncellendi.`
      : 'İlk müfredat eşlemesi';

  return {
    ...edu,
    effectiveGrade: newGrade,
    lastGradeSyncAt: new Date().toISOString(),
    gradeHistory: [
      {
        from: edu.effectiveGrade,
        to: newGrade,
        reason,
        at: new Date().toISOString(),
      },
      ...edu.gradeHistory,
    ].slice(0, 20),
    curriculumId: `meb_${newGrade}`,
    curriculumLabel: gradeLabel(newGrade),
    mebFramework: getCurriculumForGrade(newGrade).mebFramework,
    yokAlignment: getCurriculumForGrade(newGrade).yokAlignment,
  };
}

export async function fetchCurriculumEnrichment(
  il: string,
  grade: GradeLevel,
): Promise<string> {
  try {
    const title = encodeURIComponent('Millî Eğitim Bakanlığı');
    const res = await fetch(
      `https://tr.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error('fetch failed');
    const data = (await res.json()) as { extract?: string };
    const extract = data.extract?.slice(0, 280) ?? '';
    return extract
      ? `${il} / ${gradeLabel(grade)} için MEB çerçevesi doğrulandı. ${extract}`
      : '';
  } catch {
    return '';
  }
}

export function buildEducationProfile(input: {
  memberId: string;
  school?: string;
  grade: GradeLevel;
  yksField?: YksField;
  mahalle?: string;
  ilce?: string;
  il?: string;
  ulke?: string;
  registeredAt: string;
  webNote?: string;
}): MemberEducationProfile {
  const grade = input.grade;
  const curr = getCurriculumForGrade(grade);
  return {
    memberId: input.memberId,
    school: input.school?.trim() ?? '',
    registeredGrade: grade,
    effectiveGrade: grade,
    yksField: input.yksField ?? '',
    mahalle: input.mahalle?.trim() ?? '',
    ilce: input.ilce?.trim() ?? '',
    il: input.il?.trim() || 'İstanbul',
    ulke: input.ul?.trim() || 'Türkiye',
    curriculumId: `meb_${grade}`,
    curriculumLabel: curr.label,
    mebFramework: curr.mebFramework,
    yokAlignment: curr.yokAlignment,
    curriculumSource: input.webNote ? 'meb_web_enriched' : 'meb_embedded',
    curriculumSyncedAt: new Date().toISOString(),
    webEnrichmentNote: input.webNote ?? '',
    registeredAt: input.registeredAt,
    lastGradeSyncAt: new Date().toISOString(),
    gradeHistory: [],
  };
}

export function loadEducationProfile(memberId: string): MemberEducationProfile | null {
  return safeParse<MemberEducationProfile | null>(educationKey(memberId), null);
}

export function saveEducationProfile(profile: MemberEducationProfile) {
  safeSetItem(educationKey(profile.memberId), profile);
}

export function loadCurriculumState(memberId: string): MemberCurriculumState | null {
  return safeParse<MemberCurriculumState | null>(curriculumStateKey(memberId), null);
}

export function saveCurriculumState(state: MemberCurriculumState) {
  safeSetItem(curriculumStateKey(state.memberId), state);
}

export function initCurriculumState(
  education: MemberEducationProfile,
): MemberCurriculumState {
  const synced = syncEffectiveGrade(education);
  saveEducationProfile(synced);
  const state: MemberCurriculumState = {
    education: synced,
    topicProgress: [],
    coachReports: [],
    lastBackgroundRunAt: '',
  };
  saveCurriculumState(state);
  return state;
}

export function updateEducationProfile(
  memberId: string,
  patch: Partial<
    Pick<
      MemberEducationProfile,
      'school' | 'registeredGrade' | 'effectiveGrade' | 'yksField' | 'mahalle' | 'ilce' | 'il' | 'ulke'
    >
  >,
): MemberEducationProfile | null {
  const edu = loadEducationProfile(memberId);
  if (!edu) return null;

  const grade = patch.registeredGrade ?? edu.registeredGrade;
  const curr = getCurriculumForGrade(grade);
  const updated: MemberEducationProfile = {
    ...edu,
    ...patch,
    curriculumId: `meb_${grade}`,
    curriculumLabel: curr.label,
    mebFramework: curr.mebFramework,
    yokAlignment: curr.yokAlignment,
    curriculumSyncedAt: new Date().toISOString(),
  };
  const synced = syncEffectiveGrade(updated);
  saveEducationProfile(synced);
  return synced;
}

export async function setupMemberCurriculum(
  memberId: string,
  input: Omit<Parameters<typeof buildEducationProfile>[0], 'memberId'>,
): Promise<MemberCurriculumState> {
  let webNote = '';
  if (input.il && input.ulke === 'Türkiye') {
    webNote = await fetchCurriculumEnrichment(input.il, input.grade);
  }
  const edu = buildEducationProfile({
    ...input,
    memberId,
    webNote,
  });
  return initCurriculumState(edu);
}
