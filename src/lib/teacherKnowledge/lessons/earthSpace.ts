import { makeLesson } from '../registry';

export const EARTH_SPACE_LESSONS = [
  makeLesson({
    domain: 'Astronomi',
    pattern: /astronomi|gezegen|gunes sistemi|güneş sistemi|yildiz|yıldız|galaksi|ay.*evre|evreler|kuyruklu yildiz|kuyruklu yıldız|meteor|evren|big bang|kara delik/,
    priority: 2,
    topic: 'Astronomi Temelleri',
    directAnswer:
      'Astronomi, evrendeki **gök cisimlerini** ve fiziksel süreçlerini inceler. Güneş Sistemi\'nde gezegenler Güneş etrafında eliptik yörüngede döner.',
    sections: [
      {
        title: 'Güneş Sistemi',
        body: `**İç gezegenler (kayalı):** Merkür, Venüs, Dünya, Mars.  
**Dış gezegenler (gaz devi):** Jüpiter, Satürn, Uranüs, Neptün.  
**Cüce gezegen:** Plüton (yeniden sınıflandırıldı).  
Asteroid kuşağı Mars–Jüpiter arasında.`,
      },
      {
        title: 'Yıldız ve galaksi',
        body: `Yıldızlar hidrojen füzyonu ile enerji üretir.  
Galaksiler milyarlarca yıldız içerir; Samanyolu spiral galaksidir.  
Işık yılı = ışığın bir yılda aldığı mesafe (≈ 9,46 trilyon km).`,
      },
      {
        title: 'Ay evreleri',
        body: `Yeni ay → hilal → ilk dördün → dolunay → son dördün → yeni ay.  
Süre ≈ 29,5 gün; sebep Ay\'ın Dünya etrafındaki dolanımıdır.`,
      },
    ],
    summary: 'Astronomi gök cisimlerinin hareket ve yapısını inceler; mesafe birimi ışık yılıdır.',
    yksNote: 'Gezegen sırası ve Ay evreleri TYT fen bağlamında sorulabilir.',
    practice: { question: 'Dünyadan üçüncü gezegen hangisi?', answer: 'Mars değil — Dünya\'dan sayınca: Merkür, Venüs, Dünya (3.).' },
  }),

  makeLesson({
    domain: 'Astronomi',
    pattern: /dunya.*donme|dünya.*dönme|dunya.*dolanim|dünya.*dolanım|mevsim|gece gunduz|gece gündüz|ekvator|yörünge/,
    topic: 'Dünya\'nın Hareketleri',
    directAnswer:
      'Dünya **kendi ekseni etrafında** ≈24 saatte döner (gece-gündüz); **Güneş etrafında** ≈365 günde dolanır (mevsimler).',
    sections: [
      {
        title: 'Dönme ve dolanım',
        body: `**Dönme:** Batıdan doğuya; gece-gündüz oluşur.  
**Dolanım:** Elips yörünge; eksen eğikliği (~23,5°) mevsimleri yaratır.  
Ekinoks: gece ve gündüz eşit; gündönümü: en uzun/kısa gün.`,
      },
    ],
    summary: 'Dönme → gün/gece; dolanım + eksen eğikliği → mevsim.',
    yksNote: 'Mevsimlerin nedeni eksen eğikliği + dolanımdır; mesafe değil.',
    practice: { question: 'Mevsimler neden oluşur?', answer: 'Dünya\'nın eksen eğikliği ve Güneş etrafındaki dolanımı.' },
  }),

  makeLesson({
    domain: 'Deniz Bilimleri',
    pattern: /deniz|okyanus|gelgit|gelgit|dalga.*deniz|akint|akıntı|plankton|mercan|balik.*okyanus|balık.*okyanus|karasal.*okyanus|okyanus tabani|okyanus tabanı/,
    priority: 2,
    topic: 'Okyanus ve Deniz Bilimleri',
    directAnswer:
      'Okyanuslar Dünya yüzeyinin yaklaşık **%71**\'ini kaplar. Gelgitler esas olarak **Ay\'ın** çekim etkisiyle oluşur.',
    sections: [
      {
        title: 'Okyanus yapısı',
        body: `**Kıtasal raf:** Sığ, geniş.  
**Kıtasal yamaç:** Dik eğim.  
**Açık deniz düzlüğü:** Derin düz taban.  
**Okyanus hendekleri:** En derin bölgeler (ör. Mariana).`,
      },
      {
        title: 'Gelgit ve akıntılar',
        body: `Gelgit: Ay + Güneş çekimi; iki yüksek iki alçak/gün (çoğu kıyı).  
Sıcak ve soğuk akıntılar iklimi etkiler (ör. Gulf Stream).`,
      },
      {
        title: 'Ekosistem',
        body: `Fitoplankton üretici; besin zinciri balık ve deniz memelilerine uzanır.  
Mercan resifleri sığ, sıcak sularda; biyoçeşitlilik zengin.`,
      },
    ],
    summary: 'Okyanus = su kütlesi + taban yapısı + gelgit + besin ağları.',
    yksNote: 'Coğrafya ve fen bağlamında gelgit nedeni ve okyanus akıntıları sorulur.',
    practice: { question: 'Gelgitin ana nedeni?', answer: 'Ay\'ın çekim kuvveti (Güneş ikincil etki).' },
  }),

  makeLesson({
    domain: 'Coğrafya',
    pattern: /levha|tektonik|deprem|volkan|volkanik|fay|magmatik|kita.*okyanus/,
    topic: 'Tektonik ve Yer Şekilleri',
    directAnswer:
      'Dünya kabuğu **levhalara** bölünmüştür. Levha sınırlarında deprem, volkanizma ve dağ oluşumu görülür.',
    sections: [
      {
        title: 'Levha hareketleri',
        body: `**Ayrılma:** Okyanus ortası sırtları, yeni kabuk.  
**Yakınsama:** Subdüksiyon, dağ oluşumu (Himalayalar).  
**Yatay kayma:** Fay hatları (San Andreas).`,
      },
    ],
    summary: 'Tektonik levhalar hareket eder; sınırlarda deprem ve volkanizma yoğunlaşır.',
    yksNote: 'Türkiye\'de Kuzey Anadolu ve Doğu Anadolu fayları deprem riski taşır.',
    practice: { question: 'Depremler çoğunlukla nerede olur?', answer: 'Levha sınırları ve fay hatlarında.' },
  }),
];
