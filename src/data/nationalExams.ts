export type ExamLevel =
  | 'ortaogretim'
  | 'lise'
  | 'universite'
  | 'yuksek_lisans'
  | 'kamu'
  | 'meslek';

export type NationalExam = {
  id: string;
  name: string;
  shortName: string;
  level: ExamLevel;
  aliases: string[];
  description: string;
  subjects: string[];
  prepTips: string[];
  siteFeatures: string[];
};

export const EXAM_LEVEL_LABELS: Record<ExamLevel, string> = {
  ortaogretim: 'Ortaöğretim',
  lise: 'Lise & Üniversite Girişi',
  universite: 'Üniversite',
  yuksek_lisans: 'Yüksek Lisans & Akademik',
  kamu: 'Kamu & Meslek',
  meslek: 'Mesleki Yeterlilik',
};

/** Türkiye ulusal sınavları — koçluk ve arama için */
export const NATIONAL_EXAMS: NationalExam[] = [
  {
    id: 'aol',
    name: 'Açık Öğretim Lisesi Sınavı',
    shortName: 'AÖL',
    level: 'lise',
    aliases: ['aöl', 'aol', 'açık öğretim', 'acik ogretim', 'açık lise', 'meb aöl'],
    description:
      'Açık Öğretim Lisesi öğrencilerinin dönem sonu ve mezuniyet süreçlerinde girdiği MEB merkezi sınavlar.',
    subjects: ['Türkçe', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'],
    prepTips: [
      'MEB AÖL ders kitaplarını ünite ünite bitirip her ünite sonunda mini test çözün.',
      'Açık öğretim takvimindeki sınav tarihlerini Planlayıcıya işleyin.',
      'Eksik konuları AI Soru Çözücü ile pekiştirip not defterine kaydedin.',
    ],
    siteFeatures: ['Planlayıcı', 'AI Soru Çözücü', 'Kütüphane', 'Müfredat haritası'],
  },
  {
    id: 'lgs',
    name: 'Liselere Geçiş Sistemi Sınavı',
    shortName: 'LGS',
    level: 'ortaogretim',
    aliases: ['lgs', 'lise giriş', 'ortaokul sınavı', '8. sınıf sınavı'],
    description: '8. sınıf öğrencilerinin nitelikli liselere yerleşmesi için yapılan merkezi sınav.',
    subjects: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap Tarihi', 'Din Kültürü', 'İngilizce'],
    prepTips: [
      'MEB müfredatını haftalık tekrar döngüsüne bağlayın.',
      'Paragraf ve yeni nesil soru tiplerine günde 30-45 dk ayırın.',
      'Deneme sonrası yanlışları konu etiketiyle işaretleyin.',
    ],
    siteFeatures: ['AI Soru Çözücü', 'Planlayıcı', 'Kütüphane', 'Zeka Merkezi'],
  },
  {
    id: 'tyt',
    name: 'Temel Yeterlilik Testi',
    shortName: 'TYT',
    level: 'lise',
    aliases: ['tyt', 'temel yeterlilik', '1. oturum'],
    description: 'YKS’nin ilk oturumu; tüm adayların girdiği temel yeterlilik testi.',
    subjects: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilimler'],
    prepTips: [
      'Haftada en az 2 tam TYT denemesi çözün.',
      'Süre yönetimi için bölüm sonu mini kontroller yapın.',
      'Türkçe ve Matematik netlerini önce dengeleyin.',
    ],
    siteFeatures: ['Panel sınav girişi', 'Net grafikleri', 'AI koç analizi'],
  },
  {
    id: 'ayt',
    name: 'Alan Yeterlilik Testi',
    shortName: 'AYT',
    level: 'lise',
    aliases: ['ayt', 'alan yeterlilik', '2. oturum'],
    description: 'YKS’nin ikinci oturumu; adayın alanına göre derinlemesine ölçüm yapar.',
    subjects: ['Matematik', 'Fen', 'Edebiyat', 'Sosyal Bilimler-1', 'Sosyal Bilimler-2', 'Yabancı Dil'],
    prepTips: [
      'Alanınıza göre ağırlıklı ders planı oluşturun (Sayısal / EA / Sözel / Dil).',
      'Konu bitirme + soru bankası + deneme üçlüsünü koruyun.',
      'AYT net trendinizi Grafikler sekmesinden haftalık izleyin.',
    ],
    siteFeatures: ['AYT formu', 'Ders ortalamaları', 'Radar grafik'],
  },
  {
    id: 'yks',
    name: 'Yükseköğretim Kurumları Sınavı',
    shortName: 'YKS',
    level: 'lise',
    aliases: ['yks', 'üniversite sınavı', 'ösys', 'osym'],
    description: 'TYT ve AYT oturumlarından oluşan üniversite yerleştirme sınavı bütünü.',
    subjects: ['TYT + AYT oturumları'],
    prepTips: [
      'TYT taban + AYT hedef netlerini birlikte planlayın.',
      'Tercih döneminden önce bölüm puan türünü netleştirin.',
      'Son 60 günde deneme sıklığını artırın, eksik analizini kaçırmayın.',
    ],
    siteFeatures: ['Tam koçluk paneli', 'Üye müfredat haritası', 'Hedef takibi'],
  },
  {
    id: 'ydt',
    name: 'Yabancı Dil Testi',
    shortName: 'YDT',
    level: 'lise',
    aliases: ['ydt', 'yabancı dil testi', 'dil puanı'],
    description: 'Dil puanı ile tercih yapacak adaylar için YKS kapsamındaki yabancı dil oturumu.',
    subjects: ['İngilizce / Almanca / Fransızca / vb.'],
    prepTips: [
      'Kelime + okuma + dil bilgisi dengesini koruyun.',
      'Gerçek sınav formatında süreli test çözün.',
    ],
    siteFeatures: ['Akademik sözlük', 'AI Soru Çözücü'],
  },
  {
    id: 'kpss',
    name: 'Kamu Personeli Seçme Sınavı',
    shortName: 'KPSS',
    level: 'kamu',
    aliases: ['kpss', 'kamu sınavı', 'memur sınavı', 'kpss a', 'kpss b', 'kpss öğretmen', 'öabt'],
    description: 'Kamu kurumlarına personel alımında kullanılan genel yetenek / genel kültür ve alan sınavları.',
    subjects: ['Genel Yetenek', 'Genel Kültür', 'Eğitim Bilimleri', 'ÖABT alanları'],
    prepTips: [
      'GY-GK için günlük soru rutini oluşturun.',
      'ÖABT adayları alan konu haritası çıkarmalı.',
      'Güncel bilgileri haftalık özetleyin.',
    ],
    siteFeatures: ['Planlayıcı', 'Kütüphane', 'AI koç'],
  },
  {
    id: 'ales',
    name: 'Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı',
    shortName: 'ALES',
    level: 'yuksek_lisans',
    aliases: ['ales', 'yüksek lisans sınavı', 'doktora giriş', 'lisansüstü'],
    description: 'Yüksek lisans ve doktora programlarına başvuruda kullanılan sayısal ve sözel yetenek sınavı.',
    subjects: ['Sayısal', 'Sözel'],
    prepTips: [
      'Sayısal ve sözel bölümler için ayrı haftalık blok ayırın.',
      'Zaman baskısı altında deneme çözün.',
      'Yanlış analiz defteri tutun.',
    ],
    siteFeatures: ['Planlayıcı', 'AI Soru Çözücü', 'Kütüphane'],
  },
  {
    id: 'yds',
    name: 'Yabancı Dil Bilgisi Seviye Tespit Sınavı',
    shortName: 'YDS',
    level: 'yuksek_lisans',
    aliases: ['yds', 'yökdil', 'yabancı dil yds', 'dil yeterlilik'],
    description: 'Akademik ve kamu başvurularında yabancı dil yeterliliğini ölçen sınav.',
    subjects: ['Okuma', 'Çeviri', 'Kelime', 'Dil bilgisi'],
    prepTips: [
      'Akademik metin okuma alışkanlığı edinin.',
      'Çıkmış soru tiplerini sınıflandırarak çözün.',
    ],
    siteFeatures: ['Akademik sözlük', 'Kütüphane'],
  },
  {
    id: 'dgs',
    name: 'Dikey Geçiş Sınavı',
    shortName: 'DGS',
    level: 'universite',
    aliases: ['dgs', 'dikey geçiş', 'önlisans geçiş'],
    description: 'Önlisans mezunlarının lisans programlarına geçişi için yapılan sınav.',
    subjects: ['Sayısal', 'Sözel'],
    prepTips: [
      'Önlisans alanınıza uygun sayısal/sözel ağırlığı belirleyin.',
      'Temel matematik ve Türkçeyi güçlendirin.',
    ],
    siteFeatures: ['Panel', 'Planlayıcı', 'AI koç'],
  },
  {
    id: 'msu',
    name: 'Milli Savunma Üniversitesi Askeri Öğrenci Aday Belirleme Sınavı',
    shortName: 'MSÜ',
    level: 'lise',
    aliases: ['msü', 'askeri öğrenci', 'harbiye', 'harp okulu'],
    description: 'Askeri okul adaylarının akademik yeterliliklerinin ölçüldüğü sınav.',
    subjects: ['TYT benzeri testler', 'Fiziksel yeterlilik', 'Mülakat'],
    prepTips: [
      'TYT düzeyinde güçlü temel oluşturun.',
      'Fiziksel hazırlık programını akademik planla birleştirin.',
    ],
    siteFeatures: ['TYT takibi', 'Planlayıcı'],
  },
  {
    id: 'sts',
    name: 'Seviye Tespit Sınavı',
    shortName: 'STS',
    level: 'universite',
    aliases: ['sts', 'seviye tespit', 'üniversite hazırlık'],
    description: 'Üniversitelerde hazırlık sınıfından muafiyet için uygulanan sınav.',
    subjects: ['İngilizce veya ilgili yabancı dil'],
    prepTips: [
      'Kampüsün STS kriterlerini önceden öğrenin.',
      'Dil becerilerini dört temel alanda dengeli geliştirin.',
    ],
    siteFeatures: ['Akademik sözlük'],
  },
  {
    id: 'tus',
    name: 'Tıpta Uzmanlık Eğitimi Giriş Sınavı',
    shortName: 'TUS',
    level: 'yuksek_lisans',
    aliases: ['tus', 'tıp uzmanlık'],
    description: 'Tıp fakültesi mezunlarının uzmanlık eğitimine geçiş sınavı.',
    subjects: ['Temel Bilimler', 'Klinik Bilimler'],
    prepTips: [
      'Branş tekrarlarını soru çözümüyle pekiştirin.',
      'Konu bazlı ilerleme tablosu tutun.',
    ],
    siteFeatures: ['Planlayıcı', 'Kütüphane'],
  },
  {
    id: 'dus',
    name: 'Diş Hekimliğinde Uzmanlık Eğitimi Giriş Sınavı',
    shortName: 'DUS',
    level: 'yuksek_lisans',
    aliases: ['dus', 'diş uzmanlık'],
    description: 'Diş hekimliği mezunları için uzmanlık eğitimi giriş sınavı.',
    subjects: ['Temel diş hekimliği alanları'],
    prepTips: ['Alan tekrarlarını deneme analiziyle destekleyin.'],
    siteFeatures: ['Planlayıcı', 'Kütüphane'],
  },
  {
    id: 'ekpss',
    name: 'Engelli Kamu Personeli Seçme Sınavı',
    shortName: 'EKPSS',
    level: 'kamu',
    aliases: ['ekpss', 'engelli kpss'],
    description: 'Engelli adayların kamu atamalarında kullanılan sınav.',
    subjects: ['Genel Yetenek', 'Genel Kültür'],
    prepTips: ['KPSS stratejisine benzer planlama uygulayın.'],
    siteFeatures: ['Planlayıcı', 'AI koç'],
  },
  {
    id: 'lise_arasi',
    name: 'Liseler Arası Sınavlar ve Okul İçi Değerlendirmeler',
    shortName: 'Lise Sınavları',
    level: 'lise',
    aliases: ['lise sınavı', 'yazılı', 'okul sınavı', 'ara sınav', '1. dönem', '2. dönem'],
    description: 'Lise düzeyinde dönem içi yazılı, performans ve kurum sınavları.',
    subjects: ['MEB dersleri', 'Alan dersleri'],
    prepTips: [
      'Dönem planını aikoc Planlayıcı ile haftalık bölün.',
      'Okul sınavları ile YKS hazırlığını aynı takvimde yönetin.',
    ],
    siteFeatures: ['Planlayıcı', 'Not defteri', 'Müfredat haritası'],
  },
];

export function findExamsByQuery(query: string): NationalExam[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return NATIONAL_EXAMS.filter(
    (exam) =>
      exam.shortName.toLowerCase().includes(q) ||
      exam.name.toLowerCase().includes(q) ||
      exam.aliases.some((a) => a.includes(q) || q.includes(a)),
  );
}

export function findExamById(id: string): NationalExam | undefined {
  return NATIONAL_EXAMS.find((e) => e.id === id);
}

export function detectExamFromText(text: string): NationalExam | null {
  const normalized = text.toLowerCase();
  for (const exam of NATIONAL_EXAMS) {
    if (
      normalized.includes(exam.shortName.toLowerCase()) ||
      exam.aliases.some((a) => normalized.includes(a))
    ) {
      return exam;
    }
  }
  return null;
}

export function formatExamCoachBlock(exam: NationalExam): string {
  return `📋 ${exam.shortName} — ${exam.name}
Seviye: ${EXAM_LEVEL_LABELS[exam.level]}
${exam.description}

Dersler: ${exam.subjects.join(', ')}

Hazırlık önerileri:
${exam.prepTips.map((t) => `• ${t}`).join('\n')}

aikoc'da kullanabileceğiniz araçlar: ${exam.siteFeatures.join(', ')}`;
}
