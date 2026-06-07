export type Settlement = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1?: string;
  admin2?: string;
  displayName: string;
};

export type GeocodePlace = Settlement & {
  featureCode?: string;
  population?: number;
  timezone?: string;
  countryCode?: string;
  elevation?: number;
};

export type HourlyWeather = {
  time: string;
  hourLabel: string;
  temp: number;
  precipProb: number;
  code: number;
  label: string;
  /** Ortalama rüzgar hızı (m/s) */
  windSpeedMs: number | null;
  /** Ani rüzgar / rüzgar hamleleri (m/s) */
  windGustMs: number | null;
};

/** m/s → km/sa (km/h) */
export function windMsToKmh(ms: number): number {
  return ms * 3.6;
}

export function formatWindPair(ms: number | null | undefined): { ms: string; kmh: string } | null {
  if (ms == null || Number.isNaN(ms)) return null;
  return { ms: ms.toFixed(1), kmh: windMsToKmh(ms).toFixed(0) };
}

export type PrayerTimes = {
  date: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  hijriDate: string;
  nextPrayer: string;
  nextPrayerTime: string;
  source?: string;
  regionName?: string;
};

export type CalendarEvent = {
  date: string;
  title: string;
  type: 'resmi' | 'dini' | 'bilim' | 'egitim';
};

export type CalendarInfo = {
  gregorianDate: string;
  dayName: string;
  monthName: string;
  hijriDate: string;
  weekOfYear: number;
  yksCountdownDays: number | null;
  upcomingEvents: CalendarEvent[];
};

export type ScienceKind = 'makale' | 'kitap' | 'yayin';

export type ScienceItem = {
  id: string;
  title: string;
  summary: string;
  field: string;
  kind: ScienceKind;
  date: string;
  source: string;
  url?: string;
  authors?: string;
};

export type ScienceTopicFeed = {
  field: string;
  articles: ScienceItem[];
  books: ScienceItem[];
  publications: ScienceItem[];
};

export type WorldSnapshot = {
  settlement: Settlement;
  weather: HourlyWeather[];
  currentTemp: number | null;
  prayer: PrayerTimes;
  calendar: CalendarInfo;
  /** Konuya göre gruplanmış, Türkçeleştirilmiş bilim akışı */
  scienceTopics: ScienceTopicFeed[];
  /** Düz liste — AI koçu ve özetler için */
  science: ScienceItem[];
  fetchedAt: string;
};

const WEATHER_LABELS: Record<number, string> = {
  0: 'Açık',
  1: 'Çoğunlukla açık',
  2: 'Parçalı bulutlu',
  3: 'Kapalı',
  45: 'Sis',
  48: 'Kırağılı sis',
  51: 'Çisenti',
  53: 'Çisenti',
  55: 'Yoğun çisenti',
  61: 'Hafif yağmur',
  63: 'Yağmur',
  65: 'Şiddetli yağmur',
  71: 'Hafif kar',
  73: 'Kar',
  75: 'Yoğun kar',
  80: 'Sağanak',
  81: 'Sağanak',
  82: 'Şiddetli sağanak',
  95: 'Fırtına',
  96: 'Dolu',
  99: 'Şiddetli dolu',
};

const TR_HOLIDAYS_2026: CalendarEvent[] = [
  { date: '2026-01-01', title: 'Yılbaşı', type: 'resmi' },
  { date: '2026-04-23', title: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı', type: 'resmi' },
  { date: '2026-05-01', title: 'Emek ve Dayanışma Günü', type: 'resmi' },
  { date: '2026-05-19', title: 'Atatürkü Anma, Gençlik ve Spor Bayramı', type: 'resmi' },
  { date: '2026-07-15', title: 'Demokrasi ve Millî Birlik Günü', type: 'resmi' },
  { date: '2026-08-30', title: 'Zafer Bayramı', type: 'resmi' },
  { date: '2026-10-29', title: 'Cumhuriyet Bayramı', type: 'resmi' },
  { date: '2026-06-06', title: 'YKS 2026 (Tahmini dönem)', type: 'egitim' },
];

const OPENALEX_TOPICS: Array<{ field: string; concept: string }> = [
  { field: 'Fizik', concept: 'C121332964' },
  { field: 'Biyoloji', concept: 'C185592680' },
  { field: 'Kimya', concept: 'C158790577' },
  { field: 'Matematik', concept: 'C33923547' },
  { field: 'Bilgisayar Bilimi', concept: 'C41008148' },
  { field: 'Tıp', concept: 'C71924100' },
  { field: 'Psikoloji', concept: 'C15744967' },
  { field: 'Mühendislik', concept: 'C127413603' },
  { field: 'Çevre Bilimleri', concept: 'C18903297' },
  { field: 'Sosyal Bilimler', concept: 'C17744445' },
];

const KIND_LABEL: Record<ScienceKind, string> = {
  makale: 'Makale',
  kitap: 'Kitap',
  yayin: 'Yayın',
};

function scienceFromDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 8);
  return d.toISOString().slice(0, 10);
}

function weatherLabel(code: number): string {
  return WEATHER_LABELS[code] ?? 'Değişken';
}

function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function pickNextPrayer(timings: Record<string, string>): { name: string; time: string } {
  const order = [
    ['İmsak', timings.Fajr],
    ['Güneş', timings.Sunrise],
    ['Öğle', timings.Dhuhr],
    ['İkindi', timings.Asr],
    ['Akşam', timings.Maghrib],
    ['Yatsı', timings.Isha],
  ] as const;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const [name, time] of order) {
    const [h, m] = time.split(':').map(Number);
    if (h * 60 + m > nowMin) return { name, time };
  }
  return { name: 'İmsak (yarın)', time: timings.Fajr };
}

type GeocodeApiRow = {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  feature_code?: string;
  population?: number;
  timezone?: string;
  elevation?: number;
};

function mapGeocodeRow(r: GeocodeApiRow): GeocodePlace {
  return {
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    admin1: r.admin1,
    admin2: r.admin2,
    displayName: [r.name, r.admin2, r.admin1, r.country].filter(Boolean).join(', '),
    featureCode: r.feature_code,
    population: r.population,
    timezone: r.timezone,
    countryCode: r.country_code,
    elevation: r.elevation,
  };
}

async function fetchGeocodePlaces(
  query: string,
  options?: { countryCode?: string; count?: number },
): Promise<GeocodePlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', String(options?.count ?? 10));
  url.searchParams.set('language', 'tr');
  if (options?.countryCode) url.searchParams.set('countryCode', options.countryCode);

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((r: GeocodeApiRow) => mapGeocodeRow(r));
}

/** Türkiye odaklı yerleşim araması (Zeka Merkezi vb.) */
export async function searchSettlements(query: string): Promise<Settlement[]> {
  return fetchGeocodePlaces(query, { countryCode: 'TR', count: 12 });
}

/** Dünya genelinde şehir, il, ülke ve yerleşim araması */
export async function searchGlobalPlaces(query: string, count = 10): Promise<GeocodePlace[]> {
  return fetchGeocodePlaces(query, { count });
}

export async function fetchHourlyWeather(lat: number, lon: number): Promise<{
  hourly: HourlyWeather[];
  currentTemp: number | null;
}> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'hourly',
    'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m',
  );
  url.searchParams.set('windspeed_unit', 'ms');
  url.searchParams.set('timezone', 'Europe/Istanbul');
  url.searchParams.set('forecast_days', '2');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Hava durumu alınamadı');

  const data = await res.json();
  const h = data.hourly;
  const now = Date.now();
  const hourly: HourlyWeather[] = [];

  for (let i = 0; i < h.time.length; i++) {
    const t = new Date(h.time[i]).getTime();
    if (t < now - 3600000) continue;
    if (hourly.length >= 24) break;
    const windSpeed = h.wind_speed_10m?.[i];
    const windGust = h.wind_gusts_10m?.[i];
    hourly.push({
      time: h.time[i],
      hourLabel: formatHour(h.time[i]),
      temp: Math.round(h.temperature_2m[i]),
      precipProb: h.precipitation_probability[i] ?? 0,
      code: h.weather_code[i],
      label: weatherLabel(h.weather_code[i]),
      windSpeedMs: typeof windSpeed === 'number' ? Math.round(windSpeed * 10) / 10 : null,
      windGustMs: typeof windGust === 'number' ? Math.round(windGust * 10) / 10 : null,
    });
  }

  return { hourly, currentTemp: hourly[0]?.temp ?? null };
}

export async function fetchPrayerTimes(lat: number, lon: number): Promise<PrayerTimes> {
  const url = new URL('https://api.aladhan.com/v1/timings');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('method', '13');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Namaz vakitleri alınamadı');

  const data = await res.json();
  const t = data.data.timings;
  const hijri = data.data.date.hijri;
  const next = pickNextPrayer(t);

  return {
    date: data.data.date.readable,
    imsak: t.Fajr,
    gunes: t.Sunrise,
    ogle: t.Dhuhr,
    ikindi: t.Asr,
    aksam: t.Maghrib,
    yatsi: t.Isha,
    hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
    nextPrayer: next.name,
    nextPrayerTime: next.time,
  };
}

async function fetchHijriToday(): Promise<string> {
  const today = new Date();
  const d = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
  const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${d}`);
  if (!res.ok) return '';
  const data = await res.json();
  const h = data.data.hijri;
  return `${h.day} ${h.month.en} ${h.year}`;
}

export async function buildCalendarInfo(): Promise<CalendarInfo> {
  const now = new Date();
  const hijriDate = await fetchHijriToday().catch(() => '');

  const upcoming = TR_HOLIDAYS_2026
    .map((e) => ({ ...e, daysLeft: daysUntil(e.date) }))
    .filter((e) => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6)
    .map(({ date, title, type }) => ({ date, title, type }));

  const yks = TR_HOLIDAYS_2026.find((e) => e.title.includes('YKS'));
  const yksDays = yks ? Math.max(0, daysUntil(yks.date)) : null;

  return {
    gregorianDate: now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    dayName: now.toLocaleDateString('tr-TR', { weekday: 'long' }),
    monthName: now.toLocaleDateString('tr-TR', { month: 'long' }),
    hijriDate,
    weekOfYear: Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7,
    ),
    yksCountdownDays: yksDays,
    upcomingEvents: upcoming,
  };
}

type OpenAlexWork = {
  id: string;
  title: string;
  publication_date: string;
  abstract_inverted_index?: Record<string, number[]>;
  primary_location?: { source?: { display_name?: string }; landing_page_url?: string };
  doi?: string;
  open_access?: { oa_url?: string };
  authorships?: Array<{ author?: { display_name?: string } }>;
};

function abstractFromInverted(index?: Record<string, number[]>): string {
  if (!index) return 'Özet mevcut değil.';
  const words = Object.entries(index)
    .flatMap(([word, positions]) => positions.map((pos) => ({ word, pos })))
    .sort((a, b) => a.pos - b.pos)
    .map((x) => x.word)
    .slice(0, 55)
    .join(' ');
  return words ? `${words}…` : 'Özet mevcut değil.';
}

function mapOpenAlexWork(w: OpenAlexWork, field: string, kind: ScienceKind): ScienceItem {
  const authors = (w.authorships ?? [])
    .slice(0, 4)
    .map((a) => a.author?.display_name)
    .filter(Boolean)
    .join(', ');
  const doi = w.doi?.replace('https://doi.org/', '');
  const url = w.open_access?.oa_url
    ?? (doi ? `https://doi.org/${doi}` : w.primary_location?.landing_page_url);

  return {
    id: w.id,
    title: w.title ?? 'Başlıksız',
    summary: abstractFromInverted(w.abstract_inverted_index),
    field,
    kind,
    date: w.publication_date ?? '',
    source: w.primary_location?.source?.display_name ?? 'OpenAlex (küresel)',
    url: url || undefined,
    authors: authors || undefined,
  };
}

async function fetchOpenAlexByType(
  field: string,
  conceptId: string,
  workType: 'article' | 'book' | 'book-chapter',
  kind: ScienceKind,
  perPage: number,
): Promise<ScienceItem[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set(
    'filter',
    `concepts.id:${conceptId},type:${workType},from_publication_date:${scienceFromDate()}`,
  );
  url.searchParams.set('sort', 'publication_date:desc');
  url.searchParams.set('per_page', String(perPage));

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((w: OpenAlexWork) => mapOpenAlexWork(w, field, kind));
}

async function fetchTopicFeed(field: string, conceptId: string): Promise<ScienceTopicFeed> {
  const [articles, books, publications] = await Promise.all([
    fetchOpenAlexByType(field, conceptId, 'article', 'makale', 3).catch(() => []),
    fetchOpenAlexByType(field, conceptId, 'book', 'kitap', 2).catch(() => []),
    fetchOpenAlexByType(field, conceptId, 'book-chapter', 'yayin', 2).catch(() => []),
  ]);
  return { field, articles, books, publications };
}

export function flattenScienceFeed(topics: ScienceTopicFeed[]): ScienceItem[] {
  const seen = new Set<string>();
  const all: ScienceItem[] = [];
  for (const t of topics) {
    for (const item of [...t.articles, ...t.books, ...t.publications]) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      all.push(item);
    }
  }
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

async function localizeScienceItems(items: ScienceItem[]): Promise<ScienceItem[]> {
  if (items.length === 0) return [];
  const { translateManyToTurkish } = await import('./translate');
  const titles = items.map((i) => i.title);
  const summaries = items.map((i) => i.summary);
  const [titlesTr, summariesTr] = await Promise.all([
    translateManyToTurkish(titles, 3, 300),
    translateManyToTurkish(summaries, 2, 350),
  ]);
  return items.map((item, idx) => ({
    ...item,
    title: titlesTr[idx] ?? item.title,
    summary: summariesTr[idx] ?? item.summary,
  }));
}

async function localizeTopicFeed(feed: ScienceTopicFeed): Promise<ScienceTopicFeed> {
  const [articles, books, publications] = await Promise.all([
    localizeScienceItems(feed.articles),
    localizeScienceItems(feed.books),
    localizeScienceItems(feed.publications),
  ]);
  return { field: feed.field, articles, books, publications };
}

export async function fetchScienceDigest(): Promise<{
  topics: ScienceTopicFeed[];
  flat: ScienceItem[];
}> {
  const rawTopics = await Promise.all(
    OPENALEX_TOPICS.map(({ field, concept }) => fetchTopicFeed(field, concept)),
  );

  const topicsWithContent = rawTopics.filter(
    (t) => t.articles.length > 0 || t.books.length > 0 || t.publications.length > 0,
  );

  const topics = await Promise.all(
    topicsWithContent.map((t) => localizeTopicFeed(t)),
  );

  return { topics, flat: flattenScienceFeed(topics) };
}

export { KIND_LABEL as SCIENCE_KIND_LABEL };

export async function fetchWorldSnapshot(settlement: Settlement): Promise<WorldSnapshot> {
  const { fetchFaziletPrayerForSettlement } = await import('./faziletPrayer');
  const [weatherResult, prayer, calendar, scienceResult] = await Promise.all([
    fetchHourlyWeather(settlement.lat, settlement.lon),
    fetchFaziletPrayerForSettlement(
      settlement.displayName,
      settlement.admin1,
      settlement.admin2,
    ).catch(() => fetchPrayerTimes(settlement.lat, settlement.lon)),
    buildCalendarInfo(),
    fetchScienceDigest(),
  ]);

  return {
    settlement,
    weather: weatherResult.hourly,
    currentTemp: weatherResult.currentTemp,
    prayer,
    calendar,
    scienceTopics: scienceResult.topics,
    science: scienceResult.flat,
    fetchedAt: new Date().toISOString(),
  };
}

export const WORLD_CACHE_KEY = 'aikoc_world_snapshot';
export const LOCATION_CACHE_KEY = 'aikoc_settlement';
export const WORLD_CACHE_TTL_MS = 30 * 60 * 1000;

export function isWorldCacheStale(fetchedAt: string, snapshot?: WorldSnapshot | null): boolean {
  if (Date.now() - new Date(fetchedAt).getTime() > WORLD_CACHE_TTL_MS) return true;
  if (snapshot && !snapshot.scienceTopics?.length && (snapshot.science?.length ?? 0) > 0) return true;
  if (snapshot?.science?.[0] && snapshot.science[0].kind == null) return true;
  return false;
}

/** Eski önbellekte scienceTopics yoksa science listesinden türetir */
export function ensureScienceTopics(snapshot: WorldSnapshot): WorldSnapshot {
  if (snapshot.scienceTopics?.length) return snapshot;
  const items = (snapshot.science ?? []).map((s) => ({
    ...s,
    kind: (s as ScienceItem).kind ?? ('makale' as ScienceKind),
  }));
  const byField = new Map<string, ScienceItem[]>();
  for (const item of items) {
    const list = byField.get(item.field) ?? [];
    list.push(item);
    byField.set(item.field, list);
  }
  const scienceTopics: ScienceTopicFeed[] = [...byField.entries()].map(([field, all]) => ({
    field,
    articles: all.filter((i) => i.kind === 'makale'),
    books: all.filter((i) => i.kind === 'kitap'),
    publications: all.filter((i) => i.kind === 'yayin'),
  }));
  return { ...snapshot, scienceTopics, science: items };
}
