export type ExamType = 'TYT' | 'AYT';

export type Exam = {
  id: string;
  name: string;
  type: ExamType;
  date: string;
  notes: string;
  scores: Record<string, { correct: number; wrong: number; net: number }>;
  totalNet: number;
  accuracy: number;
};

export function parseExamDate(dateStr: string): number {
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day).getTime();
  }
  return new Date(dateStr).getTime();
}

export function sortExamsByDate<T extends { date: string }>(exams: T[]): T[] {
  return [...exams].sort((a, b) => parseExamDate(a.date) - parseExamDate(b.date));
}

export function getLatestExamByType(exams: Exam[], type: ExamType): Exam | null {
  const filtered = exams.filter((exam) => exam.type === type);
  if (filtered.length === 0) return null;
  return sortExamsByDate(filtered).at(-1) ?? null;
}

export function getExamsForChart(exams: Exam[]) {
  return sortExamsByDate(exams).map((exam) => ({
    ...exam,
    chartLabel: `${exam.date} · ${exam.name.length > 14 ? `${exam.name.slice(0, 14)}…` : exam.name}`,
  }));
}

export type SubjectAverage = {
  subject: string;
  avgNet: number;
  maxQ: number;
  percentage: number;
};

export function getSubjectAverages(exams: Exam[]): SubjectAverage[] {
  const buckets = {
    Matematik: { net: 0, count: 0, maxTotal: 0 },
    'Türkçe / Edebiyat': { net: 0, count: 0, maxTotal: 0 },
    'Fen Bilimleri': { net: 0, count: 0, maxTotal: 0 },
    'Sosyal Bilimler': { net: 0, count: 0, maxTotal: 0 },
  };

  exams.forEach((exam) => {
    if (exam.scores?.Matematik) {
      buckets.Matematik.net += exam.scores.Matematik.net || 0;
      buckets.Matematik.count += 1;
      buckets.Matematik.maxTotal += 40;
    }

    if (exam.scores?.Türkçe) {
      buckets['Türkçe / Edebiyat'].net += exam.scores.Türkçe.net || 0;
      buckets['Türkçe / Edebiyat'].count += 1;
      buckets['Türkçe / Edebiyat'].maxTotal += 40;
    }

    if (exam.scores?.Edebiyat) {
      buckets['Türkçe / Edebiyat'].net += exam.scores.Edebiyat.net || 0;
      buckets['Türkçe / Edebiyat'].count += 1;
      buckets['Türkçe / Edebiyat'].maxTotal += 24;
    }

    if (exam.scores?.Fen) {
      buckets['Fen Bilimleri'].net += exam.scores.Fen.net || 0;
      buckets['Fen Bilimleri'].count += 1;
      buckets['Fen Bilimleri'].maxTotal += exam.type === 'TYT' ? 20 : 40;
    }

    if (exam.scores?.Sosyal) {
      buckets['Sosyal Bilimler'].net += exam.scores.Sosyal.net || 0;
      buckets['Sosyal Bilimler'].count += 1;
      buckets['Sosyal Bilimler'].maxTotal += exam.type === 'TYT' ? 20 : 40;
    }
  });

  return Object.entries(buckets).map(([subject, data]) => {
    const avgNet = data.count > 0 ? parseFloat((data.net / data.count).toFixed(1)) : 0;
    const avgMax = data.count > 0 ? data.maxTotal / data.count : 40;
    const percentage = avgMax > 0 ? Math.round((avgNet / avgMax) * 100) : 0;

    return {
      subject,
      avgNet,
      maxQ: Math.round(avgMax),
      percentage: Math.min(100, percentage),
    };
  });
}
