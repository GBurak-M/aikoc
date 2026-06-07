import { pickLesson, type BuiltLesson } from './registry';
import { MATH_PHYSICS_LESSONS } from './lessons/mathPhysics';
import { CHEMISTRY_LESSONS } from './lessons/chemistry';
import { BIOLOGY_LESSONS } from './lessons/biology';
import { HUMANITIES_LESSONS } from './lessons/humanities';
import { EARTH_SPACE_LESSONS } from './lessons/earthSpace';
import { FIQH_LESSONS } from './lessons/fiqh';

/** Tüm öğretmen ders bankası — pattern eşleşmesi dropdown dersinden bağımsız çalışır */
const ALL_LESSONS: BuiltLesson[] = [
  ...MATH_PHYSICS_LESSONS,
  ...CHEMISTRY_LESSONS,
  ...BIOLOGY_LESSONS,
  ...HUMANITIES_LESSONS,
  ...EARTH_SPACE_LESSONS,
  ...FIQH_LESSONS,
];

export function tryTeacherKnowledge(question: string): string | null {
  if (!question?.trim()) return null;
  return pickLesson(ALL_LESSONS, question);
}

export function countTeacherLessons(): number {
  return ALL_LESSONS.length;
}

export { ALL_LESSONS };
