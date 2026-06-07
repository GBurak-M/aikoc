import { makeLesson } from '../registry';

export const BIOLOGY_LESSONS = [
  makeLesson({
    domain: 'Biyoloji',
    pattern: /amip|amoeba|amöba|tek hucreli|tek hücreli.*hayvan/,
    priority: 3,
    topic: 'Amip (Amoeba)',
    directAnswer:
      'Amip, **tek hücreli** bir ökaryot protisttir. Yalancı ayaklar (pseudopod) ile hareket eder ve beslenir.',
    sections: [
      {
        title: 'Yapı ve yaşam',
        body: `• **Çekirdek** vardır (ökaryot).  
• **Yalancı ayak:** Hücre zarı uzantıları; hareket ve beslenme.  
• **Beslenme:** Fagositoz ile parçacık içine alınır.  
• **Solunum:** Difüzyonla O₂ alışverişi.  
• **Üreme:** İkiye bölünme (mitoz).`,
      },
      {
        title: 'Sınıflandırma',
        body: `Protista âlemine girer; hayvan değil, tek hücreli ökaryottur. Tatlı su habitatında yaygındır.`,
      },
    ],
    summary: 'Amip = tek hücreli ökaryot; pseudopod ile hareket ve fagositoz ile beslenme.',
    yksNote: 'Tek hücreli-canlılar ünitesinde protist örneği olarak sorulur.',
    practice: { question: 'Amip nasıl hareket eder?', answer: 'Yalancı ayak (pseudopod) uzatarak.' },
  }),

  makeLesson({
    domain: 'Biyoloji',
    pattern: /fotosentez|klorofil|kloroplast|isik enerjisi|ışık enerjisi|calvin/,
    priority: 2,
    topic: 'Fotosentez',
    directAnswer:
      'Fotosentez, bitkilerin **ışık enerjisi** ile CO₂ ve H₂O\'dan glikoz ve O₂ üretmesidir: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    sections: [
      {
        title: 'Aşamalar',
        body: `**Işık tepkimeleri** (tilakoid): Klorofil ışığı soğurur; ATP ve NADPH üretilir; O₂ açığa çıkar.  
**Calvin döngüsü** (stroma): CO₂ sabitlenir; glikoz sentezlenir.`,
      },
      {
        title: 'Faktörler',
        body: `Işık şiddeti, CO₂ yoğunluğu, sıcaklık fotosentez hızını etkiler. Limit faktör en yavaş basamağı belirler.`,
      },
    ],
    summary: 'Fotosentez = ışık + CO₂ + su → glikoz + oksijen; kloroplastta gerçekleşir.',
    yksNote: 'Işık/karanlık reaksiyon ayrımı ve klorofil spektrumu sık sorulur.',
    practice: { question: 'Fotosentezde O₂ nereden gelir?', answer: 'Suyun fotolizi (ışık tepkimeleri).' },
  }),

  makeLesson({
    domain: 'Biyoloji',
    pattern: /hucre|hücre|mitokondri|ribozom|celir|çekirdek|organeller/,
    topic: 'Hücre ve Organeller',
    directAnswer:
      'Hücre, canlıların yapı ve işlev **birimi**dir. Ökaryot hücrede çekirdek ve zarlı organeller; prokaryotta çekirdek yoktur.',
    sections: [
      {
        title: 'Temel organeller',
        body: `**Çekirdek:** DNA, hücre yönetimi.  
**Mitokondri:** ATP üretimi (solunum).  
**Ribozom:** Protein sentezi.  
**Endoplazmik retikulum + Golgi:** Protein/lipit işleme ve paketleme.  
**Lizozom:** Sindirim (hayvan).  
**Kloroplast:** Fotosentez (bitki).`,
      },
    ],
    summary: 'Ökaryot = çekirdek + organeller; prokaryot = DNA sitoplazmada serbest.',
    yksNote: 'Organellerin işlev eşleştirmesi TYT\'nin temel sorusudur.',
    practice: { question: 'ATP nerede üretilir?', answer: 'Mitokondride (aerobik solunum).' },
  }),

  makeLesson({
    domain: 'Biyoloji',
    pattern: /dna|rna|genetik kod|replikasyon|transkripsiyon|translasyon|kalitsim|kalıtım/,
    topic: 'Genetik ve DNA',
    directAnswer:
      'DNA çift sarmal yapıda genetik bilgiyi taşır. **Replikasyon** kopyalama, **transkripsiyon** RNA sentezi, **translasyon** protein sentezidir.',
    sections: [
      {
        title: 'Merkezi dogma',
        body: `DNA → (transkripsiyon) → mRNA → (translasyon) → Protein  
Genetik kod üçlü kodonlarla amino asitleri belirler.`,
      },
      {
        title: 'Kalıtım',
        body: `Mendel: Baskın/çekinik aleller; genotip ve fenotip.  
Mutasyon DNA diziliminde kalıcı değişimdir.`,
      },
    ],
    summary: 'DNA bilgi deposu; RNA aracı; protein işlevsel ürün.',
    yksNote: 'Punnett karesi ve kan grubu kalıtımı klasik sorulardır.',
    practice: { question: 'Protein sentezi hangi organelde?', answer: 'Ribozomda (translasyon).' },
  }),

  makeLesson({
    domain: 'Zooloji',
    pattern: /memeli|memeliler|kus|kuş|surungen|sürüngen|balik|balık|omurga|omurgali|omurgalı|siniflandirma.*hayvan/,
    topic: 'Hayvan Sınıflandırması',
    directAnswer:
      'Omurgalılar; balık, amfibi, sürüngen, kuş ve memeli sınıflarına ayrılır. Her sınıfın ayırt edici yapı ve yaşam özellikleri vardır.',
    sections: [
      {
        title: 'Omurgalı sınıfları',
        body: `**Balık:** Solungaç, yumurta (çoğu).  
**Amfibi:** Deri solunumu + akciğer; karada ve suda.  
**Sürüngen:** Pul, yumurta; tamamen karasal.  
**Kuş:** Tüy, kanat, dört odacıklı kalp.  
**Memeli:** Süt bezi, saç, sıcak kanlı.`,
      },
    ],
    summary: 'Omurgalılar beş ana sınıfa ayrılır; her birinin adaptasyonu farklıdır.',
    yksNote: 'Sınıf ayırt edici özellikleri tablo halinde ezberlenmeli.',
    practice: { question: 'Sıcak kanlı hangi gruplar?', answer: 'Kuşlar ve memeliler.' },
  }),

  makeLesson({
    domain: 'Botanik',
    pattern: /bitki|fotosentez.*bitki|kok|kök|gövde|yaprak|ksilem|floem|tohum|çiçek|cicek/,
    topic: 'Bitki Yapısı ve İşlevleri',
    directAnswer:
      'Bitkiler kök (su/mineral), gövde (taşıma ve destek) ve yaprak (fotosentez) organlarından oluşur. **Ksilem** suyu yukarı, **floem** besini taşır.',
    sections: [
      {
        title: 'Doku sistemleri',
        body: `**Meristem:** Bölünme ve büyüme.  
**Ksilem:** Su ve mineral taşınması (ölü hücreler).  
**Floem:** Organik madde taşınması (canlı boru hücreleri).`,
      },
      {
        title: 'Üreme',
        body: `Çiçekli bitkiler: polen + yumurta → tohum → meyve.  
Tozlaşma ve döllenme genetik çeşitlilik sağlar.`,
      },
    ],
    summary: 'Kök-emme, yaprak-fotosentez, ksilem-floem taşıma.',
    yksNote: 'Bitki hormonları (auksin, gibberellin) ve tropizmalar sorulabilir.',
    practice: { question: 'Su hangi doku ile taşınır?', answer: 'Ksilem ile.' },
  }),

  makeLesson({
    domain: 'Biyoloji',
    pattern: /ekosistem|besin zinciri|besin agi|besin ağı|populasyon|komunite|komünite|biyoçeşitlilik/,
    topic: 'Ekosistem Ekolojisi',
    directAnswer:
      'Ekosistem, canlı (biyotik) ve cansız (abiyotik) bileşenlerin etkileşimidir. Enerji besin zinciriyle aktarılır; madde döngülerle yenilenir.',
    sections: [
      {
        title: 'Kavramlar',
        body: `**Popülasyon:** Aynı tür bireyler.  
**Komünite:** Farklı türler topluluğu.  
**Ekosistem:** Komünite + çevre.  
**Besin zinciri:** Üretici → tüketici → ayrıştırıcı.`,
      },
    ],
    summary: 'Enerji tek yönlü akar; madde döngüseldir (C, N, su).',
    yksNote: 'Besin piramidi ve biyolojik birikim sınav favorisidir.',
    practice: { question: 'Enerji besin zincirinde nasıl akar?', answer: 'Üreticiden tüketicilere; her basamakta kayıp olur.' },
  }),
];
