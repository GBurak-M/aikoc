export type Settlement = {
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1?: string;
  admin2?: string;
  displayName: string;
};

export type HourlyWeather = {
  time: string;
  hourLabel: string;
  temp: number;
  precipProb: number;
  code: number;
  label: string;
};

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

export type ScienceItem = {
  id: string;
  title: string;
  summary: string;
  field: string;
  date: string;
  source: string;
  url?: string;
};

export type WorldSnapshot = {
  settlement: Settlement;
  weather: HourlyWeather[];
  currentTemp: number | null;
  prayer: PrayerTimes;
  calendar: CalendarInfo;
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

const OPENALEX_FIELDS: Array<{ field: string; concept: string }> = [
  { field: 'Fizik', concept: 'C121332964' },
  { field: 'Biyoloji', concept: 'C185592680' },
  { field: 'Kimya', concept: 'C158790577' },
  { field: 'Matematik', concept: 'C33923547' },
  { field: 'Bilgisayar', concept: 'C41008148' },
];

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

export async function searchSettlements(query: string): Promise<Settlement[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', '12');
  url.searchParams.set('language', 'tr');
  url.searchParams.set('countryCode', 'TR');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((r: {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
    admin2?: string;
  }) => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    admin1: r.admin1,
    admin2: r.admin2,
    displayName: [r.name, r.admin2, r.admin1].filter(Boolean).join(', '),
  }));
}

export async function fetchHourlyWeather(lat: number, lon: number): Promise<{
  hourly: HourlyWeather[];
  currentTemp: number | null;
}> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
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
    hourly.push({
      time: h.time[i],
      hourLabel: formatHour(h.time[i]),
      temp: Math.round(h.temperature_2m[i]),
      precipProb: h.precipitation_probability[i] ?? 0,
      code: h.weather_code[i],
      label: weatherLabel(h.weather_code[i]),
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

async function fetchOpenAlexField(field: string, conceptId: string): Promise<ScienceItem[]> {
  const url = new URL('https://api.openalex.org/works');
  url.searchParams.set('filter', `concepts.id:${conceptId},from_publication_date:2025-01-01`);
  url.searchParams.set('sort', 'publication_date:desc');
  url.searchParams.set('per_page', '3');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((w: {
    id: string;
    title: string;
    publication_date: string;
    abstract_inverted_index?: Record<string, number[]>;
    primary_location?: { source?: { display_name?: string } };
    doi?: string;
  }) => {
    let summary = 'Özet mevcut değil.';
    if (w.abstract_inverted_index) {
      const words = Object.entries(w.abstract_inverted_index)
        .flatMap(([word, positions]) => positions.map((pos) => ({ word, pos })))
        .sort((a, b) => a.pos - b.pos)
        .map((x) => x.word)
        .slice(0, 40)
        .join(' ');
      if (words) summary = `${words}…`;
    }
    return {
      id: w.id,
      title: w.title ?? 'Başlıksız',
      summary,
      field,
      date: w.publication_date ?? '',
      source: w.primary_location?.source?.display_name ?? 'OpenAlex',
      url: w.doi ? `https://doi.org/${w.doi.replace('https://doi.org/', '')}` : undefined,
    };
  });
}

export async function fetchScienceDigest(): Promise<ScienceItem[]> {
  const batches = await Promise.all(
    OPENALEX_FIELDS.map(({ field, concept }) =>
      fetchOpenAlexField(field, concept).catch(() => []),
    ),
  );
  const merged = batches.flat();
  const seen = new Set<string>();
  return merged
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);
}

export async function fetchWorldSnapshot(settlement: Settlement): Promise<WorldSnapshot> {
  const [weatherResult, prayer, calendar, science] = await Promise.all([
    fetchHourlyWeather(settlement.lat, settlement.lon),
    fetchPrayerTimes(settlement.lat, settlement.lon),
    buildCalendarInfo(),
    fetchScienceDigest(),
  ]);

  return {
    settlement,
    weather: weatherResult.hourly,
    currentTemp: weatherResult.currentTemp,
    prayer,
    calendar,
    science,
    fetchedAt: new Date().toISOString(),
  };
}

export const WORLD_CACHE_KEY = 'aikoc_world_snapshot';
export const LOCATION_CACHE_KEY = 'aikoc_settlement';
export const WORLD_CACHE_TTL_MS = 30 * 60 * 1000;

export function isWorldCacheStale(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() > WORLD_CACHE_TTL_MS;
}
