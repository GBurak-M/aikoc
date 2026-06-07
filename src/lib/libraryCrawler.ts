import { discoverFreeResources, CRAWL_TOPIC_ROTATION } from './libraryDiscovery';
import { importDiscoveredItem, isEditorSessionActive } from './library';
import { logSiteEvent } from './siteTraffic';
import { safeParse, safeSetItem } from './storage';

const CRAWLER_STATE_KEY = 'aikoc_library_crawler';
const CRAWL_INTERVAL_MS = 8 * 60 * 1000;

export type CrawlerState = {
  active: boolean;
  lastRun: string | null;
  lastAdded: number;
  totalImported: number;
  topicIndex: number;
  logs: string[];
  lastError: string | null;
};

function defaultState(): CrawlerState {
  return {
    active: false,
    lastRun: null,
    lastAdded: 0,
    totalImported: 0,
    topicIndex: 0,
    logs: [],
    lastError: null,
  };
}

export function loadCrawlerState(): CrawlerState {
  return safeParse<CrawlerState>(CRAWLER_STATE_KEY, defaultState());
}

function saveCrawlerState(state: CrawlerState) {
  safeSetItem(CRAWLER_STATE_KEY, state);
}

function pushLog(state: CrawlerState, line: string): CrawlerState {
  const logs = [line, ...state.logs].slice(0, 30);
  return { ...state, logs };
}

let intervalId: ReturnType<typeof setInterval> | null = null;
let runningCycle = false;

export async function runLibraryCrawlCycle(): Promise<CrawlerState> {
  let state = loadCrawlerState();

  if (!isEditorSessionActive()) {
    state = { ...state, active: false };
    saveCrawlerState(state);
    return state;
  }

  if (runningCycle) return state;
  runningCycle = true;

  try {
    const topic = CRAWL_TOPIC_ROTATION[state.topicIndex % CRAWL_TOPIC_ROTATION.length];
    const nextIndex = (state.topicIndex + 1) % CRAWL_TOPIC_ROTATION.length;

    state = pushLog(state, `Araştırma: "${topic.query}"…`);
    const found = await discoverFreeResources(topic.query, { category: topic.category, limit: 5 });

    let added = 0;
    for (const item of found) {
      const ok = importDiscoveredItem(item);
      if (ok) added += 1;
    }

    state = {
      ...state,
      active: true,
      lastRun: new Date().toISOString(),
      lastAdded: added,
      totalImported: state.totalImported + added,
      topicIndex: nextIndex,
      lastError: null,
    };
    state = pushLog(
      state,
      added > 0
        ? `✓ ${added} yeni kaynak kütüphaneye eklendi (${topic.category}).`
        : `— Yeni kaynak bulunamadı; sonraki turda devam.`,
    );

    logSiteEvent('library_crawl', { detail: `${added} eklendi · ${topic.query}` });
    saveCrawlerState(state);
    return state;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
    state = {
      ...pushLog(state, `Hata: ${msg}`),
      lastError: msg,
      lastRun: new Date().toISOString(),
    };
    saveCrawlerState(state);
    return state;
  } finally {
    runningCycle = false;
  }
}

/** Admin editör oturumu açıkken arka planda ücretsiz kaynak arar */
export function startLibraryCrawler(): void {
  stopLibraryCrawler();

  if (!isEditorSessionActive()) return;

  let state = loadCrawlerState();
  state = { ...state, active: true };
  saveCrawlerState(state);

  void runLibraryCrawlCycle();

  intervalId = setInterval(() => {
    if (!isEditorSessionActive()) {
      stopLibraryCrawler();
      return;
    }
    void runLibraryCrawlCycle();
  }, CRAWL_INTERVAL_MS);
}

export function stopLibraryCrawler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  const state = loadCrawlerState();
  if (state.active) {
    saveCrawlerState({ ...state, active: false });
  }
}

/** Editör girişinde çağrılır */
export function syncCrawlerWithEditorSession(): void {
  if (isEditorSessionActive()) {
    startLibraryCrawler();
  } else {
    stopLibraryCrawler();
  }
}
