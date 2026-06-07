export type TermEntry = {
  tr: string;
  en: string;
  category: string;
  definition: string;
  yksTip: string;
  analogy: string;
};

const ACADEMIC_DICTIONARY: TermEntry[] = [
  {
    tr: 'Türev',
    en: 'Derivative',
    category: 'MAT',
    definition: 'Bir fonksiyonun belirli bir noktadaki anlık değişim hızını gösteren matematiksel işlemdir.',
    yksTip: 'TYT/AYT’de grafik yorumu, teğet eğimi ve maksimum-minimum sorularında sık çıkar.',
    analogy: 'Bir arabanın hız göstergesi gibi: konumu değil, o anda ne kadar hızlı değiştiğini söyler.',
  },
  {
    tr: 'Mitokondri',
    en: 'Mitochondrion',
    category: 'BİY',
    definition: 'Hücrede ATP üretiminden sorumlu, çift zarlı organeldir; “hücrenin enerji santrali” olarak bilinir.',
    yksTip: 'Aerobik solunum, ATP sentezi ve hücresel solunum sorularında doğrudan sorulur.',
    analogy: 'Şehirdeki elektrik santrali gibi; hücrenin çalışması için enerji üretir.',
  },
  {
    tr: 'Momentum',
    en: 'Momentum',
    category: 'FİZ',
    definition: 'p = m·v formülüyle tanımlanan fiziksel büyüklük; cismin hareket miktarını ifade eder.',
    yksTip: 'İmpuls-momentum teoremi ve çarpışma sorularında Δp = F·Δt ilişkisine dikkat edin.',
    analogy: 'Koşan birinin durması zorlaşır; kütle ve hız arttıkça “durma direnci” artar.',
  },
  {
    tr: 'Kovalent Bağ',
    en: 'Covalent Bond',
    category: 'KİM',
    definition: 'İki atomun ortaklaşa elektron çifti paylaşmasıyla oluşan kimyasal bağdır.',
    yksTip: 'Lewis yapısı, molekül geometrisi ve polar/apolar ayrımında temel kavramdır.',
    analogy: 'İki kişinin aynı kitabı birlikte okuması gibi; elektronları ortak kullanırlar.',
  },
  {
    tr: 'Ozmotik Basınç',
    en: 'Osmotic Pressure',
    category: 'BİY',
    definition: 'Yarı geçirgen zardan su geçişini durdurmak için gereken ek basınçtır.',
    yksTip: 'Hücre zarı, plazmoliz ve turgor konularında yoğun sorulur.',
    analogy: 'Tuzlu suya konan salatalığın buruşması; suyun yoğun taraftan seyrek tarafa gitmesi.',
  },
  {
    tr: 'İvme',
    en: 'Acceleration',
    category: 'FİZ',
    definition: 'Hızın zamana göre değişim oranıdır; birimi m/s².',
    yksTip: 'Grafik sorularında eğim = ivme; sabit ivmeli hareket formüllerini bilin.',
    analogy: 'Gaz pedalına bastığınızda hızın artma hızı; fren yaptığınızda negatif ivme.',
  },
  {
    tr: 'İntegral',
    en: 'Integral',
    category: 'MAT',
    definition: 'Bir fonksiyonun belirli aralıktaki toplam değişimini veya alanını hesaplayan işlemdir.',
    yksTip: 'Alan-hacim ve hız-yol integral sorularında sınır değerlerine dikkat edin.',
    analogy: 'Hız grafiğinin altındaki alan, gidilen yolu verir.',
  },
  {
    tr: 'Fotosentez',
    en: 'Photosynthesis',
    category: 'BİY',
    definition: 'Bitkilerin ışık enerjisiyle CO₂ ve sudan glikoz üretmesi sürecidir.',
    yksTip: 'Klorofil, ışık/karanlık reaksiyonları ve Calvin döngüsü sorulur.',
    analogy: 'Güneş paneli gibi; ışığı kimyasal enerjiye çevirir.',
  },
  {
    tr: 'Logaritma',
    en: 'Logarithm',
    category: 'MAT',
    definition: 'Üslü ifadenin ters işlemidir; log_a(b) = c ise a^c = b.',
    yksTip: 'Taban değiştirme, logaritma özellikleri ve denklem çözümünde sık çıkar.',
    analogy: 'Üslü sayıyı “indirgeme” aracı; büyük sayıları yönetilebilir hale getirir.',
  },
  {
    tr: 'Elektrokimya',
    en: 'Electrochemistry',
    category: 'KİM',
    definition: 'Kimyasal reaksiyonlarla elektrik enerjisi arasındaki dönüşümü inceleyen bilim dalıdır.',
    yksTip: 'Pil, elektroliz ve indirgenme-yükseltgenme numaraları birlikte sorulur.',
    analogy: 'Pil: içerideki reaksiyon dışarıya elektrik verir.',
  },
];

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function findTerm(term: string): TermEntry | null {
  const n = normalize(term);
  return (
    ACADEMIC_DICTIONARY.find(
      (e) => normalize(e.tr) === n || normalize(e.en) === n,
    ) ?? null
  );
}

export function formatTermResult(entry: TermEntry, direction: 'TR_EN' | 'EN_TR'): string {
  const translation = direction === 'TR_EN' ? entry.en : entry.tr;
  return `Çeviri: ${translation}
Tanım: ${entry.definition}
YKS İpucu: ${entry.yksTip}
Analoji (Benzetme): ${entry.analogy}`;
}

export function formatGenericTerm(term: string, direction: 'TR_EN' | 'EN_TR'): string {
  const from = direction === 'TR_EN' ? 'Türkçe' : 'İngilizce';
  const to = direction === 'TR_EN' ? 'İngilizce' : 'Türkçe';
  return `Çeviri: [${term} — ${to} karşılığı sözlükte henüz yok]
Tanım: "${term}" terimi YKS ${from} kaynaklarında geçen akademik bir kavramdır. Ders kitabınızda ve konu anlatım notlarınızda bu terimin tanımını mutlaka işaretleyin.
YKS İpucu: Bilmediğiniz terimleri deneme sonrası not defterine ekleyin; tekrar sıklığı net artışı sağlar.
Analoji (Benzetme): Yeni bir kelimeyi öğrenmek, haritaya yeni bir sokak eklemek gibidir — bir kez öğrenince o konuya her gidişiniz hızlanır.`;
}
