/** Coğrafya soruları için temel il konum bilgileri */

export type CityInfo = {
  name: string;
  region: string;
  subRegion?: string;
  neighbors: string[];
  location: string;
  features: string;
  yksNote: string;
};

export const TURKEY_CITIES: Record<string, CityInfo> = {
  gaziantep: {
    name: 'Gaziantep',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Şanlıurfa', 'Kilis', 'Osmaniye', 'Adıyaman', 'Hatay'],
    location:
      'Türkiye\'nin güneyinde, Suriye sınırına yakın, Fırat Nehri havzasının güneybatısında yer alır. Akdeniz ile Güneydoğu Anadolu arasında bir geçiş bölgesindedir.',
    features:
      'Tarım ve sanayi kenti; bakır işçiliği, gastronomi turizmi ve tarihî Zeugma mozaikleriyle bilinir. İklimde yazlar sıcak ve kurak, kışlar ılımandır.',
    yksNote:
      'Harita sorularında Güneydoğu Anadolu grubunda; komşu iller ve bölge sınırları sık sorulur.',
  },
  istanbul: {
    name: 'İstanbul',
    region: 'Marmara Bölgesi',
    neighbors: ['Tekirdağ', 'Kocaeli', 'Sakarya', 'Bursa', 'Yalova', 'Kırklareli'],
    location:
      'Türkiye\'nin kuzeybatısında, Boğaziçi ve Haliç ile Avrupa ve Anadolu yakalarına ayrılır; Karadeniz ile Marmara Denizi arasında stratejik bir konumdadır.',
    features: 'Türkiye\'nin en kalabalık ili; finans, ticaret ve kültür merkezi.',
    yksNote: 'Boğazlar, Marmara ve komşu iller harita sorularında önemlidir.',
  },
  ankara: {
    name: 'Ankara',
    region: 'İç Anadolu Bölgesi',
    neighbors: ['Kırıkkale', 'Kırşehir', 'Aksaray', 'Eskişehir', 'Bolu', 'Çankırı', 'Konya'],
    location: 'Türkiye\'nin ortasında, İç Anadolu Platosu üzerinde başkent konumundadır.',
    features: 'Siyasi ve idari merkez; kurak-kıtasal iklim etkisi görülür.',
    yksNote: 'Başkent ve bölge merkezi olarak iç Anadolu sorularında geçer.',
  },
  izmir: {
    name: 'İzmir',
    region: 'Ege Bölgesi',
    neighbors: ['Manisa', 'Aydın', 'Balıkesir', 'Kütahya', 'Uşak'],
    location: 'Ege Denizi kıyısında, İzmir Körfezi\'nde önemli bir liman kentidir.',
    features: 'Tarım, turizm ve liman ticareti gelişmiştir; Akdeniz iklimi etkilidir.',
    yksNote: 'Ege kıyı şeridi ve körfez/coğrafi konum sorularında kullanılır.',
  },
  antalya: {
    name: 'Antalya',
    region: 'Akdeniz Bölgesi',
    neighbors: ['Burdur', 'Isparta', 'Konya', 'Mersin', 'Muğla'],
    location: 'Türkiye\'nin güneyinde, Akdeniz kıyısında, Toros Dağları\'nın eteklerinde yer alır.',
    features: 'Turizm başkenti; Akdeniz iklimi, kıyı ve dağ arasında keskin geçişler.',
    yksNote: 'Akdeniz iklimi, turizm ve kıyı-dağ ilişkisi sorulur.',
  },
  sanliurfa: {
    name: 'Şanlıurfa',
    region: 'Güneydoğu Anadolu Bölgesi',
    neighbors: ['Gaziantep', 'Adıyaman', 'Diyarbakır', 'Mardin', 'Kilis'],
    location: 'Güneydoğu Anadolu\'nun doğusunda, Harran Ovası ve Dicle-Fırat havzasına yakın.',
    features: 'Göbeklitepe ve tarım mirasıyla bilinir; step ve yarı kurak iklim görülür.',
    yksNote: 'Güneydoğu Anadolu haritasında Gaziantep ile birlikte çalışın.',
  },
};
