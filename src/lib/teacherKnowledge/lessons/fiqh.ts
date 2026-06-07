import { makeLesson } from '../registry';

export const FIQH_LESSONS = [
  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /fikih|fıkıh|ibadet|farz|vacip|vacip|sünnet|mekruh|haram|helal|dinen/,
    priority: 2,
    topic: 'Fıkıh ve İbadet Kavramları',
    directAnswer:
      'Fıkıh, İslam dininin **ibadet ve muamelat** (alışveriş, aile vb.) hükümlerini Kuran ve Sünnet ışığında inceleyen bilim dalıdır.',
    sections: [
      {
        title: 'Hüküm türleri',
        body: `**Farz:** Yapılması kesin zorunlu (terk eden günah).  
**Vacip:** Hanefilere göre farz; diğer mezheplerde güçlü zorunluluk.  
**Sünnet:** Peygamberin yaptığı/övdüğü; sevap kazandırır.  
**Mekruh:** Hoş karşılanmayan.  
**Haram:** Kesin yasak.  
**Mubah:** Serbest.`,
      },
      {
        title: 'Kaynaklar',
        body: `Kuran-ı Kerim, Sünnet, icma (alimlerin görüş birliği), kıyas (benzerlik).  
Mezhepler (Hanefi, Şafii, Maliki, Hanbeli) yorum farklılıkları içerir.`,
      },
    ],
    summary: 'Fıkıh = İslam hukuku/ibadet bilgisi; farz-vacip-sünnet ayrımı temeldir.',
    yksNote: 'Din Kültürü dersinde kavram tanımı ve ibadet şartları sorulur — kişisel fetva değil genel bilgi.',
    practice: { question: 'Farz ibadet terk edilirse?', answer: 'Dinen sorumluluk ve günah söz konusu olur.' },
  }),

  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /abdest|wudu|vudu|gusul|gusül|taharet|temizlik.*ibadet/,
    priority: 3,
    topic: 'Abdest ve Temizlik',
    directAnswer:
      'Abdest, namaz gibi ibadetlerden önce **farz** olan belirli organların yıkanması ve mesh edilmesidir.',
    sections: [
      {
        title: 'Abdestin farzları (genel öğretim)',
        body: `1. Yüzü yıkamak.  
2. Kolları dirseklerle birlikte yıkamak.  
3. Başın dörtte birini mesh etmek.  
4. Ayakları topuklarla birlikte yıkamak.  
Sıra ve süreklilik (maliki dışı) Hanefi mezhebinde farz kabul edilir.`,
      },
      {
        title: 'Abdesti bozanlar (özet)',
        body: `İdrar, dışkı, gaz çıkarma; cinsel ilişki/boşalma; bayılma; ağız/burundan kan (çoğu görüş).  
Gusül: Büyük temizlik; cünüplük ve hayız/nifas sonrası farzdır.`,
      },
    ],
    summary: 'Abdest küçük temizlik; farz organlar yıkanır/mesh edilir.',
    yksNote: 'Sınavda abdest farzları ve bozucular listesi ezberlenir.',
    practice: { question: 'Abdestte başa ne yapılır?', answer: 'Mesh (ıslak elle meshetme) — dörtte bir.' },
  }),

  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /namaz|salat|salât|rekat|rekât|ezan|kamet|kıble|kible|secde|secde|ruku|rükû/,
    priority: 3,
    topic: 'Namaz',
    directAnswer:
      'Namaz, günde beş vakit farz olan İslam ibadetidir. Her vaktin rekat sayısı ve içindeki farzlar bellidir.',
    sections: [
      {
        title: 'Beş vakit',
        body: `Sabah (2), Öğle (4), İkindi (4), Akşam (3), Yatsı (4) — farz rekatlar.  
Cemaatle kılınması sünnet-i müekkededir.`,
      },
      {
        title: 'Namazın şartları (özet)',
        body: `Hadesten taharet (abdest/gusül), necasetten taharet, setr-i avret, istikbal-i kıble, vakit, niyet.  
Rükû, secde, kıraat farzları içinde yer alır.`,
      },
    ],
    summary: 'Namaz = vakit + niyet + taharet + kıble + rekatlar.',
    yksNote: 'Vakit-rekat tablosu ve namaz şartları TYT Din Kültürü\'nde temel konudur.',
    practice: { question: 'Öğle namazı kaç farz rekat?', answer: '4 farz rekat.' },
  }),

  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /oruc|oruç|ramazan|iftar|sahur|teravih|fidye|kadir/,
    priority: 2,
    topic: 'Oruç',
    directAnswer:
      'Ramazan orucu, imsaktan iftara kadar **yeme, içme ve cinsel ilişkiden** uzak durma farzıdır.',
    sections: [
      {
        title: 'Şartlar ve hükümler',
        body: `Oruç tutmak: Müslüman, akıllı, ergen, sağlıklı olmayı gerektirir.  
Hastalık, yolculuk, hamilelik gibi durumlarda iftar ve kaza/fidye hükümleri vardır.  
Ramazan ayı hicri takvime göre belirlenir.`,
      },
    ],
    summary: 'Oruç = gündüz imsak-iftar arası farz perhiz.',
    yksNote: 'Orucu bozan ve bozmayan durumlar liste halinde çalışılır.',
    practice: { question: 'Oruç ne zaman başlar?', answer: 'İmsak vaktinde (fecr).' },
  }),

  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /zekat|zekât|infak|sadaka|nisap|fitre/,
    topic: 'Zekât ve Yardımlaşma',
    directAnswer:
      'Zekât, belirli mal varlığına ulaşan Müslümanın **yıllık** olarak fakirlere vermesi farz olan mali ibadettir.',
    sections: [
      {
        title: 'Temel ilkeler',
        body: `Nisap: Zekâtın vacip olması için gerekli asgari mal miktarı.  
Oran: Altın/gümüş/para ticaret malında genelde %2,5 (1/40).  
Fitre: Ramazan Bayramı\'ndan önce farz olan sadaka-i fıtır.`,
      },
    ],
    summary: 'Zekât = nisaba ulaşan malın belirli oranını hak sahiplerine verme.',
    yksNote: 'Zekâtın şartları ve kimlere verileceği Din Kültürü müfredatında yer alır.',
    practice: { question: 'Zekât oranı (para/altın) genelde?', answer: 'Kırkta bir (%2,5).' },
  }),

  makeLesson({
    domain: 'Din Kültürü ve Ahlak Bilgisi',
    pattern: /hac|umre|kabe|ihram|arafat|mekke|medine/,
    topic: 'Hac ve Umre',
    directAnswer:
      'Hac, gücü yeten Müslümanın ömründe bir kez **Zilhicce** ayında Mekke\'de farz ibadetidir. Umre ise sünnet (çoğu görüş) veya vacip kabul edilen kısa ziyarettir.',
    sections: [
      {
        title: 'Hac menasık (özet)',
        body: `İhrama girme → Arafat vakfesi → Müzdelife → Şeytan taşlama → Kabe tavaf → Sa\'y.  
Hac farzları: İhram, vakfe, tavaf-ı ziyaret.`,
      },
    ],
    summary: 'Hac = farz (gücü yetene); umre = Kabe ziyareti ve tavaf.',
    yksNote: 'Hac ve umre farkı, ihram ve menasık sırası sınavda sorulur.',
    practice: { question: 'Hac hangi ayda yapılır?', answer: 'Zilhicce ayında.' },
  }),
];
