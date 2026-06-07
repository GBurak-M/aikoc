/** Coğrafya soruları için il konum bilgileri */

export type CityInfo = {
  name: string;
  region: string;
  neighbors: string[];
  location: string;
  features: string;
  yksNote: string;
  /** Yaygın kısaltmalar: urfa → Şanlıurfa */
  aliases?: string[];
};

function norm(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const TURKEY_CITIES: Record<string, CityInfo> = {
  adana: {
    name: 'Adana',
    region: 'Akdeniz Bölgesi',
    neighbors: ['Mersin', 'Niğde', 'Kayseri', 'Kahramanmaraş', 'Osmaniye', 'Hatay'],
    location:
      'Türkiye\'nin güneyinde, Çukurova Ovası\'nda, Seyhan ve Ceyhan nehirlerinin birleştiği bölgede yer alır.',
    features: 'Tarım ve sanayi merkezi; portakal, pamuk ve tekstil üretimiyle bilinir.',
    yksNote: 'Çukurova, Akdeniz iklimi ve delta ovaları harita sorularında geçer.',
  },
  adiyaman: {
    name: 'Adıyaman',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Malatya', 'Diyarbakır', 'Şanlıurfa', 'Gaziantep', 'Kahramanmaraş'],
    location: 'Güneydoğu Anadolu\'nun kuzeybatısında, Fırat Nehri\'ne yakın dağlık ve ova karışık bir alanda.',
    features: 'Nemrut Dağı ve tarihî mirasıyla bilinir.',
    yksNote: 'Komşu iller ve Nemrut\'un konumu sorulabilir.',
    aliases: ['adiyaman'],
  },
  ankara: {
    name: 'Ankara',
    region: 'İç Anadolu Bölgesi',
    neighbors: ['Kırıkkale', 'Kırşehir', 'Aksaray', 'Eskişehir', 'Bolu', 'Çankırı', 'Konya'],
    location: 'Türkiye\'nin ortasında, İç Anadolu Platosu üzerinde başkent konumundadır.',
    features: 'Siyasi ve idari merkez; kurak-kıtasal iklim etkisi görülür.',
    yksNote: 'Başkent ve bölge merkezi olarak İç Anadolu sorularında geçer.',
  },
  antalya: {
    name: 'Antalya',
    region: 'Akdeniz Bölgesi',
    neighbors: ['Burdur', 'Isparta', 'Konya', 'Mersin', 'Muğla'],
    location: 'Türkiye\'nin güneyinde, Akdeniz kıyısında, Toros Dağları\'nın eteklerinde yer alır.',
    features: 'Turizm başkenti; Akdeniz iklimi, kıyı ve dağ arasında keskin geçişler.',
    yksNote: 'Akdeniz iklimi, turizm ve kıyı-dağ ilişkisi sorulur.',
  },
  bursa: {
    name: 'Bursa',
    region: 'Marmara Bölgesi',
    neighbors: ['Balıkesir', 'Kütahya', 'Bilecik', 'Sakarya', 'Kocaeli', 'Yalova'],
    location: 'Marmara Bölgesi\'nin güneyinde, Uludağ\'ın kuzey eteklerinde, İzmit Körfezi\'ne yakın.',
    features: 'Sanayi ve tarihî Osmanlı başkenti; ipek ve otomotiv sanayisi.',
    yksNote: 'Marmara\'nın güney ucu; Uludağ ve komşu iller haritada önemlidir.',
  },
  diyarbakir: {
    name: 'Diyarbakır',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Batman', 'Mardin', 'Şanlıurfa', 'Adıyaman', 'Elazığ', 'Bingöl', 'Muş'],
    location: 'Güneydoğu Anadolu\'nun kuzeydoğusunda, Dicle Nehri kıyısında geniş bir plato üzerinde.',
    features: 'Tarihî surları ve Dicle kıyısıyla bilinir; tarım ve hayvancılık önemlidir.',
    yksNote: 'Dicle havzası ve komşu iller harita sorularında sık çıkar.',
    aliases: ['diyarbakir', 'amed'],
  },
  erzurum: {
    name: 'Erzurum',
    region: 'Doğu Anadolu Bölgesi',
    neighbors: ['Erzincan', 'Bayburt', 'Ağrı', 'Kars', 'Ardahan', 'Artvin', 'Rize'],
    location: 'Doğu Anadolu\'nun yüksek platolarında, kışları sert geçen dağlık bir konumda.',
    features: 'Kış turizmi (Palandöken), üniversite ve askerî geçmişiyle bilinir.',
    yksNote: 'Yüksek rakım ve sert kış iklimi Doğu Anadolu sorularında vurgulanır.',
  },
  gaziantep: {
    name: 'Gaziantep',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Şanlıurfa', 'Kilis', 'Osmaniye', 'Adıyaman', 'Hatay'],
    location:
      'Türkiye\'nin güneyinde, Suriye sınırına yakın, Fırat Nehri havzasının güneybatısında yer alır.',
    features:
      'Tarım ve sanayi kenti; bakır işçiliği, gastronomi turizmi ve tarihî Zeugma mozaikleriyle bilinir.',
    yksNote: 'Güneydoğu Anadolu haritasında komşu iller sık sorulur.',
    aliases: ['antep'],
  },
  istanbul: {
    name: 'İstanbul',
    region: 'Marmara Bölgesi',
    neighbors: ['Tekirdağ', 'Kocaeli', 'Sakarya', 'Bursa', 'Yalova', 'Kırklareli'],
    location:
      'Türkiye\'nin kuzeybatısında; Boğaziçi ve Haliç ile Avrupa ve Anadolu yakalarına ayrılır. Karadeniz ile Marmara Denizi arasında stratejik bir konumdadır.',
    features: 'Türkiye\'nin en kalabalık ili; finans, ticaret ve kültür merkezi.',
    yksNote: 'Boğazlar, Marmara ve komşu iller harita sorularında önemlidir.',
    aliases: ['stambul'],
  },
  izmir: {
    name: 'İzmir',
    region: 'Ege Bölgesi',
    neighbors: ['Manisa', 'Aydın', 'Balıkesir', 'Kütahya', 'Uşak'],
    location: 'Ege Denizi kıyısında, İzmir Körfezi\'nde önemli bir liman kentidir.',
    features: 'Tarım, turizm ve liman ticareti gelişmiştir; Ege iklimi etkilidir.',
    yksNote: 'Ege kıyı şeridi ve körfez/coğrafi konum sorularında kullanılır.',
  },
  kahramanmaras: {
    name: 'Kahramanmaraş',
    region: 'Akdeniz Bölgesi',
    neighbors: ['Gaziantep', 'Adıyaman', 'Malatya', 'Sivas', 'Kayseri', 'Osmaniye', 'Hatay'],
    location: 'Akdeniz Bölgesi\'nin doğusunda, Amanos Dağları\'nın kuzeyinde, yüksek platolarda.',
    features: 'Dondurma, tekstil ve tarım ürünleriyle bilinir.',
    yksNote: 'Maraş olarak da bilinir; Akdeniz–Güneydoğu geçiş bölgesindedir.',
    aliases: ['maras', 'k maras', 'kmaras'],
  },
  kayseri: {
    name: 'Kayseri',
    region: 'İç Anadolu Bölgesi',
    neighbors: ['Sivas', 'Yozgat', 'Nevşehir', 'Niğde', 'Adana', 'Kahramanmaraş', 'Malatya'],
    location: 'İç Anadolu\'nun doğusunda, Erciyes Dağı\'nın eteklerinde yüksek bir plato üzerinde.',
    features: 'Sanayi ve ticaret merkezi; Erciyes kış turizmi.',
    yksNote: 'İç Anadolu\'nun doğu kapısı; komşu iller haritada önemlidir.',
  },
  konya: {
    name: 'Konya',
    region: 'İç Anadolu Bölgesi',
    neighbors: ['Ankara', 'Aksaray', 'Niğde', 'Antalya', 'Isparta', 'Afyonkarahisar', 'Eskişehir', 'Karaman'],
    location: 'Türkiye\'nin tam ortasına yakın, geniş ve düz bir plato (Konya Ovası) üzerinde.',
    features: 'Türkiye\'nin yüzölçümü en büyük ili; tarım ve Mevlana kültürü.',
    yksNote: 'Merkezî konum ve büyük ova yapısı harita sorularında geçer.',
  },
  mersin: {
    name: 'Mersin',
    region: 'Akdeniz Bölgesi',
    neighbors: ['Adana', 'Niğde', 'Konya', 'Antalya'],
    location: 'Akdeniz kıyısında, geniş bir körfez ve liman kenti olarak yer alır.',
    features: 'Liman, turizm ve narenciye üretimi; Tarsus ve Silifke ilçeleriyle bilinir.',
    yksNote: 'Akdeniz kıyı şeridi ve liman kentleri sorularında geçer.',
    aliases: ['icel'],
  },
  sanliurfa: {
    name: 'Şanlıurfa',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Gaziantep', 'Adıyaman', 'Diyarbakır', 'Mardin', 'Kilis'],
    location:
      'Güneydoğu Anadolu\'nun doğusunda, Harran Ovası üzerinde, Dicle ve Fırat havzasına yakın bir konumdadır.',
    features:
      'Göbeklitepe, Balıklıgöl ve Harran ile bilinir; tarım ve tarihî miras öne çıkar. Step ve yarı kurak iklim görülür.',
    yksNote: 'Güneydoğu Anadolu haritasında Gaziantep ve Diyarbakır ile birlikte çalışın.',
    aliases: ['urfa', 'sanli urfa', 'şanlıurfa'],
  },
  samsun: {
    name: 'Samsun',
    region: 'Karadeniz Bölgesi',
    neighbors: ['Sinop', 'Çorum', 'Amasya', 'Ordu'],
    location: 'Karadeniz kıyısında, Kızılırmak\'ın doğusunda geniş bir delta ve kıyı ovasında.',
    features: 'Liman kenti; tütün, fındık ve tarım ürünleri.',
    yksNote: 'Karadeniz kıyı şeridi ve delta ovaları sorulur.',
  },
  trabzon: {
    name: 'Trabzon',
    region: 'Karadeniz Bölgesi',
    neighbors: ['Rize', 'Giresun', 'Gümüşhane', 'Bayburt'],
    location: 'Karadeniz\'in doğu kesiminde, dağlık kıyı şeridinde dar bir kıyı şeridine yerleşmiştir.',
    features: 'Sümela Manastırı, fındık ve turizm; yağışlı okyanusal iklim.',
    yksNote: 'Doğu Karadeniz dağlık kıyı tipi haritada önemlidir.',
  },
};

/** Soru metninde geçen il adını bulur (takma adlar dahil). */
export function findCityInQuestion(question: string): CityInfo | null {
  const q = norm(question);
  if (!q) return null;

  type Match = { city: CityInfo; len: number };
  const matches: Match[] = [];

  for (const [key, city] of Object.entries(TURKEY_CITIES)) {
    const aliases = [key, norm(city.name), ...(city.aliases ?? []).map(norm)]
      .filter((a, i, arr) => a.length >= 3 && arr.indexOf(a) === i);

    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const atWord =
        new RegExp(`(^|\\s)${escaped}(\\s|$|[?!.,:;])`).test(q) || q === alias;
      const contains = alias.length >= 4 && q.includes(alias);
      if (atWord || contains) {
        matches.push({ city, len: alias.length });
      }
    }
  }

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.len - a.len);
  return matches[0].city;
}

export function listKnownCityNames(): string[] {
  return Object.values(TURKEY_CITIES).map((c) => c.name);
}
