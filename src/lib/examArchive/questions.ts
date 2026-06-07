import type { ArchiveQuestion, ChoiceKey, ExamPaper } from './types';

const CHOICE_KEYS: ChoiceKey[] = ['A', 'B', 'C', 'D', 'E'];

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const STEM_TEMPLATES: Record<string, string[]> = {
  Türkçe: [
    '{n}. paragrafta anlatılan düşüncenin özü aşağıdakilerden hangisidir?',
    'Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?',
    'Boş bırakılan yere düşüncenin akışına göre hangisi getirilmelidir?',
    'Verilen parçada numaralanmış cümlelerden hangisi anlam bütünlüğünü bozar?',
  ],
  Matematik: [
    'Bir sayının %{k} fazlası {a} olduğuna göre sayı kaçtır?',
    'f(x) = {a}x² − {b}x + {c} fonksiyonunun tepe noktasının apsisi kaçtır?',
    'İki pozitif tam sayının EBOB\'u {a}, EKOK\'u {b} ise bu sayıların toplamı en az kaçtır?',
    'Dik kenar uzunlukları {a} ve {b} olan dik üçgende hipotenüs kaç birimdir?',
  ],
  Fen: [
    'Bir cismin kütlesi {a} kg, hızı {b} m/s ise kinetik enerjisi kaç joule\'dür?',
    'pH değeri {a} olan çözelti için aşağıdakilerden hangisi doğrudur?',
    'Kapalı kapta basınç {a} atm iken sıcaklık iki katına çıkarılırsa yeni basınç kaç atm olur? (hacim sabit)',
    'Işık hızı ortamda v = c/n ile veriliyor. n = {a} için hız c/n kaç c birimidir?',
  ],
  Sosyal: [
    'Aşağıdakilerden hangisi I. Dünya Savaşı sonrası barış antlaşmalarından biri değildir?',
    'Türkiye\'de cumhuriyetin ilanından sonra yapılan inkılaplardan hangisi eğitime yöneliktir?',
    'Haritada gösterilen bölgenin iklim tipi aşağıdakilerden hangisidir?',
    'Aşağıdaki ekonomik kavramlardan hangisi enflasyonla doğrudan ilişkilidir?',
  ],
  'Genel Yetenek': [
    'Sayı dizisi: {a}, {b}, {c}, ? — dizinin devamında hangi sayı gelmelidir?',
    'Bir işi {a} işçi {b} günde bitiriyor. Aynı işi {c} işçi kaç günde bitirir?',
    'Kısa paragrafta boş bırakılan yere hangi sözcük gelmelidir?',
    'Mantık sorusu: Tüm A\'lar B\'dir. Hiçbir B C değildir. Buna göre hangi sonuç kesindir?',
  ],
  'Genel Kültür': [
    'Aşağıdakilerden hangisi UNESCO Dünya Mirası Listesi\'nde yer alan bir yapı değildir?',
    'Türkiye Cumhuriyeti\'nin ilk anayasası hangi yılda kabul edilmiştir?',
    'Güncel olaylar bağlamında aşağıdakilerden hangisi doğrudur?',
    'Aşağıdaki bilim insanlarından hangisi alanıyla eşleştirilmemiştir?',
  ],
  Sayısal: [
    'ALES sayısal: {a} ve {b} arasındaki asal sayıların toplamı kaçtır?',
    'Bir küpün bir ayrıt uzunluğu {a} cm ise yüzey alanı kaç cm²\'dir?',
    'Permütasyon: {n} kişi yan yana kaç farklı şekilde sıralanabilir?',
    'Olasılık: Torbadan çekilen kartın kırmızı olma olasılığı {a}/{b} ise yeşil olma olasılığı kaçtır?',
  ],
  Sözel: [
    'ALES sözel: Parçada geçen altı çizili sözcüğün eş anlamlısı hangisidir?',
    'Cümlede boş bırakılan yere anlam akışına göre hangisi gelmelidir?',
    'Aşağıdaki cümlelerin hangisinde anlatım bozukluğu vardır?',
    'Paragrafın ana düşüncesi aşağıdakilerden hangisidir?',
  ],
  default: [
    '{n}. soru: Verilen bilgilere göre doğru seçenek hangisidir?',
    'Aşağıdaki ifadelerden hangisi yanlıştır?',
    'Konuyla ilgili aşağıdaki eşleştirmelerden hangisi doğrudur?',
    'Sınav formatına uygun örnek soru #{n}: doğru cevap hangi seçenektedir?',
  ],
};

function pickSubject(paper: ExamPaper, index: number): string {
  const subjects = paper.subjects.length ? paper.subjects : ['Genel'];
  return subjects[index % subjects.length];
}

function buildStem(subject: string, n: number, rand: () => number): string {
  const pool = STEM_TEMPLATES[subject] ?? STEM_TEMPLATES.default;
  const tpl = pool[Math.floor(rand() * pool.length)];
  const a = 2 + Math.floor(rand() * 40);
  const b = 2 + Math.floor(rand() * 30);
  const c = a + b + Math.floor(rand() * 10);
  const k = 10 + Math.floor(rand() * 50);
  return tpl
    .replace(/\{n\}/g, String(n))
    .replace(/\{a\}/g, String(a))
    .replace(/\{b\}/g, String(b))
    .replace(/\{c\}/g, String(c))
    .replace(/\{k\}/g, String(k));
}

function buildChoices(rand: () => number): ArchiveQuestion['choices'] {
  const values = new Set<number>();
  while (values.size < 5) values.add(1 + Math.floor(rand() * 200));
  const nums = [...values];
  return CHOICE_KEYS.map((key, i) => ({
    key,
    text: String(nums[i]),
  }));
}

export function generateQuestionsForPaper(paper: ExamPaper): ArchiveQuestion[] {
  const seed = hashSeed(paper.id);
  const rand = rng(seed);
  const questions: ArchiveQuestion[] = [];

  for (let i = 0; i < paper.questionCount; i++) {
    const n = i + 1;
    const subject = pickSubject(paper, i);
    const correctKey = CHOICE_KEYS[Math.floor(rand() * CHOICE_KEYS.length)];
    const stem = buildStem(subject, n, rand);

    questions.push({
      id: `${paper.id}-q${n}`,
      paperId: paper.id,
      number: n,
      subject,
      stem: `[${subject}] ${stem}`,
      choices: buildChoices(rand),
      correctKey,
      explanation: `${paper.title} — Soru ${n}: Doğru cevap ${correctKey}. Bu soru ${paper.year} ${paper.examType} müfredat yapısına uygun örnek formattadır.`,
    });
  }

  return questions;
}

const cache = new Map<string, ArchiveQuestion[]>();

export function getQuestionsForPaper(paper: ExamPaper): ArchiveQuestion[] {
  if (!cache.has(paper.id)) {
    cache.set(paper.id, generateQuestionsForPaper(paper));
  }
  return cache.get(paper.id)!;
}
