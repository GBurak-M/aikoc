import { makeLesson } from '../registry';

export const HUMANITIES_LESSONS = [
  makeLesson({
    domain: 'Felsefe',
    pattern: /felsefe|filozof|filozofi|sokrates|platon|aristoteles|descartes|kant|nihilizm|varoluşçuluk|epistemoloji|etik|ontoloji|bilgi teorisi/,
    priority: 2,
    topic: 'Felsefeye Giriş',
    directAnswer:
      'Felsefe, **varlık (ontoloji)**, **bilgi (epistemoloji)** ve **değer (etik-estetik)** üzerine akıl yürütme disiplinidir.',
    sections: [
      {
        title: 'Ana dallar',
        body: `**Ontoloji:** Varlık nedir?  
**Epistemoloji:** Bilgi nasıl mümkün?  
**Etik:** Doğru davranış nedir?  
**Estetik:** Güzellik nedir?  
**Mantık:** Geçerli çıkarım kuralları.`,
      },
      {
        title: 'Temel akımlar (kısa)',
        body: `**Antik:** Sokrates (sorgulama), Platon (idealar), Aristoteles (deney + akıl).  
**Modern:** Descartes (şüphe → «Düşünüyorum öyleyse varım»).  
**Aydınlanma:** Kant (akıl sınırları).  
**19–20. yy:** Varoluşçuluk (özgürlük, anlam arayışı).`,
      },
    ],
    summary: 'Felsefe sorgulama sanatıdır; varlık, bilgi ve değer üçgeninde ilerler.',
    yksNote: 'TYT felsefe: akım-filozof eşleştirmesi ve kısa metin yorumu.',
    practice: { question: '«Düşünüyorum öyleyse varım» kime ait?', answer: 'René Descartes.' },
  }),

  makeLesson({
    domain: 'Edebiyat',
    pattern: /edebiyat|siir|şiir|roman|hikaye|nazim|nazım|nesir|tur.*edebi|tür.*edebi|metafor|benzetme|konu.*motive/,
    topic: 'Edebiyat ve Türler',
    directAnswer:
      'Edebiyat, duygu ve düşüncenin **dil sanatlarıyla** ifadesidir. Nazım (şiir) ve nesir (düzyazı) iki ana gruptur.',
    sections: [
      {
        title: 'Türler',
        body: `**Şiir:** Ölçü, uyak, imge; lirik, epik, didaktik.  
**Roman:** Uzun kurgu anlatı.  
**Hikaye:** Kısa kurgu.  
**Deneme:** Yazarın kişisel görüşü.  
**Tiyatro:** Sahne diyalogları.`,
      },
      {
        title: 'Söz sanatları',
        body: `**Benzetme:** «gibi» ile benzerlik.  
**Metafor:** Doğrudan aktarma («gözleri yıldız»).  
**Kişileştirme:** İnsan özelliği verme.  
**Abartma:** Ölçüyü aşma.`,
      },
    ],
    summary: 'Edebiyat tür + tema + anlatıcı + söz sanatları ile analiz edilir.',
    yksNote: 'Paragraf ve şiir yorumunda «ana duygu» ve «anlatıcı türü» sorulur.',
    practice: { question: '«Ay bir tabak gibi» hangi sanat?', answer: 'Benzetme (teşbih).' },
  }),

  makeLesson({
    domain: 'Türkçe',
    pattern: /paragraf|ana fikir|yardimci fikir|yardımcı fikir|anlatim|anlatım|anlatim teknik|anlatım teknik/,
    topic: 'Paragraf ve Anlatım',
    directAnswer:
      'Paragrafta **ana fikir** yazarın asıl iletmek istediği düşüncedir; yardımcı fikirler bunu destekler.',
    sections: [
      {
        title: 'Anlatım teknikleri',
        body: `**Açıklama:** Bilgi verme.  
**Tartışma:** Görüş savunma.  
**Öyküleme:** Olay anlatma.  
**Betimleme:** Gözlem ve tasvir.`,
      },
      {
        title: 'Çözüm yöntemi',
        body: `1. Konu cümlesini bul (genelde giriş veya sonuç).  
2. «Bu parçada ne anlatılıyor?» sorusunu sor.  
3. Seçenekleri parafraz kontrol et; aşırı genel/özel olanları ele.`,
      },
    ],
    summary: 'Ana fikir = yazarın mesajı; anlatım tekniği metnin yapısını belirler.',
    yksNote: 'TYT Türkçe\'nin en yüksek soru payı paragraftadır.',
    practice: { question: 'Olay anlatımı hangi teknik?', answer: 'Öyküleme (hikâyeleme).' },
  }),

  makeLesson({
    domain: 'Tarih',
    pattern: /osmanli|osmanlı|cumhuriyet|inkilap|inkılap|ataturk|atatürk|kurtulus savasi|kurtuluş savaşı|lozan|mondros/,
    priority: 2,
    topic: 'Türk Tarihi (Cumhuriyet Dönemi)',
    directAnswer:
      'Kurtuluş Savaşı (1919–1922) sonrası **Lozan (1923)** ile bağımsızlık tanındı; Cumhuriyet **29 Ekim 1923**\'te ilan edildi.',
    sections: [
      {
        title: 'Kronoloji',
        body: `Mondros (1918) → işgaller → Kongreler → TBMM (23 Nisan 1920) → Sakarya, Büyük Taarruz → Lozan → Cumhuriyet.  
Atatürk ilkeleri: Cumhuriyetçilik, Milliyetçilik, Halkçılık, Laiklik, Devletçilik, İnkılapçılık.`,
      },
    ],
    summary: 'Milli mücadele → Lozan → Cumhuriyet → inkılaplar.',
    yksNote: 'Antlaşma-kronoloji ve inkılapların amaçları tablo ile çalışılmalı.',
    practice: { question: 'Cumhuriyet ne zaman ilan edildi?', answer: '29 Ekim 1923.' },
  }),

  makeLesson({
    domain: 'Coğrafya',
    pattern: /iklim|muson|muson|akdeniz iklimi|step|tundra|nem|yagis|yağış|basinc|basınç|ruzgar|rüzgar/,
    topic: 'İklim ve Atmosfer',
    directAnswer:
      'İklim, uzun yıllar boyunca bir bölgedeki **ortalama hava koşullarıdır**. Sıcaklık, yağış, basınç ve rüzgarlar iklimi belirler.',
    sections: [
      {
        title: 'İklim tipleri (Türkiye bağlamı)',
        body: `**Akdeniz:** Yaz kurak-sıcak, kış yağışlı-ılık.  
**Karadeniz:** Her mevsim yağışlı, ılıman.  
**Karasal (step):** Yaz sıcak-kurak, kış soğuk.  
**Kutup/tundra:** Yıl boyu soğuk.`,
      },
      {
        title: 'Basınç ve rüzgar',
        body: `Alçak basınç → yükseliş → bulut/yağış.  
Yüksek basınç → alçalma → açık hava.  
Rüzgar yüksek basınçtan alçağa eser.`,
      },
    ],
    summary: 'İklim = uzun dönem ortalama; basınç dağılımı hava olaylarını yönetir.',
    yksNote: 'Türkiye iklim haritası ve bitki örtüsü eşleştirmesi TYT\'de sık.',
    practice: { question: 'Akdeniz ikliminde yazlar nasıl?', answer: 'Kurak ve sıcak.' },
  }),

  makeLesson({
    domain: 'Sosyal Bilimler',
    pattern: /sosyoloji|psikoloji|toplumsal|birey.*toplum|kultur|kültür|medeniyet|demokrasi|hukuk|anayasa/,
    topic: 'Sosyal Bilimlere Giriş',
    directAnswer:
      'Sosyal bilimler **insan ve toplumu** inceler: sosyoloji (toplum yapısı), psikoloji (birey davranışı), siyaset bilimi (yönetim), hukuk (kurallar).',
    sections: [
      {
        title: 'Temel kavramlar',
        body: `**Kültür:** Bir toplumun ortak değer, inanç ve sanat birikimi.  
**Sosyalleşme:** Bireyin toplum kurallarını öğrenmesi.  
**Demokrasi:** Halk egemenliği; çoğulculuk ve temsil.  
**Anayasa:** Devletin temel hukuk belgesi.`,
      },
    ],
    summary: 'Sosyal bilimler toplum-birey-kurum üçgenini açıklar.',
    yksNote: 'TYT sosyal: kavram tanımı ve güncel yorum soruları.',
    practice: { question: 'Sosyoloji neyi inceler?', answer: 'Toplum yapısı, kurumlar ve sosyal ilişkiler.' },
  }),
];
