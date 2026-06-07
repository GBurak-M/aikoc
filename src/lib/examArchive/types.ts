export type ExamArchiveType =
  | 'LGS'
  | 'SBS'
  | 'TYT'
  | 'AYT'
  | 'YKS'
  | 'YDT'
  | 'KPSS'
  | 'KPSS_OABT'
  | 'ALES'
  | 'YDS'
  | 'DGS'
  | 'MSÜ'
  | 'AOL';

export type PaperSource = 'cikmis' | 'ucretsiz_deneme';

export type ChoiceKey = 'A' | 'B' | 'C' | 'D' | 'E';

export type ExamPaper = {
  id: string;
  examType: ExamArchiveType;
  year: number;
  session: string;
  title: string;
  source: PaperSource;
  questionCount: number;
  durationMinutes: number;
  subjects: string[];
};

export type ArchiveQuestion = {
  id: string;
  paperId: string;
  number: number;
  subject: string;
  stem: string;
  choices: { key: ChoiceKey; text: string }[];
  correctKey: ChoiceKey;
  explanation: string;
};

export type SubjectScore = {
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  accuracy: number;
};

export type PaperProgress = {
  paperId: string;
  currentIndex: number;
  answers: Record<number, ChoiceKey>;
  startedAt: string;
  updatedAt: string;
  completed: boolean;
  score?: { correct: number; total: number };
  subjectScores?: Record<string, SubjectScore>;
};

export const EXAM_TYPE_LABELS: Record<ExamArchiveType, string> = {
  LGS: 'LGS',
  SBS: 'SBS (LGS öncesi)',
  TYT: 'TYT',
  AYT: 'AYT',
  YKS: 'YKS (Tam Paket)',
  YDT: 'YDT',
  KPSS: 'KPSS (GY-GK)',
  KPSS_OABT: 'KPSS ÖABT',
  ALES: 'ALES',
  YDS: 'YDS / YÖKDİL',
  DGS: 'DGS',
  MSÜ: 'MSÜ',
  AOL: 'AÖL (Açık Öğretim Lisesi)',
};

export const SOURCE_LABELS: Record<PaperSource, string> = {
  cikmis: 'Çıkmış Sorular',
  ucretsiz_deneme: 'Ücretsiz Deneme',
};
