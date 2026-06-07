import { findCityInQuestion, listKnownCityNames, type CityInfo } from '../data/turkeyCities';
import {
  formatTeacherLesson,
  isConceptualQuestion,
  isLocationQuestion,
  type TeacherSection,
} from './teacherStyle';

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function lessonCozelti(question: string): string {
  return formatTeacherLesson({
    subject: 'Kimya',
    topic: 'Çözeltilerin Oluşumu',
    question,
    directAnswer:
      'Çözelti; çözücü ve çözünenin moleküler düzeyde etkileşerek homojen bir karışım oluşturmasıdır. Çözünen parçacıkları çözücü içine dağılır ve gözle görülmeyecek kadar küçük tanecikler halinde tüm hacme yayılır.',
    greeting:
      'Şimdi bu süreci adım adım inceleyelim.',
    sections: [
      {
        title: 'Çözelti nedir?',
        body: `Çözelti, en az iki maddenin **homojen** (her yerde aynı özellikte) karışımıdır. Karışımın iki temel bileşeni vardır:

• **Çözücü:** Genellikle miktarca fazla olan ve çözüneni içine alan madde (sıvı çözeltilerde çoğunlukla su).
• **Çözünen:** Çözücü içinde dağılan madde (tuz, şeker, asit, baz vb.).

Tuzlu su, şekerli çay veya limonlu gazoz günlük hayattan örneklerdir. Çözeltide çözünen tanecikleri gözle görülmez boyuttadır; bu yüzden karışım berrak veya renkli ama **tek fazlı** görünür.`,
      },
      {
        title: 'Çözeltiler nasıl oluşur?',
        body: `Çözelti oluşumu, çözünen parçacıklarının çözücü molekülleri arasına girmesiyle başlar. Süreç şu adımlarla özetlenebilir:

**1. Adım — Etkileşim:** Çözünenin yüzeyindeki parçacıklar ile çözücü molekülleri arasında çekim kuvveti oluşur (hidrojen bağı, dipol-dipol etkileşimi veya iyon-dipol etkileşimi).

**2. Adım — Dağılma:** Çözücü molekülleri çözünen parçacıklarını çevreler ve kristal yapıyı veya molekül yığınını parçalar. Katı çözünürken tanecikler çözücü içine yayılır.

**3. Adım — Difüzyon:** Çözünen tanecikleri rastgele hareket ederek tüm çözücü hacmine eşit şekilde dağılır. Karıştırma bu süreci hızlandırır.

**4. Adım — Denge:** Belirli sıcaklıkta çözünenin çözünme ve çökelme hızları eşitlenirse **doymuş çözelti** oluşur.

Özetle: çözelti, «çözücü + çözünen + uygun etkileşim + dağılma» ile oluşur.`,
      },
      {
        title: 'Çözelti türleri ve örnekler',
        body: `• **Katı çözünen + sıvı çözücü:** Tuz (NaCl) + su → tuzlu su  
• **Sıvı çözünen + sıvı çözücü:** Etil alkol + su → alkol-su karışımı  
• **Gaz çözünen + sıvı çözücü:** CO₂ + su → gazlı içeceklerdeki karbonatlı su  

Derişim ifadeleri: **molarite (M)**, molalite (m), kütlece yüzde (kütle %). YKS\'de en çok molarite ve çözünürlük sorulur.`,
      },
      {
        title: 'Çözünürlüğü etkileyen faktörler',
        body: `• **Sıcaklık:** Katıların çoğunda sıcaklık artınca çözünürlük artar (Ca(OH)₂ istisnadır).  
• **Basınç:** Gazların çözünürlüğünde etkilidir (Henry Yasası).  
• **Çözünen-çözücü benzerliği:** «Benzer benzeri çözer» ilkesi — polar maddeler polar çözücüde daha iyi çözünür.  
• **Karışık çözelti etkisi:** Ortak iyon etkisi çözünürlüğü azaltabilir.`,
      },
    ],
    summary:
      'Çözelti; çözücü ve çözünenin moleküler düzeyde etkileşip homojen karışım oluşturmasıdır. Oluşumda etkileşim, dağılma ve difüzyon birlikte çalışır.',
    yksNote:
      'Çözünürlük, derişim hesabı (M = n/V), seyreltme (M₁V₁ = M₂V₂) ve doygunluk kavramları birlikte sorulur. «Benzer benzeri çözer» ve sıcaklık-basınç etkisini ayırt etmeyi öğren.',
    practice: {
      question: '20 °C\'de 100 g suda en fazla 36 g NaCl çözünüyorsa bu çözelti doymuş mudur? 30 g NaCl eklersen ne olur?',
      answer:
        '36 g sınırına kadar doymamış; 30 g tamamen çözünür. 36 g\'ı aşan miktar çözünmez ve tabanda katı kalır (aşırı doymuş duruma geçiş için özel koşul gerekir).',
    },
  });
}

function lessonAsitBaz(question: string): string {
  return formatTeacherLesson({
    subject: 'Kimya',
    topic: 'Asitler ve Bazlar',
    question,
    sections: [
      {
        title: 'Tanım',
        body: `**Asit:** Suda çözündüğünde H⁺ (veya H₃O⁺) iyonu veren maddelerdir. pH < 7.  
**Baz:** Suda OH⁻ iyonu veren veya H⁺ alan maddelerdir. pH > 7.  
**Nötr:** pH = 7 (saf su yaklaşık nötrdür).`,
      },
      {
        title: 'Arrhenius ve Brønsted-Lowry bakışı',
        body: `Arrhenius: asit = H⁺ veren, baz = OH⁻ veren.  
Brønsted-Lowry (YKS\'de yaygın): asit = proton (H⁺) **veren**, baz = proton **alan** maddedir.  
Örnek: HCl + H₂O → Cl⁻ + H₃O⁺ (HCl asit, H₂O baz).`,
      },
      {
        title: 'Güçlü ve zayıf asit-baz',
        body: `Güçlü asitler (HCl, HNO₃, H₂SO₄) suda neredeyse tamamen iyonlaşır.  
Zayıf asitler (CH₃COOH) kısmen iyonlaşır; denge kurulur.  
Aynı mantık bazlar için de geçerlidir (NaOH güçlü, NH₃ zayıf).`,
      },
    ],
    summary: 'Asit-baz davranışı proton alışverişi ve pH ile açıklanır.',
    yksNote: 'pH hesabı, nötrleşme (asit + baz → tuz + su) ve indikatör renkleri sık çıkar.',
    practice: {
      question: 'pH = 3 olan bir çözelti asidik mi bazik mi?',
      answer: 'Asidik (pH 7\'den küçük).',
    },
  });
}

function lessonKimyasalBag(question: string): string {
  return formatTeacherLesson({
    subject: 'Kimya',
    topic: 'Kimyasal Bağlar',
    question,
    sections: [
      {
        title: 'Bağ türleri',
        body: `**İyonik bağ:** Metal + ametal arasında elektron transferi (NaCl).  
**Kovalent bağ:** Ametaller arasında elektron ortaklaşması (H₂O, O₂).  
**Metalik bağ:** Metal atomları arasında «elektron denizi» modeli.  
**Hidrojen bağı:** Moleküller arası zayıf etkileşim; suyun yüksek kaynama noktasının nedeni.`,
      },
      {
        title: 'Nasıl oluşur?',
        body: `Atomlar **düşük enerjili (kararlı) elektron dizilimine** ulaşmak ister.  
İyonik bağda bir atom elektron verir, diğeri alır → iyonlar birbirini çeker.  
Kovalent bağda atomlar elektronları ortak kullanır → ortak çekirdek çekimi bağ oluşturur.`,
      },
    ],
    summary: 'Kimyasal bağ, atomların kararlı hale gelmesi için oluşturduğu kalıcı etkileşimdir.',
    yksNote: 'Lewis yapısı, VSEPR (molekül geometrisi) ve polar-apolar ayrımı birlikte çalışılır.',
    practice: {
      question: 'H₂O molekülünde hangi tür bağ bulunur?',
      answer: 'O-H arasında kovalent bağ; moleküller arasında hidrojen bağı.',
    },
  });
}

function lessonAmoeba(question: string): string {
  return formatTeacherLesson({
    subject: 'Biyoloji',
    topic: 'Amip ve Tek Hücreli Yaşam',
    question,
    sections: [
      {
        title: 'Amip kimdir?',
        body: `Amip (Amoeba), **ökaryot** ve **tek hücreli** bir protisttir. Hücre zarı, sitoplazma, çekirdek ve besin kofulu vardır; **kloroplast ve hücre duvarı yoktur**. Bu özellik onu bitkilerden ve bakterilerden ayırır.`,
      },
      {
        title: 'Amip nasıl yaşar?',
        body: `• **Yaşam alanı:** Tatlı su kaynakları (göller, göletler).  
• **Hareket:** Sahte ayak (pöd) oluşturarak **amipoid hareket** yapar.  
• **Beslenme:** **Fagositoz** — besini hücre zarına alır, besin kofulunda sindirir.  
• **Solunum:** Hücre zarından O₂/CO₂ difüzyonu.  
• **Boşaltım:** Kontraktıl koful ile fazla su atılır.  
• **Üreme:** Uygun ortamda **ikili bölünme (mitoz)**.`,
      },
    ],
    summary:
      'Amip; pöd ile hareket eden, fagositozla beslenen, mitozla üreyen tek hücreli bir ökaryottur.',
    yksNote: 'Öglena ile karıştırma: öglenada kloroplast vardır ve fotosentez yapabilir.',
    practice: {
      question: 'Amipte besin alımı hangi yolla gerçekleşir?',
      answer: 'Fagositoz.',
    },
  });
}

function lessonPhotosynthesis(question: string): string {
  return formatTeacherLesson({
    subject: 'Biyoloji',
    topic: 'Fotosentez',
    question,
    sections: [
      {
        title: 'Fotosentez nedir?',
        body: `Fotosentez, **kloroplast** içinde ışık enerjisiyle CO₂ ve H₂O\'dan organik besin (glikoz) ve O₂ üretilmesidir:

6CO₂ + 6H₂O + ışık enerjisi → C₆H₁₂O₆ + 6O₂`,
      },
      {
        title: 'İki aşama',
        body: `**Işığa bağımlı reaksiyonlar (grana):** Klorofil ışığı soğurur → ATP ve NADPH üretilir; su yarılanır → O₂ açığa çıkar.  
**Işıktan bağımsız reaksiyonlar (Calvin döngüsü, stroma):** CO₂ organik moleküle dönüştürülür; ATP ve NADPH kullanılır.`,
      },
      {
        title: 'Hızı etkileyen faktörler',
        body: `Işık şiddeti, CO₂ miktarı, sıcaklık, klorofil miktarı ve su. **Sınırlayıcı faktör:** en yavaş adım hızı belirler.`,
      },
    ],
    summary: 'Fotosentez; ışık enerjisinin kimyasal bağ enerjisine dönüştürülmesidir.',
    yksNote: 'O₂\'nin ışık reaksiyonundan çıktığını; glikozun karanlık reaksiyonda sentezlendiğini bil.',
    practice: {
      question: 'Fotosentezde O₂ hangi aşamada üretilir?',
      answer: 'Işığa bağımlı reaksiyonlarda (su yarılanması).',
    },
  });
}

export function formatTurkeyCityLesson(question: string, city: CityInfo): string {
  return formatTeacherLesson({
    subject: 'Coğrafya',
    topic: `${city.name} — Nerede?`,
    question,
    directAnswer: `**${city.name}**, Türkiye'nin **${city.region}**'nde yer alır. ${city.location}`,
    sections: [
      {
        title: 'Coğrafi konum',
        body: city.location,
      },
      {
        title: 'Komşu iller',
        body: `${city.name} ile sınır komşusu olan iller: **${city.neighbors.join(', ')}**. Harita üzerinde bu komşulukları işaretleyerek çalışmak konumu kalıcı öğretir.`,
      },
      {
        title: 'Öne çıkan özellikler',
        body: city.features,
      },
    ],
    summary: `${city.name} → ${city.region} → komşular: ${city.neighbors.slice(0, 3).join(', ')}.`,
    yksNote: city.yksNote,
    practice: {
      question: `${city.name} hangi coğrafi bölgededir?`,
      answer: city.region,
    },
  });
}

function tryCityLocation(question: string): string | null {
  const city = findCityInQuestion(question);
  if (!city) return null;
  return formatTurkeyCityLesson(question, city);
}

export function buildLocationNotFound(question: string): string {
  const known = listKnownCityNames().join(', ');
  return `📍 **Coğrafya — Konum Sorusu**

**Sorunuz:** «${question}»

### Cevap

Sorduğunuz il adını tam eşleştiremedim; bu yüzden kesin bir konum veremiyorum.

Şu an doğrudan yanıt verebildiğim iller: **${known}**.

İl adını tam veya yaygın kısaltmasıyla yazın (örnek: «Urfa nerede», «Şanlıurfa hangi bölgede», «Antep nerededir»).`;
}

type LessonDef = {
  subjects?: string[];
  pattern: RegExp;
  build: (question: string) => string;
};

const CONCEPT_LESSONS: LessonDef[] = [
  { subjects: ['Kimya'], pattern: /cozelti|solvent|derisik|derişik|cozunur|çözünür/, build: lessonCozelti },
  { subjects: ['Kimya'], pattern: /asit|baz|ph|notr|nötr/, build: lessonAsitBaz },
  { subjects: ['Kimya'], pattern: /kimyasal bag|kovalent|iyonik|hidrojen bag/, build: lessonKimyasalBag },
  { subjects: ['Biyoloji'], pattern: /amip|amoeba|ameba/, build: lessonAmoeba },
  { subjects: ['Biyoloji'], pattern: /fotosentez|klorofil|kloroplast/, build: lessonPhotosynthesis },
];

export function tryConceptLesson(subject: string, question: string): string | null {
  const q = normalize(question);

  // Türkiye illeri — anında yanıt; diğer dünya konumları async (worldLocations)
  if (isLocationQuestion(q)) {
    return tryCityLocation(question);
  }

  for (const { subjects, pattern, build } of CONCEPT_LESSONS) {
    if (subjects && !subjects.includes(subject)) continue;
    if (pattern.test(q)) return build(question);
  }

  if (subject === 'Coğrafya') {
    const city = tryCityLocation(question);
    if (city) return city;
  }

  if (!isConceptualQuestion(q)) return null;

  return null;
}

const SUBJECT_TEACHING_HINTS: Record<string, TeacherSection[]> = {
  Kimya: [
    {
      title: 'Konuya nasıl yaklaşmalısın?',
      body: `Kimyada kavram sorularında önce **tanım**, sonra **mekanizma (adım adım)**, en son **günlük örnek** yaz. Formül gerekiyorsa birimleri (mol, L, M) mutlaka kontrol et.`,
    },
    {
      title: 'Bu soru için çalışma önerisi',
      body: `Sorudaki anahtar kelimeleri altını çiz: madde adı, süreç (oluşum, dönüşüm), karşılaştırma (fark, benzerlik). Ders kitabındaki ilgili üniteden 1 şema çiz ve 5 test sorusu çöz.`,
    },
  ],
  Biyoloji: [
    {
      title: 'Konuya nasıl yaklaşmalısın?',
      body: `Biyolojide «nasıl» soruları **süreç akışı** ister: başlangıç → ara basamaklar → sonuç. Şema ve ok diyagramı kullan.`,
    },
    {
      title: 'Bu soru için çalışma önerisi',
      body: `İlgili sistemi (hücre, organ, ekosistem) bir cümleyle tanımla; ardından 3 maddelik neden-sonuç zinciri kur.`,
    },
  ],
  Fizik: [
    {
      title: 'Konuya nasıl yaklaşmalısın?',
      body: `Fizikte kavram = **tanım + birim + formül + yön (vektör)**. Verilenleri yaz, SI birimine çevir, uygun yasayı seç.`,
    },
    {
      title: 'Bu soru için çalışma önerisi',
      body: `Şema çiz, bilinmeyeni işaretle, formülü adım adım uygula. Sonucun birimini mutlaka kontrol et.`,
    },
  ],
  Coğrafya: [
    {
      title: 'Konuya nasıl yaklaşmalısın?',
      body: `Coğrafyada konum sorularında **bölge → komşular → iklim/yer şekilleri** üçlüsünü kullan. Harita üzerinde işaretleyerek çalış.`,
    },
    {
      title: 'Bu soru için çalışma önerisi',
      body: `Türkiye fiziki ve beşeri haritasını yan yana aç; il veya olayı her iki haritada da bul.`,
    },
  ],
  Matematik: [
    {
      title: 'Konuya nasıl yaklaşmalısın?',
      body: `Matematikte kavram sorularında önce **tanım**, sonra **örnek** ve **karşı örnek** ver. İşlem sorusu ise verilenleri listeleyip tek adımda bir işlem yap.`,
    },
    {
      title: 'Bu soru için çalışma önerisi',
      body: `Benzer 5 örnek çöz; her adımın «neden»ini kısa not olarak yaz.`,
    },
  ],
};

export function buildTeacherFallback(subject: string, question: string): string {
  const q = normalize(question);
  if (isLocationQuestion(q)) return buildLocationNotFound(question);

  const hints = SUBJECT_TEACHING_HINTS[subject] ?? SUBJECT_TEACHING_HINTS.Matematik;

  return formatTeacherLesson({
    subject,
    topic: 'Konu Anlatımı',
    question,
    directAnswer: `Bu soru için henüz hazır bir ders notum yok; aşağıda ${subject} dersinde benzer konuları nasıl çalışacağını anlattım. Soruyu daha net yazarsan (örnek: «çözeltiler nasıl oluşur», «amip nasıl beslenir») doğrudan konu anlatımı üretebilirim.`,
    sections: hints,
    summary: `${subject} dersinde tanım → örnek → uygulama sırasıyla çalış.`,
    yksNote: `${subject} konularında YKS; kavramı kendi cümlelerinle özetleyebilmen önemlidir.`,
  });
}
