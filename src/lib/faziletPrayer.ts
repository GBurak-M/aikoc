import type { PrayerTimes } from './worldData';

type DiyanetIlce = {
  IlceAdi: string;
  IlceID: string;
};

type DiyanetSehir = {
  SehirAdi: string;
  SehirID: string;
};

type DiyanetVakit = {
  Imsak: string;
  Gunes: string;
  Ogle: string;
  Ikindi: string;
  Aksam: string;
  Yatsi: string;
  MiladiTarihKisa: string;
  HicriTarihKisa?: string;
};

const TR_COUNTRY_CODE = '2';

function normalizeTr(s: string): string {
  return s
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function pickNextPrayer(timings: Record<string, string>): { name: string; time: string } {
  const order: [string, string][] = [
    ['İmsak', timings.imsak],
    ['Güneş', timings.gunes],
    ['Öğle', timings.ogle],
    ['İkindi', timings.ikindi],
    ['Akşam', timings.aksam],
    ['Yatsı', timings.yatsi],
  ];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const [name, time] of order) {
    const [h, m] = time.split(':').map(Number);
    if (h * 60 + m > nowMin) return { name, time };
  }
  return { name: 'İmsak (yarın)', time: order[0][1] };
}

async function fetchSehirler(): Promise<DiyanetSehir[]> {
  const res = await fetch(`https://ezanvakti.emushaf.net/sehirler/${TR_COUNTRY_CODE}`);
  if (!res.ok) throw new Error('Şehir listesi alınamadı');
  return res.json();
}

async function fetchIlceler(sehirId: string): Promise<DiyanetIlce[]> {
  const res = await fetch(`https://ezanvakti.emushaf.net/ilceler/${sehirId}`);
  if (!res.ok) throw new Error('İlçe listesi alınamadı');
  return res.json();
}

async function fetchVakitler(ilceId: string): Promise<DiyanetVakit[]> {
  const res = await fetch(`https://ezanvakti.emushaf.net/vakitler/${ilceId}`);
  if (!res.ok) throw new Error('Namaz vakitleri alınamadı');
  return res.json();
}

async function resolveIlceId(il: string, ilce?: string): Promise<{ ilceId: string; regionName: string }> {
  const cities = await fetchSehirler();
  const ilNorm = normalizeTr(il);
  const city =
    cities.find((c) => normalizeTr(c.SehirAdi) === ilNorm) ||
    cities.find((c) => normalizeTr(c.SehirAdi).includes(ilNorm) || ilNorm.includes(normalizeTr(c.SehirAdi)));

  if (!city) {
    const istanbul = cities.find((c) => normalizeTr(c.SehirAdi) === 'istanbul');
    if (!istanbul) throw new Error('İl bulunamadı');
    const districts = await fetchIlceler(istanbul.SehirID);
    const merkez = districts[0];
    return { ilceId: merkez.IlceID, regionName: `${istanbul.SehirAdi} / ${merkez.IlceAdi}` };
  }

  const districts = await fetchIlceler(city.SehirID);
  const ilceNorm = ilce ? normalizeTr(ilce) : '';
  const district =
    (ilceNorm &&
      districts.find((d) => normalizeTr(d.IlceAdi) === ilceNorm)) ||
    districts.find((d) => ilceNorm && normalizeTr(d.IlceAdi).includes(ilceNorm)) ||
    districts.find((d) => normalizeTr(d.IlceAdi) === normalizeTr(city.SehirAdi)) ||
    districts[0];

  return {
    ilceId: district.IlceID,
    regionName: `${city.SehirAdi} / ${district.IlceAdi}`,
  };
}

/**
 * Fazilet Takvimi ile uyumlu Diyanet il/ilçe vakitleri.
 * Kaynak: Diyanet İşleri Başkanlığı (ezanvakti.emushaf.net — Fazilet Takvimi ile aynı resmi veri seti).
 */
export async function fetchFaziletPrayerTimes(
  il: string,
  ilce?: string,
): Promise<PrayerTimes & { regionName: string; source: string }> {
  const { ilceId, regionName } = await resolveIlceId(il, ilce);
  const vakitler = await fetchVakitler(ilceId);
  const today = new Date();
  const todayKey = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

  const row =
    vakitler.find((v) => v.MiladiTarihKisa === todayKey) ||
    vakitler[0];

  if (!row) throw new Error('Bugünün vakitleri bulunamadı');

  const timings = {
    imsak: row.Imsak,
    gunes: row.Gunes,
    ogle: row.Ogle,
    ikindi: row.Ikindi,
    aksam: row.Aksam,
    yatsi: row.Yatsi,
  };
  const next = pickNextPrayer(timings);

  return {
    date: row.MiladiTarihKisa.replace(/\./g, ' '),
    ...timings,
    hijriDate: row.HicriTarihKisa ?? '',
    nextPrayer: next.name,
    nextPrayerTime: next.time,
    regionName,
    source: 'Fazilet Takvimi · Diyanet İşleri Başkanlığı',
  };
}

/** Open-Meteo yerleşiminden il/ilçe çıkarıp Fazilet vakitlerini getirir */
export async function fetchFaziletPrayerForSettlement(
  displayName: string,
  admin1?: string,
  admin2?: string,
): Promise<PrayerTimes & { regionName: string; source: string }> {
  const parts = displayName.split(',').map((p) => p.trim());
  const il = admin1 || parts[parts.length - 2] || parts[0] || 'İstanbul';
  const ilce = admin2 || parts[0];
  return fetchFaziletPrayerTimes(il, ilce);
}
