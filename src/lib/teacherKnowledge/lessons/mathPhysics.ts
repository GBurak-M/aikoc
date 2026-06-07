import { makeLesson } from '../registry';

export const MATH_PHYSICS_LESSONS = [
  makeLesson({
    domain: 'Matematik',
    pattern: /turev|türev|egim|eğim|diferansiyel/,
    priority: 2,
    topic: 'Türev',
    directAnswer:
      'Türev, bir fonksiyonun belirli bir noktadaki **anlık değişim hızını** verir. Geometrik olarak eğriye çizilen teğetin eğimidir.',
    sections: [
      {
        title: 'Türev nedir?',
        body: `f(x) fonksiyonunun x noktasındaki türevi f′(x) ile gösterilir. f′(x₀), x₀ noktasındaki **anlık değişim oranıdır**.

Temel kural: (xⁿ)′ = n·xⁿ⁻¹  
Örnek: f(x) = x² → f′(x) = 2x; x = 3 için eğim 6'dır.`,
      },
      {
        title: 'Türevin anlamı',
        body: `• **Fiziksel:** Hız, konumun zamana göre türevidir.  
• **Geometrik:** Teğet eğimi.  
• **Ekonomik:** Marjinal değişim (bir birim daha üretince maliyet/kazanç ne kadar artar).`,
      },
      {
        title: 'Uygulama adımları',
        body: `1. Fonksiyonu belirle ve tanım kümesini kontrol et.  
2. Türev kurallarını uygula (toplama, çarpım, bölüm, zincir).  
3. İstenen noktada f′(x) değerini hesapla.  
4. Teğet denklemi: y − y₀ = f′(x₀)(x − x₀).`,
      },
    ],
    summary: 'Türev = anlık değişim hızı = teğet eğimi.',
    yksNote: 'AYT\'de zincir kuralı, maksimum-minimum ve grafik yorumu sık sorulur.',
    practice: { question: 'f(x) = x³ türevi nedir?', answer: 'f′(x) = 3x²' },
  }),

  makeLesson({
    domain: 'Matematik',
    pattern: /integral|alan hesab|belirli integral|belirsiz integral/,
    topic: 'İntegral',
    directAnswer:
      'İntegral, bir fonksiyonun **birikmiş değişimini** veya eğri altındaki **alanı** hesaplamaya yarar. Belirsiz integral antitürev, belirli integral sayısal alan verir.',
    sections: [
      {
        title: 'İki tür integral',
        body: `**Belirsiz integral:** ∫f(x)dx = F(x) + C (C sabit)  
**Belirli integral:** ∫ₐᵇ f(x)dx = F(b) − F(a) → [a,b] aralığında alan (işaretli).`,
      },
      {
        title: 'Temel fikir',
        body: `Türev ile integral birbirinin tersidir. Alan negatifse fonksiyon x-ekseninin altındadır. Parçalı fonksiyonlarda alanları ayrı hesaplayıp topla.`,
      },
    ],
    summary: 'İntegral = alan ve birikim; antitürev + sınır değerleri.',
    yksNote: 'Alan, hacim (döndürme) ve hız-konum ilişkisi AYT klasikleridir.',
    practice: { question: '∫2x dx = ?', answer: 'x² + C' },
  }),

  makeLesson({
    domain: 'Matematik',
    pattern: /olasilik|olasılık|permutasyon|kombinasyon|binom|zar at/,
    topic: 'Olasılık',
    directAnswer:
      'Olasılık, bir olayın gerçekleşme **ihtimalini** 0 ile 1 arasında sayısal olarak ifade eder: P(A) = istenen durum sayısı / tüm eşit olası durum sayısı.',
    sections: [
      {
        title: 'Temel kavramlar',
        body: `• **Örnek uzay:** Tüm olası sonuçlar.  
• **Olay:** Örnek uzayın alt kümesi.  
• **P(A) = n(A) / n(S)** (eş olası durumlarda).  
• **Tümel olay:** A ∪ A′ = S, P(A) + P(A′) = 1.`,
      },
      {
        title: 'Permütasyon ve kombinasyon',
        body: `**Permütasyon (sıra önemli):** P(n,r) = n! / (n−r)!  
**Kombinasyon (sıra önemsiz):** C(n,r) = n! / [r!(n−r)!]  
Önce «sıra önemli mi?» sorusunu sor.`,
      },
    ],
    summary: 'Olasılık = uygun durum / tüm durum; permütasyon sıralı, kombinasyon sırasız seçim.',
    yksNote: 'TYT\'de zar, kart, renkli top; AYT\'de koşullu olasılık ve binom.',
    practice: { question: 'Düzgün zar atıldığında tek gelme olasılığı?', answer: '3/6 = 1/2' },
  }),

  makeLesson({
    domain: 'Fizik',
    pattern: /newton|kuvvet.*hareket|eylemsizlik|net kuvvet|f=ma|f = ma/,
    priority: 2,
    topic: 'Newton Yasaları',
    directAnswer:
      'Newton\'un ikinci yasası: **F_net = m·a**. Net kuvvet ile ivme doğru orantılı, kütle ile ters orantılıdır.',
    sections: [
      {
        title: 'Üç yasa özeti',
        body: `**1. Yasa (Eylemsizlik):** Cisme net kuvvet uygulanmadıkça hızı değişmez.  
**2. Yasa:** F_net = m·a (kuvvet vektöreldir).  
**3. Yasa:** Her etki, eşit büyüklükte ve zıt yönde tepkiye yol açar.`,
      },
      {
        title: 'Çözüm stratejisi',
        body: `1. Serbest cisim diyagramı çiz.  
2. Kuvvetleri bileşenlerine ayır (x, y).  
3. ΣF = m·a denklemini kur.  
4. Birim: N = kg·m/s².`,
      },
    ],
    summary: 'Net kuvvet ivme yaratır; kuvvet her zaman vektördür.',
    yksNote: 'Sürtünme, eğik düzlem ve bağlı cisimler klasik soru tipleridir.',
    practice: { question: '2 kg cisme 10 N net kuvvet uygulanırsa ivme?', answer: 'a = F/m = 5 m/s²' },
  }),

  makeLesson({
    domain: 'Fizik',
    pattern: /enerji|is|iş|kinetik|potansiyel|enerji korunumu|mekanik enerji/,
    topic: 'Enerji ve İş',
    directAnswer:
      'İş = kuvvet × yol (kuvvet yönünde): W = F·d·cosθ. **Mekanik enerji** (E = K + U) sürtünmesiz sistemlerde korunur.',
    sections: [
      {
        title: 'Enerji türleri',
        body: `**Kinetik enerji:** K = ½mv²  
**Yer çekimi potansiyeli:** U = mgh  
**Esneklik potansiyeli:** U = ½kx²`,
      },
      {
        title: 'Korunum ilkesi',
        body: `Sürtünme yoksa: E_baslangıç = E_son  
Örnek: Yüksekten düşen cisimde mgh = ½mv² → v = √(2gh).`,
      },
    ],
    summary: 'İş enerji aktarımıdır; kapalı sistemde mekanik enerji korunur.',
    yksNote: 'Enerji-yol grafikleri ve «sürtünmesiz» anahtar kelimesine dikkat.',
    practice: { question: '2 kg, 5 m/s hızlı cismin kinetik enerjisi?', answer: 'K = ½·2·25 = 25 J' },
  }),

  makeLesson({
    domain: 'Fizik',
    pattern: /elektrik|ohm|direnç|akım|volt|devre|seri.*paralel/,
    topic: 'Elektrik Devreleri',
    directAnswer:
      'Ohm yasası: **V = I·R**. Seri bağlı dirençler toplanır; paralelde 1/R_toplam = 1/R₁ + 1/R₂ + …',
    sections: [
      {
        title: 'Temel büyüklükler',
        body: `Gerilim (V, volt), akım (I, amper), direnç (R, ohm).  
Güç: P = V·I = I²R.`,
      },
      {
        title: 'Bağlantı türleri',
        body: `**Seri:** Aynı akım; R_top = R₁ + R₂.  
**Paralel:** Aynı gerilim; 1/R_top = Σ(1/Rᵢ).  
Kısa devre: direncin atlanması — akım tehlikeli yükselir.`,
      },
    ],
    summary: 'V = IR; seri topla, paralel ters topla.',
    yksNote: 'Karma devrelerde eşdeğer direnç ve güç hesabı sık çıkar.',
    practice: { question: '12 V, 4 Ω dirençte akım?', answer: 'I = V/R = 3 A' },
  }),

  makeLesson({
    domain: 'Fizik',
    pattern: /dalga|frekans|periyot|dalga boyu|ses|isik hizi|ışık hızı/,
    topic: 'Dalgalar',
    directAnswer:
      'Dalga hızı: **v = f·λ** (hız = frekans × dalga boyu). Periyot T ile frekans f = 1/T ilişkilidir.',
    sections: [
      {
        title: 'Dalga kavramları',
        body: `**Genlik:** Enerji/maksimum yer değiştirme.  
**Frekans (f):** Saniyedeki titreşim sayısı (Hz).  
**Dalga boyu (λ):** Ardışık tepe veya çukur arası mesafe.`,
      },
      {
        title: 'Ses ve ışık',
        body: `Ses maddesel ortamda yayılır; hava ≈ 340 m/s.  
Işık boşlukta c ≈ 3×10⁸ m/s.  
Yansıma, kırılma ve girişim dalga olaylarıdır.`,
      },
    ],
    summary: 'v = fλ; dalga enerji taşır, ortam değişince hız değişir.',
    yksNote: 'Doppler, girişim ve kırınım AYT dalga sorularında öne çıkar.',
    practice: { question: 'f = 50 Hz, λ = 2 m ise hız?', answer: 'v = 100 m/s' },
  }),
];
