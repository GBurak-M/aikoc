import type { ChatTurn } from './conversationEngine';
import type { GeminiChatTurn } from './geminiClient';

export type CoachPromptContext = {
  profile: {
    name: string;
    field: string;
    targetUniv: string;
    targetDept: string;
    dailyTargetHours: string;
  };
  subjectAverages: { subject: string; percentage: number }[];
  recentExamSummary?: string;
  estimateRank?: string;
  curriculumNote?: string;
  trafficSummary?: string;
  learningSummary?: string;
  archiveStatsSummary?: string;
  centralAiInsight?: string;
};

export type CoachGeminiExtras = {
  intent?: string;
  worldContext?: string;
};

function weakStrongBlock(context: CoachPromptContext): string {
  const weak = [...context.subjectAverages].sort((a, b) => a.percentage - b.percentage)[0];
  const strong = [...context.subjectAverages].sort((a, b) => b.percentage - a.percentage)[0];
  const parts: string[] = [];
  if (weak) parts.push(`Zayıf ders: ${weak.subject} (%${weak.percentage})`);
  if (strong) parts.push(`Güçlü ders: ${strong.subject} (%${strong.percentage})`);
  if (context.recentExamSummary) parts.push(`Son denemeler: ${context.recentExamSummary}`);
  if (context.estimateRank) parts.push(`Tahmini sıralama: ${context.estimateRank}`);
  if (context.curriculumNote) parts.push(`Müfredat notu: ${context.curriculumNote}`);
  return parts.join('\n');
}

export function buildCoachSystemPrompt(
  context: CoachPromptContext,
  extras?: CoachGeminiExtras,
): string {
  const { profile } = context;
  const contextBlocks: string[] = [];
  if (extras?.intent) contextBlocks.push(`Sohbet niyeti: ${extras.intent}`);
  if (extras?.worldContext) contextBlocks.push(`CANLI VERİ (Zeka Merkezi):\n${extras.worldContext}`);
  if (context.trafficSummary) contextBlocks.push(`Site trafiği:\n${context.trafficSummary}`);
  if (context.learningSummary) contextBlocks.push(`Öğrenme profili:\n${context.learningSummary}`);
  if (context.archiveStatsSummary) contextBlocks.push(`Arşiv özeti:\n${context.archiveStatsSummary}`);
  if (context.centralAiInsight) contextBlocks.push(context.centralAiInsight);

  return `Sen "AI Koç"sun — aikoc sitesinin yapay zeka motorusun (Google Gemini). Türkiye'deki öğrencilere LGS, YKS, TYT, AYT, KPSS, ALES ve benzeri sınavlarda tecrübeli bir öğretmen gibi yardım edersin.

KURALLAR:
- Yanıtların Türkçe, dil bilgisi hatasız ve öğretmen üslubunda olsun.
- Önce doğrudan cevabı ver; sonra açıklama, örnek ve gerekirse adım adım çözüm sun.
- Matematik, fizik, kimya, biyoloji, felsefe, edebiyat, sosyal bilimler, astronomi, deniz bilimleri ve Din Kültürü/fıkıh konularında bilgili ol.
- Hava, namaz, takvim sorularında CANLI VERİ bloğunu kullan; yoksa Zeka Merkezi'nden konum seçilmesini kısaca söyle.
- Kişisel fetva verme; Din Kültürü konularında müfredat düzeyinde genel bilgi ver.
- Markdown kullan (**kalın**, madde işaretleri, başlıklar).

ÖĞRENCİ PROFİLİ:
Ad: ${profile.name || 'Öğrenci'}
Alan: ${profile.field}
Hedef üniversite: ${profile.targetUniv}
Hedef bölüm: ${profile.targetDept}
Günlük çalışma hedefi: ${profile.dailyTargetHours} saat

PERFORMANS:
${weakStrongBlock(context) || 'Henüz deneme verisi yok.'}

${contextBlocks.length ? `EK BAĞLAM:\n${contextBlocks.join('\n\n')}` : ''}`;
}

export function buildTranslationSystemPrompt(direction: 'TR_EN' | 'EN_TR'): string {
  const dir =
    direction === 'TR_EN'
      ? 'Türkçe terimi İngilizce karşılığı, tanım ve YKS ipucu ile açıkla.'
      : 'İngilizce terimi Türkçe karşılığı, tanım ve YKS ipucu ile açıkla.';
  return `Sen YKS/LGS akademik sözlük asistanısın. ${dir}

Yapı: **Terim** → **Karşılık** → **Tanım** → **YKS ipucu** → **Kısa analoji**`;
}

export function buildExamAnalysisSystemPrompt(profile: CoachPromptContext['profile']): string {
  return `Sen deneyimli bir sınav koçusun. Öğrenci deneme verilerine göre kişisel, motive edici ve uygulanabilir analiz yaz.

Öğrenci: ${profile.name}
Hedef: ${profile.targetUniv} — ${profile.targetDept} (${profile.field})
Günlük hedef: ${profile.dailyTargetHours} saat

Yapı: Genel durum → Güçlü alanlar → Geliştirilmesi gerekenler → Haftalık plan → Motivasyon. Türkçe, markdown.`;
}

export function buildScienceBriefSystemPrompt(location: string): string {
  return `Sen bilim gündemi editörüsün. Verilen OpenAlex verilerinden YKS öğrencisine uygun Türkçe bilim özeti yaz. Konum: ${location}. Kısa, okunabilir, madde işaretli.`;
}

export function buildSolverSystemPrompt(subject: string): string {
  return `Sen deneyimli bir ${subject} öğretmenisin. Türkiye YKS/LGS müfredatına uygun çözüm üret.

KURALLAR:
- Türkçe, net ve öğretici yaz.
- Yapı: **Doğrudan cevap** → **İlgili kural/formül** → **Adım adım çözüm** → **Özet** → **YKS ipucu** (varsa).
- Hesap sorusunda tüm adımları göster; kavram sorusunda tanım + mekanizma + örnek ver.
- Bilmediğin şeyi uydurma; emin değilsen varsayımını belirt.
- Markdown kullan.`;
}

export function mapHistoryForGemini(history: ChatTurn[], maxTurns = 10): GeminiChatTurn[] {
  return history.slice(-maxTurns).map((t) => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    text: t.text.slice(0, 4000),
  }));
}

export function parseDataUrlImage(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}
