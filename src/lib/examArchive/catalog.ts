import type { ExamArchiveType, ExamPaper, PaperSource } from './types';

const CURRENT_YEAR = new Date().getFullYear();
const START_YEAR = CURRENT_YEAR - 19;

type ExamSpec = {
  type: ExamArchiveType;
  startYear: number;
  questions: number;
  duration: number;
  subjects: string[];
  sessions: (year: number) => string[];
};

const SPECS: ExamSpec[] = [
  {
    type: 'LGS',
    startYear: 2018,
    questions: 90,
    duration: 155,
    subjects: ['Türkçe', 'Matematik', 'Fen', 'İnkılap', 'Din', 'İngilizce'],
    sessions: () => ['Merkezi Sınav'],
  },
  {
    type: 'SBS',
    startYear: START_YEAR,
    questions: 100,
    duration: 120,
    subjects: ['Türkçe', 'Matematik', 'Fen', 'Sosyal'],
    sessions: (y) => (y <= 2017 ? ['Merkezi Sınav'] : []),
  },
  {
    type: 'TYT',
    startYear: START_YEAR,
    questions: 120,
    duration: 165,
    subjects: ['Türkçe', 'Matematik', 'Fen', 'Sosyal'],
    sessions: (y) => (y >= 2018 ? ['1. Oturum (TYT)'] : ['YGS Temel (TYT)']),
  },
  {
    type: 'AYT',
    startYear: START_YEAR,
    questions: 160,
    duration: 180,
    subjects: ['Matematik', 'Fen', 'Edebiyat', 'Sosyal-1', 'Sosyal-2', 'Dil'],
    sessions: (y) => (y >= 2018 ? ['2. Oturum (AYT)'] : ['LYS Alan (AYT)']),
  },
  {
    type: 'YKS',
    startYear: 2018,
    questions: 280,
    duration: 345,
    subjects: ['TYT + AYT'],
    sessions: () => ['Tam Oturum'],
  },
  {
    type: 'YDT',
    startYear: 2018,
    questions: 80,
    duration: 120,
    subjects: ['Yabancı Dil'],
    sessions: () => ['YDT Oturumu'],
  },
  {
    type: 'KPSS',
    startYear: START_YEAR,
    questions: 120,
    duration: 130,
    subjects: ['Genel Yetenek', 'Genel Kültür'],
    sessions: () => ['İlkbahar', 'Sonbahar'],
  },
  {
    type: 'KPSS_OABT',
    startYear: 2014,
    questions: 50,
    duration: 75,
    subjects: ['Eğitim Bilimleri', 'Alan Bilgisi'],
    sessions: () => ['ÖABT'],
  },
  {
    type: 'ALES',
    startYear: START_YEAR,
    questions: 100,
    duration: 180,
    subjects: ['Sayısal', 'Sözel'],
    sessions: () => ['İlkbahar', 'Sonbahar'],
  },
  {
    type: 'YDS',
    startYear: START_YEAR,
    questions: 80,
    duration: 180,
    subjects: ['Okuma', 'Kelime', 'Dil Bilgisi'],
    sessions: () => ['İlkbahar', 'Sonbahar'],
  },
  {
    type: 'DGS',
    startYear: START_YEAR,
    questions: 120,
    duration: 150,
    subjects: ['Sayısal', 'Sözel'],
    sessions: () => ['Merkezi Sınav'],
  },
  {
    type: 'MSÜ',
    startYear: 2018,
    questions: 120,
    duration: 165,
    subjects: ['TYT Benzeri', 'Matematik', 'Fen'],
    sessions: () => ['Askeri Öğrenci'],
  },
  {
    type: 'AOL',
    startYear: 2015,
    questions: 100,
    duration: 120,
    subjects: ['Türkçe', 'Matematik', 'Fen', 'Sosyal', 'Seçmeli'],
    sessions: () => ['Dönem Sınavı', 'Mezuniyet'],
  },
];

const FREE_PRACTICE: Array<{ type: ExamArchiveType; title: string; questions: number; duration: number }> = [
  { type: 'TYT', title: 'Ücretsiz TYT Branş Denemesi #1', questions: 40, duration: 55 },
  { type: 'TYT', title: 'Ücretsiz TYT Tam Deneme #2', questions: 120, duration: 165 },
  { type: 'AYT', title: 'Ücretsiz AYT Sayısal Deneme', questions: 80, duration: 90 },
  { type: 'LGS', title: 'Ücretsiz LGS Model Deneme', questions: 90, duration: 155 },
  { type: 'KPSS', title: 'Ücretsiz KPSS GY-GK Denemesi', questions: 60, duration: 70 },
  { type: 'ALES', title: 'Ücretsiz ALES Karma Deneme', questions: 50, duration: 90 },
  { type: 'YDS', title: 'Ücretsiz YDS Okuma Denemesi', questions: 40, duration: 60 },
  { type: 'DGS', title: 'Ücretsiz DGS Tam Deneme', questions: 120, duration: 150 },
  { type: 'AOL', title: 'Ücretsiz AÖL Model Deneme', questions: 80, duration: 100 },
];

function paperId(type: ExamArchiveType, year: number, session: string, source: PaperSource): string {
  const slug = session
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]+/gi, '-')
    .replace(/^-|-$/g, '');
  return `${type.toLowerCase()}-${year}-${slug}-${source}`;
}

function buildCikmisPaper(spec: ExamSpec, year: number, session: string): ExamPaper {
  const typeLabel = spec.type === 'SBS' && year >= 2018 ? '' : '';
  void typeLabel;
  return {
    id: paperId(spec.type, year, session, 'cikmis'),
    examType: spec.type,
    year,
    session,
    title: `${spec.type} ${year} — ${session} Çıkmış Sorular`,
    source: 'cikmis',
    questionCount: spec.questions,
    durationMinutes: spec.duration,
    subjects: spec.subjects,
  };
}

function buildCatalog(): ExamPaper[] {
  const papers: ExamPaper[] = [];

  for (const spec of SPECS) {
    for (let year = Math.max(spec.startYear, START_YEAR); year <= CURRENT_YEAR; year++) {
      if (spec.type === 'SBS' && year > 2017) continue;
      const sessions = spec.sessions(year);
      for (const session of sessions) {
        papers.push(buildCikmisPaper(spec, year, session));
      }
    }
  }

  FREE_PRACTICE.forEach((fp, idx) => {
    const spec = SPECS.find((s) => s.type === fp.type)!;
    papers.push({
      id: `free-${fp.type.toLowerCase()}-${idx + 1}`,
      examType: fp.type,
      year: CURRENT_YEAR,
      session: 'Ücretsiz Yayın',
      title: fp.title,
      source: 'ucretsiz_deneme',
      questionCount: fp.questions,
      durationMinutes: fp.duration,
      subjects: spec.subjects,
    });
  });

  return papers.sort((a, b) => {
    if (a.examType !== b.examType) return a.examType.localeCompare(b.examType, 'tr');
    if (a.year !== b.year) return b.year - a.year;
    if (a.source !== b.source) return a.source === 'cikmis' ? -1 : 1;
    return a.title.localeCompare(b.title, 'tr');
  });
}

export const EXAM_PAPER_CATALOG: ExamPaper[] = buildCatalog();

export function getPaperById(id: string): ExamPaper | undefined {
  return EXAM_PAPER_CATALOG.find((p) => p.id === id);
}

export function groupPapersByTypeAndYear(
  papers: ExamPaper[],
): Map<ExamArchiveType, Map<number, ExamPaper[]>> {
  const map = new Map<ExamArchiveType, Map<number, ExamPaper[]>>();
  for (const p of papers) {
    if (!map.has(p.examType)) map.set(p.examType, new Map());
    const yearMap = map.get(p.examType)!;
    if (!yearMap.has(p.year)) yearMap.set(p.year, []);
    yearMap.get(p.year)!.push(p);
  }
  return map;
}
