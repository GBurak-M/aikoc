import { detectCoachIntent } from './coachIntents';
import { isEditorSessionActive } from './library';
import { logSiteEvent } from './siteTraffic';
import { safeParse, safeSetItem } from './storage';

const QUEUE_KEY = 'aikoc_ai_learning_queue';
const CORE_KEY = 'aikoc_ai_knowledge_core';
const BYPASS_KEY = 'aikoc_ai_learning_bypass';
const MOTOR_KEY = 'aikoc_ai_learning_motor';
const MAX_QUEUE = 400;
const MAX_PATTERNS_PER_DOMAIN = 24;
const LEARNING_INTERVAL_MS = 10 * 60 * 1000;

export type BehaviorDomain = 'human' | 'society' | 'machine';

export type EmotionalTone = 'support' | 'curious' | 'stressed' | 'neutral' | 'positive';

export type LearningSignal = {
  id: string;
  at: string;
  userSnippet: string;
  intent: string;
  domains: BehaviorDomain[];
  tone: EmotionalTone;
  memberType: 'guest' | 'member';
  processed: boolean;
};

export type BehaviorPattern = {
  id: string;
  domain: BehaviorDomain;
  theme: string;
  insight: string;
  frequency: number;
  lastSeen: string;
  examples: string[];
};

export type AdminSourceManifest = {
  generatedAt: string;
  depthLevel: number;
  mission: string;
  modules: {
    name: string;
    behaviors: string[];
    coachHints: string[];
  }[];
};

export type AiLearningMotorState = {
  bypassed: boolean;
  bypassedAt: string | null;
  bypassReason: string | null;
  lastResetAt: string | null;
  automationEnabled: boolean;
};

export type KnowledgeCore = {
  version: number;
  depthLevel: number;
  lastProcessed: string | null;
  lastDeepen: string | null;
  totalSignalsProcessed: number;
  positiveMission: string;
  human: BehaviorPattern[];
  society: BehaviorPattern[];
  machine: BehaviorPattern[];
  sourceManifest: AdminSourceManifest;
};

function defaultCore(): KnowledgeCore {
  const mission =
    'İnsanlığa pozitif katkı: saygılı, kapsayıcı, öğrenmeyi destekleyen ve zararlı davranışları reddeden merkezi koç zekası.';
  return {
    version: 1,
    depthLevel: 1,
    lastProcessed: null,
    lastDeepen: null,
    totalSignalsProcessed: 0,
    positiveMission: mission,
    human: [],
    society: [],
    machine: [],
    sourceManifest: {
      generatedAt: new Date().toISOString(),
      depthLevel: 1,
      mission,
      modules: [],
    },
  };
}

function loadQueue(): LearningSignal[] {
  return safeParse<LearningSignal[]>(QUEUE_KEY, []);
}

function saveQueue(queue: LearningSignal[]) {
  safeSetItem(QUEUE_KEY, queue.slice(-MAX_QUEUE));
}

export function loadKnowledgeCore(): KnowledgeCore {
  return safeParse<KnowledgeCore>(CORE_KEY, defaultCore());
}

function saveKnowledgeCore(core: KnowledgeCore) {
  safeSetItem(CORE_KEY, core);
}

function defaultMotorState(): AiLearningMotorState {
  return {
    bypassed: false,
    bypassedAt: null,
    bypassReason: null,
    lastResetAt: null,
    automationEnabled: false,
  };
}

export function loadLearningMotorState(): AiLearningMotorState {
  return safeParse<AiLearningMotorState>(MOTOR_KEY, defaultMotorState());
}

function saveMotorState(state: AiLearningMotorState) {
  safeSetItem(MOTOR_KEY, state);
  safeSetItem(BYPASS_KEY, state.bypassed);
}

export function isLearningBypassed(): boolean {
  return safeParse<boolean>(BYPASS_KEY, false);
}

/** Yanlış öğrenmeyi devre dışı bırakır — koç merkezi modeli kullanmaz */
export function setLearningBypass(bypassed: boolean, reason?: string): void {
  const motor = loadLearningMotorState();
  motor.bypassed = bypassed;
  motor.bypassedAt = bypassed ? new Date().toISOString() : null;
  motor.bypassReason = bypassed ? (reason ?? 'Admin baypas') : null;
  saveMotorState(motor);
  if (bypassed) logSiteEvent('ai_learning_bypass', { detail: reason ?? 'baypas' });
  else logSiteEvent('ai_learning_resume', { detail: 'öğrenme yeniden açıldı' });
}

export function setLearningAutomationEnabled(enabled: boolean): void {
  const motor = loadLearningMotorState();
  motor.automationEnabled = enabled;
  saveMotorState(motor);
  syncLearningAutomation();
}

export function isLearningAutomationEnabled(): boolean {
  return loadLearningMotorState().automationEnabled;
}

/** Admin sıfırlama motoru: tüm öğrenmeyi siler ve baypasa alır */
export function resetCentralAiMotor(reason?: string): void {
  saveQueue([]);
  saveKnowledgeCore(defaultCore());
  const motor = loadLearningMotorState();
  motor.bypassed = true;
  motor.bypassedAt = new Date().toISOString();
  motor.bypassReason = reason ?? 'Admin tam sıfırlama';
  motor.lastResetAt = new Date().toISOString();
  saveMotorState(motor);
  deepenCounter = 0;
  logSiteEvent('ai_core_reset', { detail: motor.bypassReason });
}

/** Baypası kaldırır; otomasyon açıksa döngü yeniden başlar */
export function resumeCentralAiMotor(): void {
  setLearningBypass(false);
}

function anonymize(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[e-posta]')
    .replace(/\b\d{10,11}\b/g, '[tel]')
    .slice(0, 160);
}

function detectTone(message: string): EmotionalTone {
  const m = message.toLowerCase();
  if (/yoruldum|umutsuz|kayg|stres|korkuyorum|becerem/.test(m)) return 'stressed';
  if (/motivasyon|tesekkur|basardim|mutlu|gurur/.test(m)) return 'positive';
  if (/neden|nasil|acaba|merak|ogren/.test(m)) return 'curious';
  if (/yardim|destek|zorlaniyorum|morali/.test(m)) return 'support';
  return 'neutral';
}

function domainsForIntent(intent: string, message: string): BehaviorDomain[] {
  const domains = new Set<BehaviorDomain>();
  const m = message.toLowerCase();

  if (['motivation', 'plan', 'goal', 'human', 'general'].includes(intent) || /duygu|korku|ozguven|sabir/.test(m)) {
    domains.add('human');
  }
  if (['social', 'society', 'national_exam', 'goal', 'stats'].includes(intent) || /toplum|aile|okul|rekabet|adalet/.test(m)) {
    domains.add('society');
  }
  if (['traffic', 'science_news', 'library', 'machine', 'weather', 'calendar'].includes(intent) || /yapay zeka|site|uygulama|internet/.test(m)) {
    domains.add('machine');
  }
  if (domains.size === 0) domains.add('human');
  return [...domains];
}

function themeFromSignal(signal: LearningSignal): string {
  const map: Record<string, string> = {
    motivation: 'motivasyon ve dayanıklılık',
    plan: 'çalışma planı ve disiplin',
    stats: 'performans takibi',
    goal: 'hedef ve gelecek planlama',
    national_exam: 'ulusal sınav baskısı',
    library: 'öz-gelişim ve okuma',
    science_news: 'bilimsel merak',
    traffic: 'dijital etkileşim alışkanlığı',
    machine: 'yapay zeka ve teknoloji algısı',
    human: 'duygusal ihtiyaçlar',
    society: 'toplumsal beklenti',
    general: 'genel öğrenme arayışı',
  };
  return map[signal.intent] ?? signal.intent;
}

function insightFromSignal(signal: LearningSignal, domain: BehaviorDomain): string {
  const toneNote =
    signal.tone === 'stressed'
      ? 'Kullanıcılar stres anında sakinleştirici ve adım adım yönlendirme arıyor.'
      : signal.tone === 'positive'
        ? 'Başarı anlarında pekiştirme ve hedefe bağlama etkili.'
        : signal.tone === 'curious'
          ? 'Merak odaklı sorularda örnek ve kaynak önerisi değerli.'
          : 'Net, yapılandırılmış yanıtlar güven oluşturuyor.';

  const domainNote: Record<BehaviorDomain, string> = {
    human: 'İnsan davranışı: duygu, öz-disiplin ve öz-güven döngüsü koçlukta merkezde.',
    society: 'Toplum davranışı: sınav kültürü, aile/okul beklentisi ve adil fırsat dili önemli.',
    machine: 'Makine davranışı: kullanıcılar AI’dan şeffaf, güvenilir ve araç odaklı destek bekliyor.',
  };

  return `${domainNote[domain]} ${toneNote} (Niyet: ${themeFromSignal(signal)})`;
}

function upsertPattern(
  list: BehaviorPattern[],
  domain: BehaviorDomain,
  theme: string,
  insight: string,
  example: string,
): BehaviorPattern[] {
  const key = `${domain}:${theme}`;
  const idx = list.findIndex((p) => `${p.domain}:${p.theme}` === key);
  if (idx >= 0) {
    const p = list[idx];
    const examples = [example, ...p.examples.filter((e) => e !== example)].slice(0, 3);
    list[idx] = {
      ...p,
      frequency: p.frequency + 1,
      lastSeen: new Date().toISOString(),
      insight,
      examples,
    };
    return list;
  }
  return [
    {
      id: `pat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      domain,
      theme,
      insight,
      frequency: 1,
      lastSeen: new Date().toISOString(),
      examples: [example],
    },
    ...list,
  ].slice(0, MAX_PATTERNS_PER_DOMAIN);
}

function rebuildSourceManifest(core: KnowledgeCore): AdminSourceManifest {
  const pack = (domain: BehaviorDomain, patterns: BehaviorPattern[]) => ({
    name: domain === 'human' ? 'humanBehavior' : domain === 'society' ? 'societyBehavior' : 'machineBehavior',
    behaviors: patterns.slice(0, 8).map((p) => `${p.theme} (×${p.frequency}): ${p.insight}`),
    coachHints: patterns.slice(0, 5).map((p) => `Kullanıcı "${p.theme}" konusunda sık soruyor — ${p.insight.split('.')[0]}.`),
  });

  return {
    generatedAt: new Date().toISOString(),
    depthLevel: core.depthLevel,
    mission: core.positiveMission,
    modules: [
      pack('human', core.human),
      pack('society', core.society),
      pack('machine', core.machine),
    ],
  };
}

/** Her koç sohbetinden sonra çağrılır — tüm kullanıcılar (misafir + üye) */
export function recordChatExchange(
  userMessage: string,
  coachReply: string,
  options: { memberType: 'guest' | 'member' },
): void {
  void coachReply;
  if (isLearningBypassed()) return;

  const intent = detectCoachIntent(userMessage);
  const signal: LearningSignal = {
    id: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    userSnippet: anonymize(userMessage),
    intent,
    domains: domainsForIntent(intent, userMessage),
    tone: detectTone(userMessage),
    memberType: options.memberType,
    processed: false,
  };

  const queue = loadQueue();
  queue.push(signal);
  saveQueue(queue);
  logSiteEvent('ai_learning_record', { detail: `${intent} · ${signal.domains.join('+')}` });

  if (isLearningAutomationEnabled()) {
    processLearningQueue();
  }
}

export function processLearningQueue(): { processed: number; core: KnowledgeCore } {
  let core = loadKnowledgeCore();
  const queue = loadQueue();
  const pending = queue.filter((s) => !s.processed);
  if (pending.length === 0) return { processed: 0, core };

  for (const signal of pending) {
    for (const domain of signal.domains) {
      const theme = themeFromSignal(signal);
      const insight = insightFromSignal(signal, domain);
      if (domain === 'human') core.human = upsertPattern(core.human, domain, theme, insight, signal.userSnippet);
      if (domain === 'society') core.society = upsertPattern(core.society, domain, theme, insight, signal.userSnippet);
      if (domain === 'machine') core.machine = upsertPattern(core.machine, domain, theme, insight, signal.userSnippet);
    }
    signal.processed = true;
  }

  core.totalSignalsProcessed += pending.length;
  core.lastProcessed = new Date().toISOString();
  core.sourceManifest = rebuildSourceManifest(core);
  saveKnowledgeCore(core);
  saveQueue(queue);

  logSiteEvent('ai_core_process', { detail: `${pending.length} sinyal işlendi` });
  return { processed: pending.length, core };
}

/** Admin: öğrenmeyi derinleştirir — benzer kalıpları birleştirir, derinlik artar */
export function deepenCoreLearning(): KnowledgeCore {
  let core = loadKnowledgeCore();
  processLearningQueue();

  const mergeSimilar = (patterns: BehaviorPattern[]): BehaviorPattern[] => {
    const byTheme = new Map<string, BehaviorPattern>();
    for (const p of patterns) {
      const existing = byTheme.get(p.theme);
      if (!existing) {
        byTheme.set(p.theme, p);
        continue;
      }
      byTheme.set(p.theme, {
        ...existing,
        frequency: existing.frequency + p.frequency,
        insight: `${existing.insight} Ayrıca: ${p.insight.split('.')[0]}.`,
        examples: [...existing.examples, ...p.examples].slice(0, 3),
        lastSeen: p.lastSeen > existing.lastSeen ? p.lastSeen : existing.lastSeen,
      });
    }
    return [...byTheme.values()].sort((a, b) => b.frequency - a.frequency).slice(0, MAX_PATTERNS_PER_DOMAIN);
  };

  core.human = mergeSimilar(core.human);
  core.society = mergeSimilar(core.society);
  core.machine = mergeSimilar(core.machine);
  core.depthLevel = Math.min(99, core.depthLevel + 1);
  core.lastDeepen = new Date().toISOString();
  core.sourceManifest = rebuildSourceManifest(core);
  saveKnowledgeCore(core);

  logSiteEvent('ai_core_deepen', { detail: `derinlik ${core.depthLevel}` });
  return core;
}

/** Koç yanıtlarına eklenecek merkezi zeka özeti */
export function buildCoreKnowledgeCoachBlock(): string {
  if (isLearningBypassed()) return '';

  const core = loadKnowledgeCore();
  if (core.totalSignalsProcessed === 0 && core.human.length === 0) return '';

  const top = (list: BehaviorPattern[], label: string) => {
    if (list.length === 0) return '';
    const lines = list
      .slice(0, 2)
      .map((p) => `• ${p.theme}: ${p.insight.split('.')[0]}.`)
      .join('\n');
    return `\n${label}:\n${lines}`;
  };

  return `🧠 Merkezi öğrenme (derinlik ${core.depthLevel}, ${core.totalSignalsProcessed} sohbet sinyali):
${core.positiveMission}${top(core.human, 'İnsan davranışı')}${top(core.society, 'Toplum davranışı')}${top(core.machine, 'Makine/AI davranışı')}`;
}

export function getLearningStats() {
  const core = loadKnowledgeCore();
  const queue = loadQueue();
  const motor = loadLearningMotorState();
  return {
    queuePending: queue.filter((s) => !s.processed).length,
    queueTotal: queue.length,
    depthLevel: core.depthLevel,
    totalProcessed: core.totalSignalsProcessed,
    humanPatterns: core.human.length,
    societyPatterns: core.society.length,
    machinePatterns: core.machine.length,
    lastProcessed: core.lastProcessed,
    lastDeepen: core.lastDeepen,
    bypassed: motor.bypassed,
    bypassReason: motor.bypassReason,
    automationEnabled: motor.automationEnabled,
    lastResetAt: motor.lastResetAt,
  };
}

export function exportKnowledgeBundle(): string {
  const core = loadKnowledgeCore();
  const queue = loadQueue();
  return JSON.stringify({ core, queue, exportedAt: new Date().toISOString() }, null, 2);
}

export function importKnowledgeBundle(json: string): boolean {
  try {
    const data = JSON.parse(json) as { core?: KnowledgeCore; queue?: LearningSignal[] };
    if (data.core) saveKnowledgeCore(data.core);
    if (data.queue?.length) {
      const merged = [...loadQueue(), ...data.queue].slice(-MAX_QUEUE);
      saveQueue(merged);
    }
    return true;
  } catch {
    return false;
  }
}

let learningIntervalId: ReturnType<typeof setInterval> | null = null;
let deepenCounter = 0;

function isCycleEligible(): boolean {
  if (isLearningBypassed()) return false;
  return isEditorSessionActive() || isLearningAutomationEnabled();
}

export function runLearningCycle(): KnowledgeCore {
  if (isLearningBypassed()) return loadKnowledgeCore();

  const { core } = processLearningQueue();
  deepenCounter += 1;
  if (deepenCounter % 3 === 0 && isCycleEligible()) {
    return deepenCoreLearning();
  }
  return core;
}

export function startAILearningCycle(): void {
  stopAILearningCycle();
  if (!isCycleEligible()) return;

  void runLearningCycle();

  learningIntervalId = setInterval(() => {
    if (!isCycleEligible()) {
      stopAILearningCycle();
      return;
    }
    void runLearningCycle();
  }, LEARNING_INTERVAL_MS);
}

export function stopAILearningCycle(): void {
  if (learningIntervalId) {
    clearInterval(learningIntervalId);
    learningIntervalId = null;
  }
}

export function syncLearningWithEditorSession(): void {
  syncLearningAutomation();
}

/** Admin oturumu veya editör PIN ile otomatik öğrenme döngüsü */
export function syncLearningAutomation(): void {
  if (isCycleEligible()) startAILearningCycle();
  else stopAILearningCycle();
}
