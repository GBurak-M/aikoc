import { makeLesson } from '../registry';

export const CHEMISTRY_LESSONS = [
  makeLesson({
    domain: 'Kimya',
    pattern: /cozelti|çözelti|cozunur|çözünür|solvent|cozucu|çözücü|sulu cozelti|sulu çözelti/,
    priority: 3,
    topic: 'Çözelti ve Çözünme',
    directAnswer:
      'Çözelti, **çözücü** (genelde su) içinde iyon veya molekül halinde dağılmış **çözünen** maddeden oluşan homojen karışımdır.',
    greeting: 'Çözelti konusunu adım adım açıklayalım.',
    sections: [
      {
        title: 'Çözelti nasıl oluşur?',
        body: `1. Çözünen madde çözücüye eklenir.  
2. Tanecikler arası etkileşimler zayıflar; çözünen parçacıkları çözücü molekülleri arasına dağılır.  
3. Homojen (tek fazlı) karışım oluşur.

Örnek: Tuz (NaCl) suda iyonlara ayrılır: NaCl → Na⁺ + Cl⁻`,
      },
      {
        title: 'Çözünürlük',
        body: `Belirli sıcaklıkta çözücüde maksimum çözünen miktarı **çözünürlük** belirler.  
• Katılar: çoğu sıcaklıkla artar (gazlar azalır).  
• «Benzer benzeri çözer» (polar-polar).`,
      },
      {
        title: 'Derişim',
        body: `Molarite (M) = mol / litre  
% kütle = (çözünen kütle / çözelti kütle) × 100  
Seyreltme: M₁V₁ = M₂V₂`,
      },
    ],
    summary: 'Çözelti = çözücü + çözünen; çözünme parçacıkların dağılmasıdır.',
    yksNote: 'Çözünürlük, derişim ve koligatif özellikler TYT–AYT\'de sık sorulur.',
    practice: { question: '1 M NaCl çözeltisi ne demek?', answer: '1 litrede 1 mol NaCl bulunur.' },
  }),

  makeLesson({
    domain: 'Kimya',
    pattern: /asit|baz|ph|pH|notral|nötr|indikator|indikatör|turnusol/,
    priority: 2,
    topic: 'Asit ve Baz',
    directAnswer:
      'Asit suda H⁺ (veya H₃O⁺), baz OH⁻ iyonu verir. pH 7\'nin altı asidik, üstü bazik, 7 nötrdür.',
    sections: [
      {
        title: 'Arrhenius tanımı',
        body: `**Asit:** Suda H⁺ verir (HCl → H⁺ + Cl⁻).  
**Baz:** Suda OH⁻ verir (NaOH → Na⁺ + OH⁻).  
**Nötrleşme:** Asit + Baz → Tuz + Su`,
      },
      {
        title: 'pH ölçeği',
        body: `pH = −log[H⁺]  
pH < 7 → asidik (limon ≈ 2)  
pH > 7 → bazik (sabun ≈ 9–10)  
pH = 7 → nötr (saf su, 25°C)`,
      },
    ],
    summary: 'Asit H⁺, baz OH⁻; pH asitlik ölçüsüdür.',
    yksNote: 'Güçlü/zayıf asit-baz ayrımı ve tampon çözeltiler AYT konusudur.',
    practice: { question: 'pH = 3 çözelti asidik mi?', answer: 'Evet, pH < 7 olduğu için asidiktir.' },
  }),

  makeLesson({
    domain: 'Kimya',
    pattern: /kimyasal bag|kimyasal bağ|iyonik|kovalent|metalik|lewis|oktet/,
    topic: 'Kimyasal Bağlar',
    directAnswer:
      'Atomlar kararlı elektron dizilimine ulaşmak için **iyonik**, **kovalent** veya **metalik** bağ oluşturur.',
    sections: [
      {
        title: 'Bağ türleri',
        body: `**İyonik:** Metal + ametal; elektron transferi (NaCl).  
**Kovalent:** Ametal + ametal; elektron ortaklaşması (H₂O, O₂).  
**Metalik:** Metal atomları arasında «elektron denizi».`,
      },
      {
        title: 'Oktet kuralı',
        body: `Çoğu element 8 elektrona (He: 2) ulaşmak ister.  
Lewis yapısı: değerlik elektronlarını nokta ile gösterir.`,
      },
    ],
    summary: 'İyonik transfer, kovalent paylaşım, metalik deniz modeli.',
    yksNote: 'Elektronegatiflik farkı > 1,7 genelde iyonik bağ eğilimini gösterir.',
    practice: { question: 'H₂O hangi bağ türü?', answer: 'Kovalent bağ (polar kovalent).' },
  }),

  makeLesson({
    domain: 'Kimya',
    pattern: /mol|mol sayisi|mol sayısı|avogadro|molar kitle|na =/,
    topic: 'Mol Kavramı',
    directAnswer:
      'Mol, 6,02×10²³ tanecik içeren **madde miktarı** birimidir. 1 mol atomun kütlesi periyodik tablodaki gram cinsinden kütlesine eşittir.',
    sections: [
      {
        title: 'Mol ilişkileri',
        body: `n = m / M  (mol = kütle / molar kütle)  
n = N / N_A  (N_A = Avogadro sayısı)  
1 mol gaz STP\'de ≈ 22,4 L hacim kaplar.`,
      },
    ],
    summary: 'Mol sayısal birimdir; m, M ve n formülü temel hesap aracıdır.',
    yksNote: 'Stokiyometri sorularında mol oranı denklemden okunur.',
    practice: { question: '18 g su kaç moldür? (M=18)', answer: 'n = 18/18 = 1 mol' },
  }),

  makeLesson({
    domain: 'Kimya',
    pattern: /redoks|yükseltgenme|indirgenme|oksidasyon|elektron transfer/,
    topic: 'Redoks Tepkimeleri',
    directAnswer:
      'Yükseltgenme elektron **verme**, indirgenme elektron **alma**dır. Redoks tepkimelerinde elektron transferi vardır.',
    sections: [
      {
        title: 'OIL RIG kuralı',
        body: `**O**xidation **I**s **L**oss (yükseltgenme = elektron kaybı)  
**R**eduction **I**s **G**ain (indirgenme = elektron kazancı)  
Yükseltgen madde indirgeni indirger; indirgen madde yükseltgeni yükseltir.`,
      },
    ],
    summary: 'Redoks = elektron alışverişi; yükseltgenme ve indirgenme eş zamanlıdır.',
    yksNote: 'Yükseltgenme basamağı değişimini denklemden takip et.',
    practice: { question: 'Fe²⁺ → Fe³⁺ ne olur?', answer: 'Yükseltgenme (elektron kaybı).' },
  }),
];
