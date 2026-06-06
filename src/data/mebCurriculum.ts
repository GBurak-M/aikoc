/** MEB lise + YÖK YKS uyumlu gömülü müfredat iskeleti (2024/2025) */

export type GradeLevel = '9' | '10' | '11' | '12' | 'mezun';

export type CurriculumTopic = {
  id: string;
  name: string;
  unit: string;
  priority: 'temel' | 'yks' | 'tekrar';
};

export type CurriculumSubject = {
  id: string;
  name: string;
  mebCode: string;
  topics: CurriculumTopic[];
};

export type GradeCurriculum = {
  grade: GradeLevel;
  label: string;
  mebFramework: string;
  yokAlignment: string;
  subjects: CurriculumSubject[];
};

const MAT_9: CurriculumSubject = {
  id: 'mat', name: 'Matematik', mebCode: 'MAT.9',
  topics: [
    { id: 'mat9-1', name: 'Mantık ve Kümeler', unit: 'Temel Kavramlar', priority: 'temel' },
    { id: 'mat9-2', name: 'Denklemler ve Eşitsizlikler', unit: 'Cebir', priority: 'temel' },
    { id: 'mat9-3', name: 'Üçgenler', unit: 'Geometri', priority: 'temel' },
    { id: 'mat9-4', name: 'Veri Analizi', unit: 'İstatistik', priority: 'tekrar' },
  ],
};

const FEN_9: CurriculumSubject = {
  id: 'fen', name: 'Fen Bilimleri', mebCode: 'FEN.9',
  topics: [
    { id: 'fen9-1', name: 'Kuvvet ve Hareket', unit: 'Fizik', priority: 'temel' },
    { id: 'fen9-2', name: 'Madde ve Endüstri', unit: 'Kimya', priority: 'temel' },
    { id: 'fen9-3', name: 'Canlılar Dünyası', unit: 'Biyoloji', priority: 'temel' },
  ],
};

const TUR_9: CurriculumSubject = {
  id: 'tur', name: 'Türk Dili ve Edebiyatı', mebCode: 'TDE.9',
  topics: [
    { id: 'tur9-1', name: 'Sözcükte Anlam', unit: 'Dil Bilgisi', priority: 'yks' },
    { id: 'tur9-2', name: 'Paragraf', unit: 'Okuma', priority: 'yks' },
    { id: 'tur9-3', name: 'Yazım Kuralları', unit: 'Dil Bilgisi', priority: 'tekrar' },
  ],
};

const MAT_10: CurriculumSubject = {
  id: 'mat', name: 'Matematik', mebCode: 'MAT.10',
  topics: [
    { id: 'mat10-1', name: 'Fonksiyonlar', unit: 'Cebir', priority: 'yks' },
    { id: 'mat10-2', name: 'Polinomlar', unit: 'Cebir', priority: 'yks' },
    { id: 'mat10-3', name: 'İkinci Derece Denklemler', unit: 'Cebir', priority: 'yks' },
    { id: 'mat10-4', name: 'Dörtgenler ve Çokgenler', unit: 'Geometri', priority: 'temel' },
  ],
};

const FIZ_10: CurriculumSubject = {
  id: 'fiz', name: 'Fizik', mebCode: 'FIZ.10',
  topics: [
    { id: 'fiz10-1', name: 'Elektrik ve Manyetizma', unit: 'Fizik', priority: 'yks' },
    { id: 'fiz10-2', name: 'Basınç ve Kaldırma Kuvveti', unit: 'Fizik', priority: 'temel' },
  ],
};

const MAT_11: CurriculumSubject = {
  id: 'mat', name: 'Matematik', mebCode: 'MAT.11',
  topics: [
    { id: 'mat11-1', name: 'Trigonometri', unit: 'Cebir', priority: 'yks' },
    { id: 'mat11-2', name: 'Logaritma', unit: 'Cebir', priority: 'yks' },
    { id: 'mat11-3', name: 'Diziler', unit: 'Cebir', priority: 'yks' },
    { id: 'mat11-4', name: 'Analitik Geometri', unit: 'Geometri', priority: 'yks' },
  ],
};

const FIZ_11: CurriculumSubject = {
  id: 'fiz', name: 'Fizik', mebCode: 'FIZ.11',
  topics: [
    { id: 'fiz11-1', name: 'Kuvvet ve Hareket (İleri)', unit: 'Fizik', priority: 'yks' },
    { id: 'fiz11-2', name: 'Elektrik Akımı', unit: 'Fizik', priority: 'yks' },
    { id: 'fiz11-3', name: 'Dalgalar', unit: 'Fizik', priority: 'yks' },
  ],
};

const KIM_11: CurriculumSubject = {
  id: 'kim', name: 'Kimya', mebCode: 'KIM.11',
  topics: [
    { id: 'kim11-1', name: 'Kimyasal Tepkimelerde Enerji', unit: 'Kimya', priority: 'yks' },
    { id: 'kim11-2', name: 'Asit-Baz', unit: 'Kimya', priority: 'yks' },
    { id: 'kim11-3', name: 'Kimyasal Tepkimelerde Hız', unit: 'Kimya', priority: 'yks' },
  ],
};

const BIY_11: CurriculumSubject = {
  id: 'biy', name: 'Biyoloji', mebCode: 'BIY.11',
  topics: [
    { id: 'biy11-1', name: 'Hücre Bölünmeleri', unit: 'Biyoloji', priority: 'yks' },
    { id: 'biy11-2', name: 'Kalıtım', unit: 'Biyoloji', priority: 'yks' },
    { id: 'biy11-3', name: 'Ekosistem Ekolojisi', unit: 'Biyoloji', priority: 'tekrar' },
  ],
};

const MAT_12: CurriculumSubject = {
  id: 'mat', name: 'Matematik', mebCode: 'MAT.12',
  topics: [
    { id: 'mat12-1', name: 'Türev', unit: 'Analiz', priority: 'yks' },
    { id: 'mat12-2', name: 'İntegral', unit: 'Analiz', priority: 'yks' },
    { id: 'mat12-3', name: 'Olasılık', unit: 'İstatistik', priority: 'yks' },
  ],
};

const EDE_12: CurriculumSubject = {
  id: 'ede', name: 'Edebiyat', mebCode: 'EDE.12',
  topics: [
    { id: 'ede12-1', name: 'Tanzimat Edebiyatı', unit: 'Edebiyat', priority: 'yks' },
    { id: 'ede12-2', name: 'Servet-i Fünun', unit: 'Edebiyat', priority: 'yks' },
    { id: 'ede12-3', name: 'Cumhuriyet Dönemi', unit: 'Edebiyat', priority: 'yks' },
  ],
};

const YKS_SAY: CurriculumSubject[] = [
  MAT_12,
  FIZ_11,
  KIM_11,
  BIY_11,
  { id: 'matayt', name: 'AYT Matematik', mebCode: 'YKS.SAY.MAT', topics: [
    { id: 'say-m1', name: 'Limit ve Süreklilik', unit: 'AYT Mat', priority: 'yks' },
    { id: 'say-m2', name: 'Türev Uygulamaları', unit: 'AYT Mat', priority: 'yks' },
    { id: 'say-m3', name: 'İntegral Uygulamaları', unit: 'AYT Mat', priority: 'yks' },
  ]},
];

export const GRADE_CURRICULA: Record<GradeLevel, GradeCurriculum> = {
  '9': {
    grade: '9',
    label: '9. Sınıf',
    mebFramework: 'MEB Ortaöğretim 9. Sınıf Müfredatı',
    yokAlignment: 'YKS temel kavramlar hazırlığı',
    subjects: [MAT_9, FEN_9, TUR_9],
  },
  '10': {
    grade: '10',
    label: '10. Sınıf',
    mebFramework: 'MEB Ortaöğretim 10. Sınıf Müfredatı',
    yokAlignment: 'TYT ön hazırlık',
    subjects: [MAT_10, FIZ_10, TUR_9],
  },
  '11': {
    grade: '11',
    label: '11. Sınıf',
    mebFramework: 'MEB Ortaöğretim 11. Sınıf Müfredatı',
    yokAlignment: 'TYT + AYT konu tamamlama',
    subjects: [MAT_11, FIZ_11, KIM_11, BIY_11, TUR_9],
  },
  '12': {
    grade: '12',
    label: '12. Sınıf',
    mebFramework: 'MEB 12. Sınıf + YKS Hazırlık',
    yokAlignment: 'YÖK YKS AYT/TYT müfredat uyumu',
    subjects: [MAT_12, EDE_12, FIZ_11, KIM_11, BIY_11],
  },
  mezun: {
    grade: 'mezun',
    label: 'Mezun (YKS Hazırlık)',
    mebFramework: 'MEB Mezun Destek + YKS Müfredatı',
    yokAlignment: 'YÖK YKS tam müfredat tekrarı',
    subjects: [...YKS_SAY, EDE_12, TUR_9],
  },
};

export function getCurriculumForGrade(grade: GradeLevel): GradeCurriculum {
  return GRADE_CURRICULA[grade] ?? GRADE_CURRICULA['11'];
}

export function gradeLabel(grade: GradeLevel): string {
  return GRADE_CURRICULA[grade]?.label ?? `${grade}. Sınıf`;
}
