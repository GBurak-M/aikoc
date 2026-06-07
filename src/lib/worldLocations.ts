import { findCityInQuestion } from '../data/turkeyCities';
import { formatTurkeyCityLesson } from './conceptLessons';
import { formatTeacherLesson, isLocationQuestion } from './teacherStyle';
import { searchGlobalPlaces, type GeocodePlace } from './worldData';

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const FEATURE_LABELS: Record<string, string> = {
  PPLC: 'başkent',
  PPLA: 'yönetim merkezi',
  PPLA2: 'il merkezi',
  PPLA3: 'ilçe merkezi',
  PPL: 'yerleşim',
  PCLI: 'ülke',
  ADM1: 'birinci düzey idari bölge',
  ADM2: 'ikinci düzey idari bölge',
};

/** Sorudan aranacak yer adını çıkarır */
export function extractPlaceQuery(question: string): string {
  let q = question.trim();

  q = q.replace(
    /\s*(nerede(dir|)?|hangi\s+(ülke(de|de)|ulke(de|de)|bölge(de|de)|bolge(de|de)|kıtada|kitada|konumda)|konumu?\s+nedir|where\s+is|located\s+in)\s*$/i,
    '',
  );
  q = q.replace(
    /^(nerede(dir|)?|hangi\s+\w+\s+|where\s+is\s+(the\s+)?|where\s+is\s+)/i,
    '',
  );
  q = q.replace(/[?!.:;]+$/g, '').trim();

  return q;
}

function describeHemisphere(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'Kuzey' : 'Güney';
  const ew = lon >= 0 ? 'Doğu' : 'Batı';
  return `${ns} yarımküre, ${ew} yarımküre`;
}

function guessContinent(lat: number, lon: number, country: string): string {
  const c = normalize(country);
  if (c === 'turkiye' || c === 'turkey') {
    return 'Asya ile Avrupa arasında (transkontinental)';
  }
  if (lat >= 5 && lat <= 83 && lon >= -170 && lon <= -50) return 'Kuzey Amerika';
  if (lat >= -56 && lat <= 13 && lon >= -82 && lon <= -34) return 'Güney Amerika';
  if (lat >= 36 && lat <= 72 && lon >= -25 && lon <= 45) return 'Avrupa';
  if (lat >= -35 && lat <= 38 && lon >= -20 && lon <= 55) return 'Afrika';
  if (lat >= -10 && lat <= 80 && lon >= 25 && lon <= 180) return 'Asya';
  if (lat >= -50 && lat <= 0 && lon >= 110 && lon <= 180) return 'Okyanusya';
  return 'Harita üzerinde bu koordinatlara denk gelen bölge';
}

function placeTypeLabel(code?: string): string {
  if (!code) return 'yerleşim';
  return FEATURE_LABELS[code] ?? 'coğrafi konum';
}

function formatPopulation(n?: number): string | null {
  if (!n || n < 1000) return null;
  if (n >= 1_000_000) return `Yaklaşık nüfus: ${(n / 1_000_000).toFixed(1)} milyon`;
  if (n >= 1000) return `Yaklaşık nüfus: ${Math.round(n / 1000)} bin`;
  return null;
}

function formatGlobalLocationLesson(question: string, place: GeocodePlace, alternates: GeocodePlace[]): string {
  const type = placeTypeLabel(place.featureCode);
  const regionParts = [place.admin2, place.admin1].filter(Boolean);
  const regionText = regionParts.length > 0 ? regionParts.join(' / ') : null;
  const hemisphere = describeHemisphere(place.lat, place.lon);
  const continent = guessContinent(place.lat, place.lon, place.country);
  const pop = formatPopulation(place.population);

  const directParts = [`**${place.name}**`];
  if (place.country) directParts.push(`**${place.country}** içinde yer alır`);
  if (regionText) directParts.push(`${regionText} bölgesinde`);
  directParts.push(`(${type})`);

  const altText =
    alternates.length > 0
      ? `Benzer eşleşmeler: ${alternates.map((a) => a.displayName).join(' · ')}`
      : '';

  return formatTeacherLesson({
    subject: 'Coğrafya',
    topic: `${place.name} — Dünya Konumu`,
    question,
    directAnswer: directParts.join(', ') + '.',
    sections: [
      {
        title: 'Coğrafi bilgiler',
        body: [
          place.country ? `• **Ülke:** ${place.country}` : null,
          regionText ? `• **Bölge / eyalet:** ${regionText}` : null,
          `• **Koordinatlar:** ${place.lat.toFixed(2)}° enlem, ${place.lon.toFixed(2)}° boylam`,
          `• **Yarımküre:** ${hemisphere}`,
          `• **Kıta / bölge:** ${continent}`,
          place.elevation != null ? `• **Rakım:** yaklaşık ${Math.round(place.elevation)} m` : null,
          pop ? `• **${pop}**` : null,
          place.timezone ? `• **Saat dilimi:** ${place.timezone}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      },
      {
        title: 'Haritada nasıl bulunur?',
        body: `${place.name} için haritada ${place.country} sınırları içinde, ${hemisphere} bölgesine bakın. Enlem-boylam (${place.lat.toFixed(2)}, ${place.lon.toFixed(2)}) koordinatları konumu net gösterir.`,
      },
      ...(altText
        ? [
            {
              title: 'Diğer olası eşleşmeler',
              body: altText,
            },
          ]
        : []),
    ],
    summary: `${place.name} → ${place.country}${regionText ? ` → ${regionText}` : ''}.`,
    yksNote:
      'Coğrafya sorularında ülke–bölge–şehir hiyerarşisini ve kıta/yarımküre bilgisini birlikte yazmak puan kazandırır.',
    practice: {
      question: `${place.name} hangi ülkededir?`,
      answer: place.country,
    },
  });
}

export function buildWorldLocationNotFound(question: string, triedQuery?: string): string {
  const hint = triedQuery ? ` («${triedQuery}» için arama yapıldı)` : '';
  return `📍 **Coğrafya — Konum Sorusu**

**Sorunuz:** «${question}»

### Cevap

Dünya genelinde bu adla eşleşen bir konum bulamadım${hint}.

Yazımı kontrol edip **şehir, ülke veya bölge** adını net yazın.

**Örnekler:** «Paris nerede», «Japonya hangi kıtada», «New York nerededir», «Nil Nehri nerede», «Amazon Ormanları hangi ülkede»`;
}

/** Türkiye yerel verisi + dünya geocoding ile konum sorusunu yanıtlar */
export async function resolveWorldLocation(question: string): Promise<string | null> {
  const q = normalize(question);
  if (!isLocationQuestion(q)) return null;

  const trCity = findCityInQuestion(question);
  if (trCity) return formatTurkeyCityLesson(question, trCity);

  const placeQuery = extractPlaceQuery(question);
  if (!placeQuery || placeQuery.length < 2) {
    return buildWorldLocationNotFound(question);
  }

  try {
    const results = await searchGlobalPlaces(placeQuery, 8);
    if (results.length === 0) {
      return buildWorldLocationNotFound(question, placeQuery);
    }

    const best = results[0];
    const trEnhance = findCityInQuestion(best.name);
    if (trEnhance && (best.countryCode === 'TR' || normalize(best.country).includes('turki'))) {
      return formatTurkeyCityLesson(question, trEnhance);
    }

    return formatGlobalLocationLesson(question, best, results.slice(1, 4));
  } catch {
    return buildWorldLocationNotFound(question, placeQuery);
  }
}
