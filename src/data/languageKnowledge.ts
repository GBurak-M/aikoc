/** Türkçe ve İngilizce dil bilgisi, kelime ve kalıp bilgisi — yerel koç için */

export type GrammarRule = {
  id: string;
  topicTr: string;
  topicEn: string;
  explanationTr: string;
  explanationEn: string;
  examples: { tr: string; en: string }[];
  yksTip?: string;
};

export type PhraseEntry = {
  tr: string;
  en: string;
  context: string;
};

export type VocabEntry = {
  tr: string;
  en: string;
  pos: string;
  exampleTr: string;
  exampleEn: string;
};

export const GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'present-simple',
    topicTr: 'Geniş zaman (Present Simple)',
    topicEn: 'Present Simple',
    explanationTr: 'Alışkanlık, genel gerçek ve düzenli tekrarlayan eylemler için kullanılır. Olumlu: özne + fiil (3. tekil hede -s). Olumsuz: do/does + not + fiil.',
    explanationEn: 'Used for habits, facts, and routines. Affirmative: subject + base verb (add -s for he/she/it). Negative: do/does + not + verb.',
    examples: [
      { tr: 'Her gün matematik çalışırım.', en: 'I study math every day.' },
      { tr: 'Su 100°C\'de kaynar.', en: 'Water boils at 100°C.' },
    ],
    yksTip: 'YDS/YDT paragraf sorularında zaman ipuçları (always, usually, every day) geniş zamanı işaret eder.',
  },
  {
    id: 'present-continuous',
    topicTr: 'Şimdiki zaman (Present Continuous)',
    topicEn: 'Present Continuous',
    explanationTr: 'Şu anda devam eden eylemler: am/is/are + fiil-ing. Geçici durumlar ve yakın gelecek planları için de kullanılır.',
    explanationEn: 'Ongoing actions now: am/is/are + verb-ing. Also temporary situations and near-future arrangements.',
    examples: [
      { tr: 'Şu an paragraf çözüyorum.', en: 'I am solving a paragraph question now.' },
      { tr: 'Yarın sınavım var, bu yüzden çalışıyorum.', en: 'I have an exam tomorrow, so I am studying.' },
    ],
    yksTip: 'now, at the moment, currently kelimeleri şimdiki zamanı gösterir.',
  },
  {
    id: 'past-simple',
    topicTr: 'Geçmiş zaman (Past Simple)',
    topicEn: 'Past Simple',
    explanationTr: 'Tamamlanmış geçmiş eylemler. Düzenli fiillerde -ed; düzensiz fiillerde 2. hal. Olumsuz: did not + yalın fiil.',
    explanationEn: 'Completed past actions. Regular verbs take -ed; irregular verbs use past form. Negative: did not + base verb.',
    examples: [
      { tr: 'Dün üç deneme analiz ettim.', en: 'I analyzed three practice tests yesterday.' },
      { tr: 'O konuyu geçen hafta bitirdim.', en: 'I finished that topic last week.' },
    ],
  },
  {
    id: 'future-will',
    topicTr: 'Gelecek zaman (will / going to)',
    topicEn: 'Future (will / going to)',
    explanationTr: 'will: ani karar, tahmin, vaat. going to: önceden planlanmış niyet veya kanıta dayalı tahmin.',
    explanationEn: 'will: spontaneous decisions, predictions, promises. going to: prior plans or evidence-based predictions.',
    examples: [
      { tr: 'Bu hafta sonu deneme çözeceğim.', en: 'I will take a practice exam this weekend.' },
      { tr: 'Bulutlar çok koyu; yağmur yağacak.', en: 'The clouds are dark; it is going to rain.' },
    ],
  },
  {
    id: 'articles',
    topicTr: 'İngilizce tanımlık (a / an / the)',
    topicEn: 'Articles (a / an / the)',
    explanationTr: 'a/an: tekil, sayılabilir, belirsiz. an sesli harfle başlayan kelimelerden önce. the: belirli, daha önce bahsedilen veya tek olan.',
    explanationEn: 'a/an: singular countable, indefinite. an before vowel sounds. the: definite, previously mentioned or unique.',
    examples: [
      { tr: 'Bir kitap okudum. Kitap çok faydalıydı.', en: 'I read a book. The book was very useful.' },
      { tr: 'Güneş doğudan doğar.', en: 'The sun rises in the east.' },
    ],
    yksTip: 'Paragraf boşluk doldurmada sonraki cümlede aynı isim the ile tekrarlanıyorsa ilk boşlukta a/an aranır.',
  },
  {
    id: 'relative-clauses',
    topicTr: 'İlgi cümleleri (who / which / that)',
    topicEn: 'Relative clauses',
    explanationTr: 'İsimleri tanımlayan yan cümleler. İnsan: who/that. Nesne/hayvan/kavram: which/that. Nesne konumunda who/which atlanabilir.',
    explanationEn: 'Clauses that modify nouns. People: who/that. Things: which/that. Object position allows omission of who/which.',
    examples: [
      { tr: 'Bana yardım eden öğretmen çok sabırlıydı.', en: 'The teacher who helped me was very patient.' },
      { tr: 'Okuduğum makale çok açıklayıcıydı.', en: 'The article (that) I read was very clear.' },
    ],
  },
  {
    id: 'tr-vowel-harmony',
    topicTr: 'Türkçe ünlü uyumu',
    topicEn: 'Turkish vowel harmony',
    explanationTr: 'Ekler, kökün son ünlüsüne göre büyük (a,ı,o,u) veya küçük (e,i,ö,ü) ünlü grubuna uyum sağlar. Örnek: ev-de, kapı-da.',
    explanationEn: 'Suffixes follow the root\'s last vowel: back vowels (a,ı,o,u) or front vowels (e,i,ö,ü).',
    examples: [
      { tr: 'kitap + lar → kitaplar', en: 'books (plural suffix harmony)' },
      { tr: 'deniz + de → denizde', en: 'in the sea (locative harmony)' },
    ],
    yksTip: 'Dil bilgisi sorularında ek uyumu ve yapım eki–çekim eki ayrımına dikkat edin.',
  },
  {
    id: 'tr-conjunctions',
    topicTr: 'Türkçe bağlaçlar ve cümle türleri',
    topicEn: 'Turkish conjunctions and sentence types',
    explanationTr: 'Sıralama: ve, ile, hem…hem. Karşıtlık: ama, fakat, ancak. Neden-sonuç: çünkü, -dığı için. Koşul: -se/-sa.',
    explanationEn: 'Coordination: and, but. Cause: because. Condition: if (-se/-sa in Turkish).',
    examples: [
      { tr: 'Çalıştım çünkü hedefime ulaşmak istiyorum.', en: 'I studied because I want to reach my goal.' },
      { tr: 'Vaktin varsa birlikte tekrar yapalım.', en: 'If you have time, let\'s review together.' },
    ],
  },
];

export const EVERYDAY_PHRASES: PhraseEntry[] = [
  { tr: 'Merhaba, nasılsın?', en: 'Hello, how are you?', context: 'greeting' },
  { tr: 'İyiyim, teşekkür ederim. Sen nasılsın?', en: 'I\'m fine, thank you. How about you?', context: 'greeting' },
  { tr: 'Yardımcı olabilir miyim?', en: 'Can I help you?', context: 'offer' },
  { tr: 'Biraz daha açıklar mısın?', en: 'Could you explain a bit more?', context: 'clarify' },
  { tr: 'Anladım, devam edelim.', en: 'I understand, let\'s continue.', context: 'acknowledge' },
  { tr: 'Bu konuyu pek bilmiyorum.', en: 'I don\'t know this topic well.', context: 'honest' },
  { tr: 'Harika bir soru!', en: 'That\'s a great question!', context: 'praise' },
  { tr: 'Bir mola vermek iyi gelir.', en: 'Taking a break would do you good.', context: 'wellbeing' },
  { tr: 'Yavaş yavaş ilerliyorsun.', en: 'You\'re making progress step by step.', context: 'encourage' },
  { tr: 'Yanlış yapmak öğrenmenin parçası.', en: 'Making mistakes is part of learning.', context: 'encourage' },
];

export const ACADEMIC_VOCAB: VocabEntry[] = [
  { tr: 'sonuç', en: 'conclusion', pos: 'noun', exampleTr: 'Paragrafın sonunda sonuç cümlesi aranır.', exampleEn: 'Look for the conclusion sentence at the end.' },
  { tr: 'kanıt', en: 'evidence', pos: 'noun', exampleTr: 'Yazar iddiasını kanıtlarla destekliyor.', exampleEn: 'The author supports the claim with evidence.' },
  { tr: 'öneri', en: 'suggestion', pos: 'noun', exampleTr: 'Makale yeni bir öneri sunuyor.', exampleEn: 'The paper presents a new suggestion.' },
  { tr: 'analiz', en: 'analysis', pos: 'noun', exampleTr: 'Deneme sonuçlarını analiz ettik.', exampleEn: 'We analyzed the practice test results.' },
  { tr: 'gelişmek', en: 'improve', pos: 'verb', exampleTr: 'Her hafta biraz gelişiyorum.', exampleEn: 'I improve a little every week.' },
  { tr: 'çaba', en: 'effort', pos: 'noun', exampleTr: 'Düzenli çaba başarıyı getirir.', exampleEn: 'Consistent effort brings success.' },
  { tr: 'hedef', en: 'goal', pos: 'noun', exampleTr: 'Hedefim tıp fakültesi.', exampleEn: 'My goal is medical school.' },
  { tr: 'tekrar', en: 'review / repetition', pos: 'noun', exampleTr: 'Konuyu tekrar etmek şart.', exampleEn: 'Reviewing the topic is essential.' },
];

function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function findGrammarRule(query: string): GrammarRule | null {
  const q = normalize(query);
  return (
    GRAMMAR_RULES.find(
      (r) =>
        normalize(r.topicTr).includes(q) ||
        normalize(r.topicEn).includes(q) ||
        q.includes(normalize(r.topicTr)) ||
        q.includes(normalize(r.id.replace(/-/g, ' '))),
    ) ?? null
  );
}

export function findGrammarByKeyword(message: string): GrammarRule | null {
  const m = normalize(message);
  const map: [RegExp, string][] = [
    [/genis zaman|present simple|simple present/, 'present-simple'],
    [/simdiki zaman|present continuous|present progressive|ing form/, 'present-continuous'],
    [/gecmis zaman|past simple|simple past/, 'past-simple'],
    [/gelecek zaman|future tense|will\b|going to/, 'future-will'],
    [/a an the|article|tanidlik/, 'articles'],
    [/ilgi cumle|relative clause|who which that/, 'relative-clauses'],
    [/unlu uyum|vowel harmony/, 'tr-vowel-harmony'],
    [/baglac|conjunction/, 'tr-conjunctions'],
  ];
  for (const [re, id] of map) {
    if (re.test(m)) return GRAMMAR_RULES.find((r) => r.id === id) ?? null;
  }
  return findGrammarRule(message);
}

export function findVocab(term: string): VocabEntry | null {
  const n = normalize(term);
  return ACADEMIC_VOCAB.find((v) => normalize(v.tr) === n || normalize(v.en) === n) ?? null;
}

export function formatGrammarReply(rule: GrammarRule, preferEn: boolean): string {
  const lines = [
    preferEn ? `**${rule.topicEn}**` : `**${rule.topicTr}**`,
    '',
    preferEn ? rule.explanationEn : rule.explanationTr,
    '',
    '**Örnekler / Examples:**',
    ...rule.examples.map((e) => `• TR: ${e.tr}\n  EN: ${e.en}`),
  ];
  if (rule.yksTip) lines.push('', `📌 Sınav ipucu: ${rule.yksTip}`);
  return lines.join('\n');
}

export function formatVocabReply(entry: VocabEntry): string {
  return `**${entry.tr}** ↔ **${entry.en}** (${entry.pos})
• Örnek: ${entry.exampleTr}
• Example: ${entry.exampleEn}`;
}

export function pickEncouragingPhrase(): string {
  const pool = EVERYDAY_PHRASES.filter((p) => p.context === 'encourage');
  return pool[Math.floor(Math.random() * pool.length)]?.tr ?? 'Birlikte ilerleyelim.';
}
