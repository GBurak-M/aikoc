import { detectExamFromText } from '../data/nationalExams';
import { safeParse, safeSetItem } from './storage';

export type SiteEventType =
  | 'tab_visit'
  | 'chat_user'
  | 'chat_coach'
  | 'exam_add'
  | 'exam_analysis'
  | 'question_solve'
  | 'question_archive'
  | 'task_toggle'
  | 'task_add'
  | 'note_add'
  | 'dictionary_search'
  | 'library_search'
  | 'library_view'
  | 'library_read'
  | 'library_submit'
  | 'library_discover'
  | 'library_crawl'
  | 'chat_moderated'
  | 'ai_learning_record'
  | 'ai_core_process'
  | 'ai_core_deepen'
  | 'ai_core_reset'
  | 'ai_learning_bypass'
  | 'ai_learning_resume'
  | 'admin_member_update'
  | 'admin_member_delete'
  | 'admin_login'
  | 'exam_archive_search'
  | 'exam_archive_start'
  | 'exam_archive_resume'
  | 'exam_archive_pause'
  | 'exam_archive_finish'
  | 'exam_archive_restart'
  | 'location_search'
  | 'profile_edit'
  | 'member_login'
  | 'share_stats';

export type SiteEvent = {
  id: string;
  type: SiteEventType;
  at: string;
  tab?: string;
  detail?: string;
};

export type SiteTrafficStore = {
  events: SiteEvent[];
  firstSeen: string;
  lastSeen: string;
  inferredExamFocus: string | null;
};

const TRAFFIC_KEY = 'aikoc_site_traffic';
const MAX_EVENTS = 500;

function emptyStore(): SiteTrafficStore {
  const now = new Date().toISOString();
  return { events: [], firstSeen: now, lastSeen: now, inferredExamFocus: null };
}

export function loadSiteTraffic(): SiteTrafficStore {
  return safeParse<SiteTrafficStore>(TRAFFIC_KEY, emptyStore());
}

function saveTraffic(store: SiteTrafficStore) {
  safeSetItem(TRAFFIC_KEY, store);
}

function inferExamFocus(events: SiteEvent[]): string | null {
  const text = events
    .map((e) => `${e.detail ?? ''} ${e.tab ?? ''}`)
    .join(' ')
    .toLowerCase();
  const detected = detectExamFromText(text);
  return detected?.shortName ?? null;
}

export function logSiteEvent(
  type: SiteEventType,
  options?: { tab?: string; detail?: string },
): void {
  const store = loadSiteTraffic();
  const event: SiteEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: new Date().toISOString(),
    tab: options?.tab,
    detail: options?.detail?.slice(0, 200),
  };
  store.events = [event, ...store.events].slice(0, MAX_EVENTS);
  store.lastSeen = event.at;
  store.inferredExamFocus = inferExamFocus(store.events);
  saveTraffic(store);
}

export function logSiteTabVisit(tab: string) {
  logSiteEvent('tab_visit', { tab, detail: tab });
}

const TAB_LABELS: Record<string, string> = {
  panel: 'Panel',
  merkez: 'Zeka Merkezi',
  sorucozucu: 'AI Soru Çözücü',
  planlayici: 'Planlayıcı',
  kutuphane: 'Kütüphane',
  sinavlar: 'Grafikler',
  ulusalsinav: 'Ulusal Sınavlar',
  uyepanel: 'Üye Paneli',
};

function countByType(events: SiteEvent[], type: SiteEventType): number {
  return events.filter((e) => e.type === type).length;
}

function topTabs(events: SiteEvent[], limit = 3): string[] {
  const counts = new Map<string, number>();
  events
    .filter((e) => e.type === 'tab_visit' && e.tab)
    .forEach((e) => counts.set(e.tab!, (counts.get(e.tab!) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tab]) => TAB_LABELS[tab] ?? tab);
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** AI koç için kişiselleştirilmiş site trafiği özeti */
export function buildTrafficCoachSummary(): string {
  const store = loadSiteTraffic();
  const { events } = store;
  if (events.length === 0) {
    return 'Site trafiği henüz kayıt altında değil; ilk etkileşimlerinizden sonra kişisel koçluk önerileri güçlenecek.';
  }

  const visits = countByType(events, 'tab_visit');
  const chats = countByType(events, 'chat_user');
  const exams = countByType(events, 'exam_add');
  const questions = countByType(events, 'question_solve');
  const library = countByType(events, 'library_search') + countByType(events, 'library_view');
  const planner =
    countByType(events, 'task_toggle') + countByType(events, 'task_add') + countByType(events, 'note_add');
  const archiveTests =
    countByType(events, 'exam_archive_finish') +
    countByType(events, 'exam_archive_start');
  const top = topTabs(events);
  const days = daysSince(store.firstSeen);

  const lines: string[] = [
    `Toplam etkileşim: ${events.length} (yaklaşık ${days + 1} gündür siteyi kullanıyorsunuz)`,
    `En çok ziyaret: ${top.length ? top.join(' → ') : 'henüz belirgin değil'}`,
    `Deneme girişi: ${exams} | Arşiv testi: ${archiveTests} | AI sohbet: ${chats} | Soru çözümü: ${questions} | Kütüphane: ${library} | Planlayıcı: ${planner}`,
  ];

  if (store.inferredExamFocus) {
    lines.push(`İlgi alanı tahmini: ${store.inferredExamFocus}`);
  }

  if (exams === 0 && visits > 3) {
    lines.push('Öneri: Panelden ilk denemenizi girerek kişisel net analizini açın.');
  }
  if (questions === 0 && chats < 2) {
    lines.push('Öneri: AI Soru Çözücü ile takıldığınız soruları adım adım çözün.');
  }
  if (library === 0) {
    lines.push('Öneri: Kütüphanede ücretsiz kaynak araması yaparak çalışma materyali bulun.');
  }
  if (planner === 0) {
    lines.push('Öneri: Planlayıcıda haftalık hedef ve not ekleyerek düzeni kurun.');
  }
  if (archiveTests === 0 && visits > 2) {
    lines.push('Öneri: Ulusal Sınavlar arşivinden alan bazlı test çözün; Grafikler sekmesinde analiz görünür.');
  }

  return lines.join('\n');
}

export function getTrafficHighlights() {
  const store = loadSiteTraffic();
  return {
    totalEvents: store.events.length,
    inferredExam: store.inferredExamFocus,
    topTabs: topTabs(store.events),
    examAdds: countByType(store.events, 'exam_add'),
    chatCount: countByType(store.events, 'chat_user'),
  };
}
