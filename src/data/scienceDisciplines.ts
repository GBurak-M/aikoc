/** Dünya çapında ana bilim dalları — UNESCO/OECD sınıflandırmasına uyumlu gömülü bilgi tabanı */

export type ScienceCategoryId =
  | 'formal'
  | 'natural'
  | 'life'
  | 'social'
  | 'humanities'
  | 'applied'
  | 'health'
  | 'agriculture'
  | 'interdisciplinary';

export type ScienceDiscipline = {
  id: string;
  tr: string;
  en: string;
  category: ScienceCategoryId;
  definition: string;
  methods: string;
  yksLink: string;
  aliases?: string[];
};

export const SCIENCE_CATEGORIES: Record<
  ScienceCategoryId,
  { tr: string; en: string; description: string }
> = {
  formal: {
    tr: 'Biçimsel Bilimler',
    en: 'Formal Sciences',
    description: 'Soyut yapılar, mantık ve biçimsel sistemler üzerine kurulu bilimler.',
  },
  natural: {
    tr: 'Doğa Bilimleri',
    en: 'Natural Sciences',
    description: 'Evrenin fiziksel ve kimyasal yasalarını deneysel ve teorik yöntemlerle inceler.',
  },
  life: {
    tr: 'Yaşam Bilimleri',
    en: 'Life Sciences',
    description: 'Canlıları, yaşam süreçlerini ve biyolojik sistemleri araştırır.',
  },
  social: {
    tr: 'Sosyal Bilimler',
    en: 'Social Sciences',
    description: 'İnsan topluluklarını, davranışlarını ve kurumlarını inceler.',
  },
  humanities: {
    tr: 'Beşeri Bilimler',
    en: 'Humanities',
    description: 'İnsan kültürü, düşünce tarihi, dil ve anlam üzerine çalışır.',
  },
  applied: {
    tr: 'Uygulamalı Bilimler ve Mühendislik',
    en: 'Applied Sciences & Engineering',
    description: 'Bilimsel bilgiyi teknoloji, tasarım ve üretime dönüştürür.',
  },
  health: {
    tr: 'Sağlık Bilimleri',
    en: 'Health Sciences',
    description: 'İnsan ve hayvan sağlığının korunması, teşhis ve tedavisini kapsar.',
  },
  agriculture: {
    tr: 'Tarım ve Veteriner Bilimleri',
    en: 'Agricultural & Veterinary Sciences',
    description: 'Gıda üretimi, toprak, bitki ve hayvan bilimlerini içerir.',
  },
  interdisciplinary: {
    tr: 'Disiplinlerarası Bilimler',
    en: 'Interdisciplinary Sciences',
    description: 'Birden fazla alanın kesişiminde yeni yöntem ve bulgular üretir.',
  },
};

export const SCIENCE_DISCIPLINES: ScienceDiscipline[] = [
  // —— Biçimsel ——
  { id: 'mathematics', tr: 'Matematik', en: 'Mathematics', category: 'formal', definition: 'Sayı, yapı, uzay ve değişimi mantıksal olarak inceler.', methods: 'İspat, modelleme, aksiyomatik sistemler', yksLink: 'TYT/AYT temel; analiz, cebir, geometri, olasılık', aliases: ['mat', 'math'] },
  { id: 'statistics', tr: 'İstatistik', en: 'Statistics', category: 'formal', definition: 'Veri toplama, analiz ve yorumlama bilimidir.', methods: 'Örnekleme, hipotez testi, regresyon', yksLink: 'TYT veri analizi; AYT olasılık-istatistik', aliases: ['istatistik', 'stats'] },
  { id: 'logic', tr: 'Mantık', en: 'Logic', category: 'formal', definition: 'Geçerli çıkarım ve doğruluk kavramlarını inceler.', methods: 'Önerme mantığı, küme teorisi', yksLink: 'TYT mantık-kümeler; paragraf çıkarımı', aliases: ['mantik'] },
  { id: 'computer_science', tr: 'Bilgisayar Bilimi', en: 'Computer Science', category: 'formal', definition: 'Hesaplama, algoritma ve bilgi işleme sistemlerini araştırır.', methods: 'Algoritma analizi, yazılım mühendisliği', yksLink: 'AYT matematik + güncel teknoloji okuması', aliases: ['bilgisayar', 'cs', 'informatik'] },
  { id: 'ai_science', tr: 'Yapay Zeka Bilimi', en: 'Artificial Intelligence', category: 'formal', definition: 'Öğrenen sistemler, akıl yürütme ve otonom karar modellerini inceler.', methods: 'Makine öğrenmesi, derin öğrenme, NLP', yksLink: 'Fen bilimleri okuryazarlığı; matematik temeli', aliases: ['yapay zeka', 'ai', 'machine learning'] },
  { id: 'information_theory', tr: 'Bilgi Teorisi', en: 'Information Theory', category: 'formal', definition: 'Bilginin ölçülmesi, iletimi ve sıkıştırılmasını matematiksel olarak modeller.', methods: 'Entropi, kodlama teorisi', yksLink: 'İleri düzey; temel olasılık bilgisi', aliases: ['bilgi teorisi'] },

  // —— Doğa ——
  { id: 'physics', tr: 'Fizik', en: 'Physics', category: 'natural', definition: 'Madde, enerji, uzay-zaman ve temel etkileşimleri inceler.', methods: 'Deney, matematiksel model, ölçüm', yksLink: 'TYT/AYT fizik; mekanik, elektrik, modern fizik', aliases: ['fizik'] },
  { id: 'chemistry', tr: 'Kimya', en: 'Chemistry', category: 'natural', definition: 'Maddenin yapısı, özellikleri ve dönüşümlerini araştırır.', methods: 'Laboratuvar deneyi, spektroskopi, modelleme', yksLink: 'TYT/AYT kimya; mol, denge, organik', aliases: ['kimya', 'chem'] },
  { id: 'astronomy', tr: 'Astronomi', en: 'Astronomy', category: 'natural', definition: 'Gök cisimlerini ve evrenin yapısını gözlem ve teoriyle inceler.', methods: 'Teleskop, radyo astronomi, simülasyon', yksLink: 'TYT fen; evren ve teknoloji konuları', aliases: ['astronomi', 'uzay bilimi'] },
  { id: 'astrophysics', tr: 'Astrofizik', en: 'Astrophysics', category: 'natural', definition: 'Gök cisimlerinin fiziksel özelliklerini ve evrimini inceler.', methods: 'Gözlem, fizik modelleri', yksLink: 'İleri fen; fizik + astronomi', aliases: ['astrofizik'] },
  { id: 'cosmology', tr: 'Kozmoloji', en: 'Cosmology', category: 'natural', definition: 'Evrenin kökeni, genişlemesi ve büyük ölçekli yapısını araştırır.', methods: 'Teorik fizik, gözlemsel veri', yksLink: 'Modern fizik okuması', aliases: ['kozmoloji'] },
  { id: 'geology', tr: 'Jeoloji', en: 'Geology', category: 'natural', definition: 'Yer kabuğu, kayaçlar ve jeolojik süreçleri inceler.', methods: 'Saha çalışması, fosil analizi', yksLink: 'Coğrafya-Yer bilimleri; deprem, mineraller', aliases: ['jeoloji', 'yer bilimleri'] },
  { id: 'meteorology', tr: 'Meteoroloji', en: 'Meteorology', category: 'natural', definition: 'Atmosfer olaylarını ve hava tahminini bilimsel olarak inceler.', methods: 'Gözlem istasyonu, modelleme', yksLink: 'Coğrafya iklim; TYT fen', aliases: ['meteoroloji', 'hava bilimi'] },
  { id: 'oceanography', tr: 'Oşinografi', en: 'Oceanography', category: 'natural', definition: 'Okyanusların fiziksel, kimyasal ve biyolojik özelliklerini araştırır.', methods: 'Gemi gözlemi, sensör ağları', yksLink: 'Coğrafya; çevre konuları', aliases: ['osinografi', 'okyanus bilimi'] },
  { id: 'materials_science', tr: 'Malzeme Bilimi', en: 'Materials Science', category: 'natural', definition: 'Malzemelerin yapı-özellik ilişkisini ve yeni malzeme tasarımını inceler.', methods: 'Mikroskopi, karakterizasyon', yksLink: 'Kimya-fizik kesişimi', aliases: ['malzeme bilimi'] },
  { id: 'geophysics', tr: 'Jeofizik', en: 'Geophysics', category: 'natural', definition: 'Yerin fiziksel özelliklerini ve iç yapısını fizik yöntemleriyle inceler.', methods: 'Sismik ölçüm, gravite-manyetik', yksLink: 'Fizik + coğrafya', aliases: ['jeofizik'] },

  // —— Yaşam ——
  { id: 'biology', tr: 'Biyoloji', en: 'Biology', category: 'life', definition: 'Canlıları yapı, işlev, büyüme ve evrim açısından inceler.', methods: 'Gözlem, deney, mikroskopi, genetik analiz', yksLink: 'TYT/AYT biyoloji; hücre, sistemler, ekoloji', aliases: ['biyoloji', 'bio'] },
  { id: 'botany', tr: 'Botanik', en: 'Botany', category: 'life', definition: 'Bitkilerin yapısı, sınıflandırması ve yaşam döngüsünü araştırır.', methods: 'Saha botaniği, laboratuvar', yksLink: 'Biyoloji bitki bölümü; fotosentez', aliases: ['botanik', 'bitki bilimi'] },
  { id: 'zoology', tr: 'Zooloji', en: 'Zoology', category: 'life', definition: 'Hayvanların anatomisi, davranışı ve sınıflandırmasını inceler.', methods: 'Gözlem, diseksiyon, etoloji', yksLink: 'Biyoloji sistemler; sınıflandırma', aliases: ['zooloji', 'hayvan bilimi'] },
  { id: 'microbiology', tr: 'Mikrobiyoloji', en: 'Microbiology', category: 'life', definition: 'Mikroorganizmaları ve insan-sağlık etkileşimlerini araştırır.', methods: 'Kültür, mikroskopi, moleküler test', yksLink: 'Biyoloji; bakteri, virüs, bağışıklık', aliases: ['mikrobiyoloji'] },
  { id: 'genetics', tr: 'Genetik', en: 'Genetics', category: 'life', definition: 'Kalıtım, gen ifadesi ve genetik varyasyonu inceler.', methods: 'DNA analizi, çaprazlama, biyoinformatik', yksLink: 'AYT biyoloji; Mendel, mutasyon', aliases: ['genetik', 'kalitim'] },
  { id: 'ecology', tr: 'Ekoloji', en: 'Ecology', category: 'life', definition: 'Canlıların birbirleri ve çevreleriyle ilişkisini inceler.', methods: 'Saha çalışması, modelleme', yksLink: 'TYT/AYT ekosistem, enerji akışı', aliases: ['ekoloji'] },
  { id: 'evolutionary_biology', tr: 'Evrimsel Biyoloji', en: 'Evolutionary Biology', category: 'life', definition: 'Türlerin kökeni ve adaptasyon süreçlerini araştırır.', methods: 'Fosil, genetik, karşılaştırmalı anatomi', yksLink: 'Biyoloji evrim ünitesi', aliases: ['evrim', 'evrimsel biyoloji'] },
  { id: 'molecular_biology', tr: 'Moleküler Biyoloji', en: 'Molecular Biology', category: 'life', definition: 'Yaşam süreçlerinin moleküler temelini inceler.', methods: 'PCR, protein analizi', yksLink: 'Protein sentezi, DNA-RNA', aliases: ['molekuler biyoloji'] },
  { id: 'biochemistry', tr: 'Biyokimya', en: 'Biochemistry', category: 'life', definition: 'Canlılardaki kimyasal süreçleri ve biyomolekülleri inceler.', methods: 'Enzim kinetiği, metabolizma analizi', yksLink: 'Kimya-biyoloji kesişimi; ATP, enzim', aliases: ['biyokimya'] },
  { id: 'biotechnology', tr: 'Biyoteknoloji', en: 'Biotechnology', category: 'life', definition: 'Biyolojik sistemleri teknolojik uygulamalara dönüştürür.', methods: 'Gen mühendisliği, fermantasyon', yksLink: 'Güncel fen okuması', aliases: ['biyoteknoloji'] },
  { id: 'neuroscience', tr: 'Nörobilim', en: 'Neuroscience', category: 'life', definition: 'Sinir sistemi ve beyin işlevlerini biyolojik düzeyde inceler.', methods: 'Görüntüleme, elektrofizyoloji', yksLink: 'Biyoloji sinir sistemi; psikoloji kesişimi', aliases: ['norobilim', 'beyin bilimi'] },

  // —— Sosyal ——
  { id: 'psychology', tr: 'Psikoloji', en: 'Psychology', category: 'social', definition: 'Davranış, zihin ve duygusal süreçleri bilimsel yöntemlerle inceler.', methods: 'Deney, gözlem, ölçek, nörogörüntüleme', yksLink: 'Sosyal bilimler okuryazarlığı; motivasyon', aliases: ['psikoloji'] },
  { id: 'sociology', tr: 'Sosyoloji', en: 'Sociology', category: 'social', definition: 'Toplumsal yapı, kurumlar ve sosyal değişimi analiz eder.', methods: 'Anket, etnografi, istatistik', yksLink: 'Sosyal bilimler; toplum konuları', aliases: ['sosyoloji'] },
  { id: 'anthropology', tr: 'Antropoloji', en: 'Anthropology', category: 'social', definition: 'İnsan topluluklarının kültür, dil ve evrimini inceler.', methods: 'Saha araştırması, arkeoloji', yksLink: 'Tarih-sosyal bilimler', aliases: ['antropoloji'] },
  { id: 'economics', tr: 'Ekonomi', en: 'Economics', category: 'social', definition: 'Kaynak dağılımı, üretim ve tüketim kararlarını modeller.', methods: 'Mikro-makro model, ekonometri', yksLink: 'Sosyal bilimler; güncel okuma', aliases: ['ekonomi', 'iktisat'] },
  { id: 'political_science', tr: 'Siyaset Bilimi', en: 'Political Science', category: 'social', definition: 'Devlet, iktidar ve siyasal kurumları inceler.', methods: 'Karşılaştırmalı analiz, anket', yksLink: 'Tarih-cumhuriyet; güncel olay analizi', aliases: ['siyaset bilimi', 'politika'] },
  { id: 'geography', tr: 'Coğrafya', en: 'Geography', category: 'social', definition: 'Yeryüzü olaylarını ve insan-çevre etkileşimini inceler.', methods: 'Harita, GIS, saha çalışması', yksLink: 'TYT/AYT coğrafya; iklim, nüfus, harita', aliases: ['cografya', 'coğrafya'] },
  { id: 'law', tr: 'Hukuk', en: 'Law', category: 'social', definition: 'Normlar, haklar ve yaptırımlar sistemini inceler.', methods: 'Kazui analiz, içtihat', yksLink: 'Sosyal bilimler; anayasa okuması', aliases: ['hukuk'] },
  { id: 'education_science', tr: 'Eğitim Bilimleri', en: 'Education Sciences', category: 'social', definition: 'Öğrenme, öğretim ve eğitim sistemlerini araştırır.', methods: 'Pedagojik deney, ölçme-değerlendirme', yksLink: 'Öğrenme stratejileri; sınav hazırlığı', aliases: ['egitim bilimleri', 'pedagoji'] },
  { id: 'communication', tr: 'İletişim Bilimleri', en: 'Communication Studies', category: 'social', definition: 'Medya, iletişim süreçleri ve toplumsal etkilerini inceler.', methods: 'İçerik analizi, anket', yksLink: 'Türkçe-anlatım; medya okuryazarlığı', aliases: ['iletisim', 'medya bilimi'] },
  { id: 'international_relations', tr: 'Uluslararası İlişkiler', en: 'International Relations', category: 'social', definition: 'Devletler arası ilişkileri ve küresel sorunları analiz eder.', methods: 'Teori, diplomasi analizi', yksLink: 'Tarih-güncel olaylar', aliases: ['uluslararasi iliskiler'] },
  { id: 'demography', tr: 'Demografi', en: 'Demography', category: 'social', definition: 'Nüfus yapısı, doğurganlık ve göç süreçlerini inceler.', methods: 'Nüfus istatistiği, projeksiyon', yksLink: 'Coğrafya nüfus ünitesi', aliases: ['demografi', 'nufus bilimi'] },
  { id: 'criminology', tr: 'Kriminoloji', en: 'Criminology', category: 'social', definition: 'Suç olgusu, nedenleri ve toplumsal önleme yöntemlerini inceler.', methods: 'İstatistik, vaka analizi', yksLink: 'Sosyal bilimler', aliases: ['kriminoloji'] },

  // —— Beşeri ——
  { id: 'history', tr: 'Tarih', en: 'History', category: 'humanities', definition: 'Geçmiş insan topluluklarını belge ve kanıtlarla inceler.', methods: 'Arşiv, kaynak eleştirisi, kronoloji', yksLink: 'TYT/AYT tarih; Osmanlı, Cumhuriyet, dünya', aliases: ['tarih'] },
  { id: 'philosophy', tr: 'Felsefe', en: 'Philosophy', category: 'humanities', definition: 'Bilgi, varlık, ahlak ve akıl üzerine temel soruları inceler.', methods: 'Kavram analizi, argümantasyon', yksLink: 'TYT/AYT felsefe; akım, düşünür eşleştirme', aliases: ['felsefe'] },
  { id: 'linguistics', tr: 'Dilbilim', en: 'Linguistics', category: 'humanities', definition: 'Dilin yapısı, anlamı ve evrimini bilimsel olarak inceler.', methods: 'Fonetik, morfoloji, sözdizim', yksLink: 'Türkçe dil bilgisi; yabancı dil', aliases: ['dilbilim', 'linguistik'] },
  { id: 'literature', tr: 'Edebiyat Bilimi', en: 'Literary Studies', category: 'humanities', definition: 'Edebi eserleri tarihsel ve estetik bağlamda inceler.', methods: 'Metin analizi, karşılaştırmalı edebiyat', yksLink: 'AYT edebiyat; akım, eser, şair', aliases: ['edebiyat', 'edebiyat bilimi'] },
  { id: 'archaeology', tr: 'Arkeoloji', en: 'Archaeology', category: 'humanities', definition: 'Maddi kalıntılar üzerinden geçmiş toplumları araştırır.', methods: 'Kazı, stratigrafi, tarihleme', yksLink: 'Tarih; ilk çağ medeniyetleri', aliases: ['arkeoloji'] },
  { id: 'art_history', tr: 'Sanat Tarihi', en: 'Art History', category: 'humanities', definition: 'Sanat eserlerini dönem ve bağlam içinde inceler.', methods: 'İkonografi, stil analizi', yksLink: 'Kültür-sanat okuması', aliases: ['sanat tarihi'] },
  { id: 'religious_studies', tr: 'Din Bilimi', en: 'Religious Studies', category: 'humanities', definition: 'Dinleri tarihsel ve sosyal bağlamda inceler.', methods: 'Metin analizi, karşılaştırmalı din', yksLink: 'Din Kültürü dersi; felsefe', aliases: ['din bilimi', 'din kulturu'] },
  { id: 'classics', tr: 'Klasik Çalışmalar', en: 'Classical Studies', category: 'humanities', definition: 'Antik Yunan ve Roma dilleri, edebiyat ve tarihini inceler.', methods: 'Filoloji, metin çevirisi', yksLink: 'Tarih-felsefe arka plan', aliases: ['klasik calismalar'] },

  // —— Uygulamalı / Mühendislik ——
  { id: 'mechanical_engineering', tr: 'Makine Mühendisliği', en: 'Mechanical Engineering', category: 'applied', definition: 'Mekanik sistemlerin tasarımı ve üretimini kapsar.', methods: 'CAD, termodinamik, malzeme testi', yksLink: 'Fizik mekanik; matematik', aliases: ['makine muhendisligi'] },
  { id: 'electrical_engineering', tr: 'Elektrik-Elektronik Mühendisliği', en: 'Electrical Engineering', category: 'applied', definition: 'Elektrik, elektronik ve haberleşme sistemlerini tasarlar.', methods: 'Devre analizi, sinyal işleme', yksLink: 'AYT fizik elektrik', aliases: ['elektrik', 'elektronik'] },
  { id: 'civil_engineering', tr: 'İnşaat Mühendisliği', en: 'Civil Engineering', category: 'applied', definition: 'Altyapı, yapı ve ulaşım sistemlerini tasarlar.', methods: 'Yapısal analiz, jeoteknik', yksLink: 'Matematik-fizik; geometri', aliases: ['insaat muhendisligi'] },
  { id: 'chemical_engineering', tr: 'Kimya Mühendisliği', en: 'Chemical Engineering', category: 'applied', definition: 'Kimyasal süreçleri endüstriyel ölçekte tasarlar.', methods: 'Reaktör tasarımı, proses kontrol', yksLink: 'Kimya; mol hesapları', aliases: ['kimya muhendisligi'] },
  { id: 'computer_engineering', tr: 'Bilgisayar Mühendisliği', en: 'Computer Engineering', category: 'applied', definition: 'Donanım ve yazılım sistemlerini birlikte tasarlar.', methods: 'Mikroişlemci, gömülü sistem', yksLink: 'Matematik + mantık', aliases: ['bilgisayar muhendisligi'] },
  { id: 'software_engineering', tr: 'Yazılım Mühendisliği', en: 'Software Engineering', category: 'applied', definition: 'Güvenilir ve ölçeklenebilir yazılım sistemleri geliştirir.', methods: 'Agile, test, mimari tasarım', yksLink: 'Algoritma düşüncesi', aliases: ['yazilim muhendisligi'] },
  { id: 'aerospace_engineering', tr: 'Havacılık ve Uzay Mühendisliği', en: 'Aerospace Engineering', category: 'applied', definition: 'Uçak ve uzay araçlarının tasarımını kapsar.', methods: 'Aerodinamik, itki sistemleri', yksLink: 'Fizik; vektör, kuvvet', aliases: ['havacilik', 'uzay muhendisligi'] },
  { id: 'biomedical_engineering', tr: 'Biyomedikal Mühendislik', en: 'Biomedical Engineering', category: 'applied', definition: 'Tıbbi cihaz ve biyolojik sistem arayüzlerini tasarlar.', methods: 'Biyosensör, görüntüleme', yksLink: 'Biyoloji + fizik', aliases: ['biyomedikal'] },
  { id: 'environmental_engineering', tr: 'Çevre Mühendisliği', en: 'Environmental Engineering', category: 'applied', definition: 'Çevre kirliliğini önleyen ve kaynakları yöneten sistemler tasarlar.', methods: 'Arıtma, atık yönetimi', yksLink: 'Coğrafya çevre; kimya', aliases: ['cevre muhendisligi'] },
  { id: 'industrial_engineering', tr: 'Endüstri Mühendisliği', en: 'Industrial Engineering', category: 'applied', definition: 'Sistem verimliliği ve üretim süreçlerini optimize eder.', methods: 'Simülasyon, ergonomi', yksLink: 'Matematik-istatistik', aliases: ['endustri muhendisligi'] },
  { id: 'architecture', tr: 'Mimarlık', en: 'Architecture', category: 'applied', definition: 'Yapıların estetik ve işlevsel tasarımını kapsar.', methods: 'Tasarım stüdyosu, modelleme', yksLink: 'Geometri; sanat', aliases: ['mimarlik'] },
  { id: 'urban_planning', tr: 'Şehir ve Bölge Planlama', en: 'Urban Planning', category: 'applied', definition: 'Kentsel alanların sürdürülebilir gelişimini planlar.', methods: 'GIS, katılımcı planlama', yksLink: 'Coğrafya; sosyal bilimler', aliases: ['sehir planlama'] },
  { id: 'nuclear_engineering', tr: 'Nükleer Mühendislik', en: 'Nuclear Engineering', category: 'applied', definition: 'Nükleer enerji ve radyasyon uygulamalarını inceler.', methods: 'Reaktör fizik, koruma', yksLink: 'Modern fizik', aliases: ['nukleer muhendislik'] },
  { id: 'mining_engineering', tr: 'Maden Mühendisliği', en: 'Mining Engineering', category: 'applied', definition: 'Yer altı kaynaklarının güvenli çıkarımını planlar.', methods: 'Jeoloji, makine sistemleri', yksLink: 'Fizik; yer bilimleri', aliases: ['maden muhendisligi'] },
  { id: 'petroleum_engineering', tr: 'Petrol ve Doğalgaz Mühendisliği', en: 'Petroleum Engineering', category: 'applied', definition: 'Hidrokarbon üretim süreçlerini tasarlar.', methods: 'Kuyu mühendisliği, rezervuar', yksLink: 'Kimya-fizik', aliases: ['petrol muhendisligi'] },

  // —— Sağlık ——
  { id: 'medicine', tr: 'Tıp', en: 'Medicine', category: 'health', definition: 'İnsan hastalıklarının teşhis, tedavi ve önlenmesini kapsar.', methods: 'Klinik araştırma, görüntüleme', yksLink: 'Biyoloji anatomi-fizyoloji temeli', aliases: ['tip', 'medikal'] },
  { id: 'dentistry', tr: 'Diş Hekimliği', en: 'Dentistry', category: 'health', definition: 'Ağız ve diş sağlığını korur ve tedavi eder.', methods: 'Klinik uygulama, görüntüleme', yksLink: 'Biyoloji; sağlık bilimleri', aliases: ['dis hekimligi'] },
  { id: 'pharmacy', tr: 'Eczacılık', en: 'Pharmacy', category: 'health', definition: 'İlaçların geliştirilmesi, üretimi ve güvenli kullanımını inceler.', methods: 'Farmakoloji, formülasyon', yksLink: 'Kimya organik; biyoloji', aliases: ['eczacilik'] },
  { id: 'nursing', tr: 'Hemşirelik', en: 'Nursing', category: 'health', definition: 'Hasta bakımı ve sağlık hizmetlerinin uygulanmasını kapsar.', methods: 'Klinik bakım, hasta eğitimi', yksLink: 'Biyoloji; iletişim', aliases: ['hemsirelik'] },
  { id: 'public_health', tr: 'Halk Sağlığı', en: 'Public Health', category: 'health', definition: 'Toplum düzeyinde sağlık risklerini önler ve yönetir.', methods: 'Epidemiyoloji, sağlık politikası', yksLink: 'Biyoloji; güncel bilim', aliases: ['halk sagligi'] },
  { id: 'nutrition', tr: 'Beslenme Bilimleri', en: 'Nutrition Science', category: 'health', definition: 'Besinlerin metabolizma ve sağlık üzerindeki etkisini inceler.', methods: 'Diyet analizi, klinik çalışma', yksLink: 'Biyoloji sindirim', aliases: ['beslenme'] },
  { id: 'physiotherapy', tr: 'Fizyoterapi', en: 'Physiotherapy', category: 'health', definition: 'Hareket bozukluklarını rehabilitasyon ile tedavi eder.', methods: 'Egzersiz terapisi, manuel teknik', yksLink: 'Biyoloji kas-iskelet', aliases: ['fizyoterapi'] },
  { id: 'veterinary_medicine', tr: 'Veteriner Hekimlik', en: 'Veterinary Medicine', category: 'health', definition: 'Hayvan sağlığı ve hastalıklarının teşhis-tedavisini kapsar.', methods: 'Klinik, aşı, cerrahi', yksLink: 'Biyoloji sistemler', aliases: ['veteriner'] },

  // —— Tarım ——
  { id: 'agronomy', tr: 'Ziraat / Agronomi', en: 'Agronomy', category: 'agriculture', definition: 'Bitkisel üretim ve toprak-bitki ilişkisini inceler.', methods: 'Tarla denemesi, ıslah', yksLink: 'Biyoloji bitki; coğrafya', aliases: ['ziraat', 'agronomi'] },
  { id: 'animal_science', tr: 'Zootekni', en: 'Animal Science', category: 'agriculture', definition: 'Çiftlik hayvanlarının beslenme ve üretimini optimize eder.', methods: 'Islah, besleme denemesi', yksLink: 'Biyoloji', aliases: ['zootekni', 'hayvansal uretim'] },
  { id: 'forestry', tr: 'Ormancılık', en: 'Forestry', category: 'agriculture', definition: 'Orman ekosistemlerinin yönetimi ve korunmasını kapsar.', methods: 'Saha envanteri, sürdürülebilirlik', yksLink: 'Ekoloji; coğrafya', aliases: ['ormancilik'] },
  { id: 'fisheries', tr: 'Su Ürünleri', en: 'Fisheries Science', category: 'agriculture', definition: 'Deniz ve tatlı su kaynaklarının sürdürülebilir kullanımını inceler.', methods: 'Yetistiricilik, popülasyon analizi', yksLink: 'Biyoloji ekoloji', aliases: ['su urunleri'] },
  { id: 'food_science', tr: 'Gıda Bilimi', en: 'Food Science', category: 'agriculture', definition: 'Gıdaların güvenliği, işlenmesi ve besin değerini araştırır.', methods: 'Mikrobiyolojik test, raf ömrü', yksLink: 'Kimya-biyoloji', aliases: ['gida bilimi'] },
  { id: 'soil_science', tr: 'Toprak Bilimi', en: 'Soil Science', category: 'agriculture', definition: 'Toprağın yapısı, verimliliği ve korunmasını inceler.', methods: 'Toprak analizi, haritalama', yksLink: 'Coğrafya; biyoloji', aliases: ['toprak bilimi'] },

  // —— Disiplinlerarası ——
  { id: 'environmental_science', tr: 'Çevre Bilimleri', en: 'Environmental Science', category: 'interdisciplinary', definition: 'İnsan-çevre etkileşimini bütüncül olarak inceler.', methods: 'Ekoloji, politika, kimya birlikte', yksLink: 'Coğrafya çevre; TYT fen', aliases: ['cevre bilimleri'] },
  { id: 'cognitive_science', tr: 'Bilişsel Bilim', en: 'Cognitive Science', category: 'interdisciplinary', definition: 'Zihin, algı ve öğrenmeyi psikoloji, nörobilim ve AI ile birlikte inceler.', methods: 'Deney, modelleme, nörogörüntüleme', yksLink: 'Psikoloji + biyoloji', aliases: ['bilissel bilim'] },
  { id: 'bioinformatics', tr: 'Biyoinformatik', en: 'Bioinformatics', category: 'interdisciplinary', definition: 'Biyolojik veriyi hesaplamalı yöntemlerle analiz eder.', methods: 'Dizilim analizi, veri madenciliği', yksLink: 'Genetik + bilgisayar', aliases: ['biyoinformatik'] },
  { id: 'nanotechnology', tr: 'Nanoteknoloji', en: 'Nanotechnology', category: 'interdisciplinary', definition: 'Nanometre ölçeğinde malzeme ve sistemleri tasarlar.', methods: 'Nanofabrikasyon, karakterizasyon', yksLink: 'Kimya-fizik ileri', aliases: ['nanoteknoloji'] },
  { id: 'data_science', tr: 'Veri Bilimi', en: 'Data Science', category: 'interdisciplinary', definition: 'Büyük veriden anlamlı örüntü ve tahmin üretir.', methods: 'İstatistik, ML, görselleştirme', yksLink: 'Matematik-istatistik', aliases: ['veri bilimi', 'data science'] },
  { id: 'robotics', tr: 'Robotik', en: 'Robotics', category: 'interdisciplinary', definition: 'Otonom ve yarı otonom makinelerin tasarımını kapsar.', methods: 'Kontrol teorisi, sensör füzyonu', yksLink: 'Fizik + bilgisayar', aliases: ['robotik'] },
  { id: 'space_science', tr: 'Uzay Bilimleri', en: 'Space Science', category: 'interdisciplinary', definition: 'Uzay ortamı, uydular ve gezegen araştırmalarını birleştirir.', methods: 'Gözlem, uzay görevi verisi', yksLink: 'Fizik-astronomi', aliases: ['uzay bilimleri'] },
  { id: 'sustainability_science', tr: 'Sürdürülebilirlik Bilimi', en: 'Sustainability Science', category: 'interdisciplinary', definition: 'Ekonomik gelişme ile çevresel sınırları birlikte yönetir.', methods: 'Sistem düşüncesi, politika analizi', yksLink: 'Coğrafya; güncel okuma', aliases: ['surdurulebilirlik'] },
  { id: 'science_technology_studies', tr: 'Bilim ve Teknoloji Çalışmaları', en: 'Science & Technology Studies', category: 'interdisciplinary', definition: 'Bilimsel bilginin toplumsal üretimini ve etkisini inceler.', methods: 'Tarihsel analiz, etnografi', yksLink: 'Fen-sosyal okuryazarlık', aliases: ['bilim teknoloji calismalari'] },
];
