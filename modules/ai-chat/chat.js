import { uuid } from '../../lib/storage.js';
import { loadChatSessions, saveChatSessions } from '../../lib/chat-storage.js';
import { renderChatStats } from '../../lib/page-stats.js';
import { getAIEngine } from '../../lib/ai-engine.js';
import { BRAND_LOGO, BRAND_ALT } from '../../lib/brand.js';
import { isGoogleSignedIn, getGoogleAuthHint, onGoogleAuthChange, renderGoogleSignInButton } from '../../lib/google-auth.js';
import { CHAT_SUBJECTS, subjectToMode, MODE_PROMPTS } from '../../lib/chat-subjects.js';

let sessionId = null;
let messages = [];
let mode = 'genel';

function getSessions() {
  return loadChatSessions();
}

function saveSessions(list) {
  saveChatSessions(list);
}

function reloadFromStorage() {
  const sessions = getSessions();
  if (sessions.length) loadSession(sessions[0].id);
  else newSession();
  renderHistory();
}

function newSession() {
  sessionId = uuid();
  messages = [];
  const sessions = getSessions();
  sessions.unshift({ id: sessionId, title: 'Yeni sohbet', updated: Date.now(), messages: [] });
  saveSessions(sessions.slice(0, 30));
  renderHistory();
  renderMessages();
}

function loadSession(id) {
  const s = getSessions().find((x) => x.id === id);
  if (!s) return;
  sessionId = id;
  messages = s.messages || [];
  renderMessages();
  renderHistory();
}

function persistSession() {
  const sessions = getSessions();
  const i = sessions.findIndex((x) => x.id === sessionId);
  const title = messages.find((m) => m.role === 'user')?.content?.slice(0, 40) || 'Sohbet';
  const entry = { id: sessionId, title, updated: Date.now(), messages };
  if (i >= 0) sessions[i] = entry;
  else sessions.unshift(entry);
  saveSessions(sessions.slice(0, 30));
  renderHistory();
  renderChatStats();
}

function renderHistory() {
  const ul = document.getElementById('chat-history');
  if (!ul) return;
  ul.innerHTML = getSessions().map((s) =>
    `<li class="${s.id === sessionId ? 'active' : ''}" data-id="${s.id}">${s.title}</li>`
  ).join('');
  ul.querySelectorAll('li').forEach((li) => {
    li.onclick = () => loadSession(li.dataset.id);
  });
}

function appendBubble(role, content) {
  const box = document.getElementById('chat-messages');
  if (!box) return;

  const row = document.createElement('div');
  row.className = `chat-row ${role === 'user' ? 'user' : 'assistant'}`;

  if (role === 'assistant') {
    const avatar = document.createElement('img');
    avatar.src = BRAND_LOGO;
    avatar.alt = BRAND_ALT;
    avatar.className = 'logo-robot ai-avatar-sm';
    row.appendChild(avatar);
  }

  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.textContent = content;
  if (role === 'assistant') {
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn btn-ghost btn-sm copy-btn';
    copy.textContent = 'Kopyala';
    copy.onclick = () => navigator.clipboard?.writeText(content);
    div.appendChild(copy);
  }
  row.appendChild(div);
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

function renderMessages() {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  box.innerHTML = '';
  messages.forEach((m) => appendBubble(m.role === 'user' ? 'user' : 'assistant', m.content));
}

function showTyping(show) {
  let el = document.getElementById('chat-typing');
  const box = document.getElementById('chat-messages');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'chat-typing';
      el.className = 'chat-row assistant';
      el.innerHTML = `<img src="${BRAND_LOGO}" alt="" class="logo-robot ai-avatar-sm" /><div class="chat-typing">Yazıyor…</div>`;
      box?.appendChild(el);
    }
  } else el?.remove();
}

function buildSubjectModes() {
  const container = document.getElementById('chat-modes');
  if (!container) return;

  const subjects = ['Genel', ...CHAT_SUBJECTS];
  container.innerHTML = subjects.map((name) => {
    const m = name === 'Genel' ? 'genel' : subjectToMode(name);
    return `<button type="button" class="btn btn-ghost btn-sm chat-mode-btn" data-mode="${m}" role="tab">${name}</button>`;
  }).join('');

  container.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      container.querySelectorAll('[data-mode]').forEach((b) => {
        b.classList.toggle('btn-primary', b.dataset.mode === mode);
        b.classList.toggle('btn-ghost', b.dataset.mode !== mode);
        b.setAttribute('aria-selected', b.dataset.mode === mode ? 'true' : 'false');
      });
    });
  });

  const first = container.querySelector('[data-mode="genel"]');
  if (first) {
    mode = 'genel';
    first.classList.add('btn-primary');
    first.classList.remove('btn-ghost');
    first.setAttribute('aria-selected', 'true');
  }
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (!sessionId) newSession();

  messages.push({ role: 'user', content: trimmed });
  appendBubble('user', trimmed);
  persistSession();

  const engine = getAIEngine();
  showTyping(true);
  document.getElementById('chat-send').disabled = true;

  try {
    const reply = await engine.generate(
      trimmed,
      MODE_PROMPTS[mode] || MODE_PROMPTS.genel,
      messages.slice(0, -1),
    );
    messages.push({ role: 'assistant', content: reply });
    appendBubble('assistant', reply);
    persistSession();
    window.__lastChatReply = reply;
  } finally {
    showTyping(false);
    document.getElementById('chat-send').disabled = false;
  }
}

async function updateGoogleBanner(engine) {
  const banner = document.getElementById('chat-google-banner');
  const text = document.getElementById('chat-google-banner-text');
  const signin = document.getElementById('chat-google-signin');
  if (!banner || !text) return;

  const hint = await getGoogleAuthHint();
  const show = !isGoogleSignedIn();
  banner.hidden = !show;
  if (!show) return;

  text.textContent = hint || 'Sol menüdeki sarı Google AI girişi panelinden veya buradan Google hesabınla giriş yap.';
  if (signin) await renderGoogleSignInButton(signin);
}

export async function init() {
  const engine = getAIEngine();
  const statusEl = document.getElementById('chat-ai-status');
  const progressWrap = document.getElementById('chat-progress');

  buildSubjectModes();

  const updateStatus = () => {
    if (statusEl) statusEl.textContent = `AI: ${engine.getStatusLabel()}`;
    const progressText = document.getElementById('chat-progress-text');
    if (progressWrap) progressWrap.hidden = !engine.progressText;
    if (progressText) progressText.textContent = engine.progressText || '';
    updateGoogleBanner(engine);
    renderChatStats();
  };
  engine.onProgress(updateStatus);
  if (!engine.ready) await engine.init();
  updateStatus();
  onGoogleAuthChange(async () => {
    const eng = getAIEngine();
    if (!eng.ready) await eng.init();
    if (statusEl) statusEl.textContent = `AI: ${eng.getStatusLabel()}`;
    updateGoogleBanner(eng);
    renderChatStats();
  });

  reloadFromStorage();
  renderChatStats();

  window.addEventListener('aikoc:session', reloadFromStorage);

  document.getElementById('chat-new')?.addEventListener('click', () => {
    newSession();
    renderChatStats();
  });

  document.getElementById('chat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const val = input?.value || '';
    if (input) input.value = '';
    sendMessage(val);
  });

  document.querySelectorAll('.chat-quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => sendMessage(btn.textContent));
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  document.getElementById('chat-voice')?.addEventListener('click', () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = 'tr-TR';
    rec.onresult = (ev) => {
      const input = document.getElementById('chat-input');
      if (input) input.value = ev.results[0][0].transcript;
    };
    rec.start();
  });

  document.getElementById('chat-speak')?.addEventListener('click', () => {
    const text = window.__lastChatReply;
    if (text && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR';
      speechSynthesis.speak(u);
    }
  });
}

export function destroy() {
  window.removeEventListener('aikoc:session', reloadFromStorage);
}
