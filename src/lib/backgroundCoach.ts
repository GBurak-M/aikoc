import { runCoachCycle } from './curriculumCoach';
import {
  loadCurriculumState,
  loadEducationProfile,
  saveCurriculumState,
  saveEducationProfile,
  syncEffectiveGrade,
  type MemberCurriculumState,
} from './memberEducation';
import type { Exam } from './exams';
import { loadMemberActivity, type MemberAccount } from './membership';

const COACH_INTERVAL_MS = 5 * 60 * 1000;
let intervalId: ReturnType<typeof setInterval> | null = null;
let activeMemberId: string | null = null;

export type CoachRuntimeInput = {
  member: MemberAccount;
  exams: Exam[];
  completedTasks: number;
  totalTasks: number;
};

export function runMemberCoachOnce(input: CoachRuntimeInput): MemberCurriculumState | null {
  const { member, exams, completedTasks, totalTasks } = input;
  let state = loadCurriculumState(member.id);
  const edu = loadEducationProfile(member.id);

  if (!edu) return null;
  if (!state) {
    state = {
      education: syncEffectiveGrade(edu),
      topicProgress: [],
      coachReports: [],
      lastBackgroundRunAt: '',
    };
  }

  const activity = loadMemberActivity(member.id);
  const next = runCoachCycle({
    state,
    exams,
    activity,
    completedTasks,
    totalTasks,
  });

  saveEducationProfile(next.education);
  saveCurriculumState(next);
  return next;
}

export type CoachRuntimeGetter = () => CoachRuntimeInput;

export function startBackgroundCoach(
  getInput: CoachRuntimeGetter,
  onUpdate?: (state: MemberCurriculumState) => void,
) {
  stopBackgroundCoach();

  const first = getInput();
  activeMemberId = first.member.id;

  const tick = () => {
    const input = getInput();
    if (activeMemberId !== input.member.id) return;
    const result = runMemberCoachOnce(input);
    if (result && onUpdate) onUpdate(result);
  };

  tick();
  intervalId = setInterval(tick, COACH_INTERVAL_MS);
}

export function stopBackgroundCoach() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  activeMemberId = null;
}

export function isBackgroundCoachRunning(): boolean {
  return intervalId !== null;
}
