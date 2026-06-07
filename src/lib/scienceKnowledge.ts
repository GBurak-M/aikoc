import {
  SCIENCE_CATEGORIES,
  SCIENCE_DISCIPLINES,
  type ScienceCategoryId,
  type ScienceDiscipline,
} from '../data/scienceDisciplines';

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAllDisciplines(): ScienceDiscipline[] {
  return SCIENCE_DISCIPLINES;
}

export function getDisciplinesByCategory(category: ScienceCategoryId): ScienceDiscipline[] {
  return SCIENCE_DISCIPLINES.filter((d) => d.category === category);
}

export function findDiscipline(query: string): ScienceDiscipline | null {
  const n = normalize(query);
  if (!n) return null;

  const exact = SCIENCE_DISCIPLINES.find(
    (d) =>
      normalize(d.tr) === n ||
      normalize(d.en) === n ||
      normalize(d.id.replace(/_/g, ' ')) === n ||
      d.aliases?.some((a) => normalize(a) === n),
  );
  if (exact) return exact;

  const contains = SCIENCE_DISCIPLINES.find(
    (d) =>
      n.includes(normalize(d.tr)) ||
      normalize(d.tr).includes(n) ||
      n.includes(normalize(d.en)) ||
      d.aliases?.some((a) => n.includes(normalize(a)) || normalize(a).includes(n)),
  );
  return contains ?? null;
}

export function searchDisciplines(query: string, limit = 8): ScienceDiscipline[] {
  const n = normalize(query);
  if (!n) return [];

  const scored = SCIENCE_DISCIPLINES.map((d) => {
    const keys = [
      d.tr,
      d.en,
      d.id.replace(/_/g, ' '),
      ...(d.aliases ?? []),
      d.definition,
    ].map(normalize);

    let score = 0;
    for (const key of keys) {
      if (key === n) score += 10;
      else if (key.startsWith(n) || n.startsWith(key)) score += 6;
      else if (key.includes(n) || n.split(' ').some((w) => w.length > 3 && key.includes(w))) score += 3;
    }
    return { d, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.d);

  return scored;
}

export function formatDiscipline(entry: ScienceDiscipline): string {
  const cat = SCIENCE_CATEGORIES[entry.category];
  return `**${entry.tr}** (${entry.en})
Kategori: ${cat.tr} — ${cat.description}

**Tanım:** ${entry.definition}

**Yöntemler:** ${entry.methods}

**YKS / Sınav bağlantısı:** ${entry.yksLink}`;
}

export function formatCategoryOverview(categoryId: ScienceCategoryId): string {
  const cat = SCIENCE_CATEGORIES[categoryId];
  const list = getDisciplinesByCategory(categoryId)
    .map((d) => `• ${d.tr} (${d.en})`)
    .join('\n');
  return `**${cat.tr}** (${cat.en})
${cat.description}

Alt dallar (${getDisciplinesByCategory(categoryId).length}):
${list}`;
}

export function formatScienceTaxonomyOverview(): string {
  const lines: string[] = [
    'Dünya üzerindeki ana bilim dalları (9 üst kategori, ' +
      `${SCIENCE_DISCIPLINES.length} alt dal):`,
    '',
  ];

  for (const [id, cat] of Object.entries(SCIENCE_CATEGORIES) as [
    ScienceCategoryId,
    (typeof SCIENCE_CATEGORIES)[ScienceCategoryId],
  ][]) {
    const subs = getDisciplinesByCategory(id);
    lines.push(
      `**${cat.tr}** (${subs.length} dal): ${subs.map((s) => s.tr).join(', ')}`,
    );
  }

  lines.push(
    '',
    'Belirli bir dal hakkında soru sorabilirsin — örn. "Astrofizik nedir?", "Biyoinformatik YKS ile ilişkisi", "sosyal bilimler dalları".',
  );
  return lines.join('\n');
}

/** Koç / sözlük / sohbet için bilim dalı sorusuna yanıt üretir */
export function tryScienceDisciplineReply(message: string): string | null {
  const raw = message.trim();
  const m = normalize(raw);
  if (!m) return null;

  const wantsFullList =
    /bilim dallari|bilim dalları|bilimler neler|tum bilim|tüm bilim|butun bilim|bütün bilim|science fields|all sciences|bilim kategorileri|bilim dallari neler|hangi bilim dallari/.test(
      m,
    );

  if (wantsFullList) {
    return formatScienceTaxonomyOverview();
  }

  if (/dallar|dal listesi|nelerdir|hangileri|listele|kategori/.test(m)) {
    for (const [id, cat] of Object.entries(SCIENCE_CATEGORIES) as [
      ScienceCategoryId,
      (typeof SCIENCE_CATEGORIES)[ScienceCategoryId],
    ][]) {
      const trKey = normalize(cat.tr);
      const enKey = normalize(cat.en);
      if (m.includes(trKey) || m.includes(enKey) || m.includes(trKey.split(' ')[0])) {
        return formatCategoryOverview(id);
      }
    }
  }

  const extracted =
    raw.match(
      /(?:bilim dal[ıi]|dal[ıi]|alan[ıi]|disiplin)\s*(?:olarak|nedir|ne demek|hakkında|hakkinda)?\s*[:\-]?\s*([\p{L}\s\-]+)/iu,
    )?.[1] ??
    raw.match(
      /([\p{L}\s\-]{3,40})\s+(?:bilim dal[ıi]|nedir|ne demek|nasil bir bilim|nasıl bir bilim)/iu,
    )?.[1] ??
    raw.match(/(?:^|\s)([\p{L}\s\-]{3,30})\s*\?/u)?.[1];

  const candidate = extracted?.trim() ?? raw;
  const found = findDiscipline(candidate);
  if (found) return formatDiscipline(found);

  const results = searchDisciplines(candidate, 5);
  if (results.length > 0 && /nedir|ne demek|tanit|tanıt|acikla|açıkla|bilim/.test(m)) {
    return `Aramanla eşleşen bilim dalları:\n\n${results.map((d) => `• **${d.tr}:** ${d.definition}`).join('\n\n')}\n\nBirini seçersen detaylı anlatırım.`;
  }

  if (results.length === 1) return formatDiscipline(results[0]);

  return null;
}
