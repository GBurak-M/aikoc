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

const FIZ_9: CurriculumSubject = {
  id: 'fiz', name: 'Fizik', mebCode: 'FIZ.9',
  topics: [
    { id: 'fiz9-1', name: 'Hareket ve Kuvvet', unit: 'Fizik', priority: 'temel' },
    { id: 'fiz9-2', name: 'Enerji', unit: 'Fizik', priority: 'temel' },
  ],
};

const KIM_9: CurriculumSubject = {
  id: 'kim', name: 'Kimya', mebCode: 'KIM.9',
  topics: [
    { id: 'kim9-1', name: 'Kimya Bilimi', unit: 'Kimya', priority: 'temel' },
    { id: 'kim9-2', name: 'Atom ve Periyodik Sistem', unit: 'Kimya', priority: 'temel' },
  ],
};

const BIY_9: CurriculumSubject = {
  id: 'biy', name: 'Biyoloji', mebCode: 'BIY.9',
  topics: [
    { id: 'biy9-1', name: 'Yaşam Bilimi Biyoloji', unit: 'Biyoloji', priority: 'temel' },
    { id: 'biy9-2', name: 'Hücre', unit: 'Biyoloji', priority: 'yks' },
  ],
};

const TAR_9: CurriculumSubject = {
  id: 'tar', name: 'Tarih', mebCode: 'TAR.9',
  topics: [
    { id: 'tar9-1', name: 'Tarih ve Zaman', unit: 'Tarih', priority: 'temel' },
    { id: 'tar9-2', name: 'İlk ve Orta Çağ', unit: 'Tarih', priority: 'temel' },
  ],
};

const COG_9: CurriculumSubject = {
  id: 'cog', name: 'Coğrafya', mebCode: 'COG.9',
  topics: [
    { id: 'cog9-1', name: 'Doğal Sistemler', unit: 'Coğrafya', priority: 'temel' },
    { id: 'cog9-2', name: 'Beşeri Sistemler', unit: 'Coğrafya', priority: 'temel' },
  ],
};

const KIM_10: CurriculumSubject = {
  id: 'kim', name: 'Kimya', mebCode: 'KIM.10',
  topics: [
    { id: 'kim10-1', name: 'Kimyasal Türler Arası Etkileşimler', unit: 'Kimya', priority: 'yks' },
    { id: 'kim10-2', name: 'Asit-Baz', unit: 'Kimya', priority: 'yks' },
  ],
};

const BIY_10: CurriculumSubject = {
  id: 'biy', name: 'Biyoloji', mebCode: 'BIY.10',
  topics: [
    { id: 'biy10-1', name: 'Hücre Bölünmeleri', unit: 'Biyoloji', priority: 'yks' },
    { id: 'biy10-2', name: 'Kalıtım', unit: 'Biyoloji', priority: 'yks' },
  ],
};

const TAR_10: CurriculumSubject = {
  id: 'tar', name: 'Tarih', mebCode: 'TAR.10',
  topics: [
    { id: 'tar10-1', name: '20. Yüzyıl Başlarında Osmanlı', unit: 'Tarih', priority: 'yks' },
    { id: 'tar10-2', name: 'Kurtuluş Savaşı', unit: 'Tarih', priority: 'yks' },
  ],
};

const COG_10: CurriculumSubject = {
  id: 'cog', name: 'Coğrafya', mebCode: 'COG.10',
  topics: [
    { id: 'cog10-1', name: 'Çevre ve Toplum', unit: 'Coğrafya', priority: 'yks' },
    { id: 'cog10-2', name: 'Ekonomik Faaliyetler', unit: 'Coğrafya', priority: 'tekrar' },
  ],
};

const TAR_11: CurriculumSubject = {
  id: 'tar', name: 'Tarih', mebCode: 'TAR.11',
  topics: [
    { id: 'tar11-1', name: 'Atatürk İlkeleri', unit: 'Tarih', priority: 'yks' },
    { id: 'tar11-2', name: 'İki Savaş Arası Dönem', unit: 'Tarih', priority: 'yks' },
  ],
};

const COG_11: CurriculumSubject = {
  id: 'cog', name: 'Coğrafya', mebCode: 'COG.11',
  topics: [
    { id: 'cog11-1', name: 'Nüfus Politikaları', unit: 'Coğrafya', priority: 'yks' },
    { id: 'cog11-2', name: 'Türkiye Ekonomisi', unit: 'Coğrafya', priority: 'yks' },
  ],
};

const FEL_11: CurriculumSubject = {
  id: 'fel', name: 'Felsefe', mebCode: 'FEL.11',
  topics: [
    { id: 'fel11-1', name: 'Felsefeyi Tanıma', unit: 'Felsefe', priority: 'yks' },
    { id: 'fel11-2', name: 'Bilgi Felsefesi', unit: 'Felsefe', priority: 'yks' },
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
    subjects: [MAT_9, TUR_9, FIZ_9, KIM_9, BIY_9, TAR_9, COG_9],
  },
  '10': {
    grade: '10',
    label: '10. Sınıf',
    mebFramework: 'MEB Ortaöğretim 10. Sınıf Müfredatı',
    yokAlignment: 'TYT ön hazırlık',
    subjects: [MAT_10, TUR_9, FIZ_10, KIM_10, BIY_10, TAR_10, COG_10],
  },
  '11': {
    grade: '11',
    label: '11. Sınıf',
    mebFramework: 'MEB Ortaöğretim 11. Sınıf Müfredatı',
    yokAlignment: 'TYT + AYT konu tamamlama',
    subjects: [MAT_11, TUR_9, FIZ_11, KIM_11, BIY_11, TAR_11, COG_11, FEL_11],
  },
  '12': {
    grade: '12',
    label: '12. Sınıf',
    mebFramework: 'MEB 12. Sınıf + YKS Hazırlık',
    yokAlignment: 'YÖK YKS AYT/TYT müfredat uyumu',
    subjects: [MAT_12, EDE_12, FIZ_11, KIM_11, BIY_11, TAR_11, COG_11, FEL_11],
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
