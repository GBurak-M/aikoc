/** Müfredattaki tüm dersler — AI sohbet modları */

import { DEFAULT_SYSTEM_PROMPT } from './ai-engine.js';

export const CHAT_SUBJECTS = [
  'Türkçe',
  'Matematik',
  'Fen Bilimleri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Sosyal Bilgiler',
  'Tarih',
  'Coğrafya',
  'T.C. İnkılap Tarihi ve Atatürkçülük',
  'Türk Dili ve Edebiyatı',
  'Din Kültürü ve Ahlak Bilgisi',
  'İngilizce',
  'Almanca',
  'Fransızca',
  'Bilişim Teknolojileri',
  'Felsefe',
  'Psikoloji',
  'Hayat Bilgisi',
  'Görsel Sanatlar',
  'Müzik',
  'Beden Eğitimi ve Oyun',
  'Beden Eğitimi ve Spor',
];

export function subjectToMode(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** @type {Record<string, string>} */
export const MODE_PROMPTS = Object.fromEntries(
  CHAT_SUBJECTS.map((name) => [
    subjectToMode(name),
    `${DEFAULT_SYSTEM_PROMPT}\n\nOdak ders: **${name}**. MEB müfredatına uygun, adım adım ve öğrenci seviyesine göre anlat.`,
  ])
);

MODE_PROMPTS.genel = DEFAULT_SYSTEM_PROMPT;
