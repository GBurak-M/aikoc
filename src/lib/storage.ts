import type { Exam } from './exams';

type PlannerTask = { id: string; text: string; category: string; done: boolean };
type StudyNote = { id: string; date: string; title: string; content: string; color: string };

/** Eski sürümlerde gösterilen örnek deneme verileri */
function isBundledDemoExams(exams: Exam[]): boolean {
  if (exams.length !== 2) return false;
  const names = new Set(exams.map((e) => e.name));
  return names.has('3D SİMÜLASYON') && names.has('LİMİT AYT-1');
}

function isBundledDemoTasks(tasks: PlannerTask[]): boolean {
  if (tasks.length !== 5) return false;
  return tasks.some((t) => t.id === 't1' && t.text.includes('Paragraf'));
}

function isBundledDemoNotes(notes: StudyNote[]): boolean {
  if (notes.length !== 2) return false;
  return notes.some((n) => n.id === 'n1' && n.title.includes('LOGARİTMA'));
}

export function loadInitialExams(): Exam[] {
  const exams = safeParse<Exam[]>('guidance_core_exams', []);
  if (isBundledDemoExams(exams)) {
    localStorage.removeItem('guidance_core_exams');
    return [];
  }
  return exams;
}

export function loadInitialTasks(): PlannerTask[] {
  const tasks = safeParse<PlannerTask[]>('guidance_core_tasks', []);
  if (isBundledDemoTasks(tasks)) {
    localStorage.removeItem('guidance_core_tasks');
    return [];
  }
  return tasks;
}

export function loadInitialNotes(): StudyNote[] {
  const notes = safeParse<StudyNote[]>('guidance_core_notes', []);
  if (isBundledDemoNotes(notes)) {
    localStorage.removeItem('guidance_core_notes');
    return [];
  }
  return notes;
}

export function safeParse<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`localStorage yazılamadı (${key}):`, error);
    return false;
  }
}

export function chatStorageKey(profileName: string): string {
  return `guidance_core_chat_${profileName}`;
}
