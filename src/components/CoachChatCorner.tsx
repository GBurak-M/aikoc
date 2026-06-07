import React, { useEffect, useRef } from 'react';
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import { useSpeech } from '../hooks/useSpeech';
import { SITE_NAME } from '../config/site';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  hover: string;
  gradient: string;
  intelBorder?: string;
  surfaceBorder?: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatHistory: ChatMessage[];
  aiChatQuery: string;
  setAiChatQuery: React.Dispatch<React.SetStateAction<string>>;
  onSend: (e: React.FormEvent) => void;
  onSuggested: (question: string) => void;
  loading: boolean;
  autoSpeak: boolean;
  onAutoSpeakChange: (v: boolean) => void;
  member: boolean;
  profileName: string;
};

const GUEST_SUGGESTIONS = [
  'Ücretsiz kitap ve makale nerede?',
  'YKS için nasıl çalışmalıyım?',
  'Motivasyonum düştü, ne yapmalıyım?',
  'Kütüphanede hangi kaynaklar var?',
];

const MEMBER_SUGGESTIONS = [
  'Bana özel çalışma planı öner',
  'Hangi alanlara odaklanmalıyım?',
  'Site trafiğime göre koçluk ver',
  'Matematik netlerimi nasıl artırırım?',
];

export default function CoachChatCorner({
  darkMode,
  activeTheme,
  open,
  onOpenChange,
  chatHistory,
  aiChatQuery,
  setAiChatQuery,
  onSend,
  onSuggested,
  loading,
  autoSpeak,
  onAutoSpeakChange,
  member,
  profileName,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string | null>(null);
  const { listening, speaking, supported, speak, stopSpeaking, startListening, stopListening } =
    useSpeech('tr-TR');

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, loading, open]);

  useEffect(() => {
    if (!autoSpeak || !supported.tts) return;
    const last = chatHistory[chatHistory.length - 1];
    if (!last || last.role !== 'assistant' || last.id === lastSpokenRef.current) return;
    lastSpokenRef.current = last.id;
    speak(last.text);
  }, [chatHistory, autoSpeak, speak, supported.tts]);

  const suggestions = member ? MEMBER_SUGGESTIONS : GUEST_SUGGESTIONS;

  const handleMic = () => {
    if (listening) {
      stopListening();
      return;
    }
    startListening(
      (text) => setAiChatQuery((prev) => (prev ? `${prev} ${text}` : text)),
      () => setAiChatQuery((prev) => prev),
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={`fixed-coach-fab fixed z-[60] flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-2xl shadow-xl text-white font-bold text-sm bg-gradient-to-tr ${activeTheme.gradient} active:scale-95 transition-transform`}
        aria-label="AI koç sohbetini aç"
      >
        <MessageCircle className="h-5 w-5" />
        <span>AI Koç</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed-coach-panel fixed z-[60] w-[min(100vw-2rem,380px)] rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50'}`}>
        <div>
          <BrandWordmark size="sm" gradientClass={activeTheme.gradient} frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`} />
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
            {member ? `${profileName} · Kişisel koç` : 'Misafir · Gelişim portalı'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {supported.tts && (
            <button
              type="button"
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                onAutoSpeakChange(!autoSpeak);
              }}
              className={`p-2 rounded-lg ${autoSpeak ? activeTheme.bg + ' text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title={autoSpeak ? 'Sesli okuma açık' : 'Sesli okuma kapalı'}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className={`text-[10px] px-4 py-2 ${darkMode ? 'text-slate-400 bg-slate-800/40' : 'text-slate-500 bg-emerald-50'}`}>
        Saygılı sohbet · Küfür, nefret ve müstehcen içerik yok · Zaman zaman espirili mizah
        {speaking && <span className="block mt-1 text-sky-500">🔊 Konuşuyor…</span>}
      </p>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-2 min-h-[160px] sm:min-h-[200px] max-h-[min(42dvh,280px)] sm:max-h-[280px]">
        {chatHistory.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">
            Merhaba! Ben {SITE_NAME}. Sorunu yaz veya mikrofonla söyle.
          </p>
        )}
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? `${activeTheme.bg} text-white`
                  : darkMode
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-400 animate-pulse">Yanıt hazırlanıyor…</p>
        )}
      </div>

      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {suggestions.slice(0, 2).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSuggested(q)}
            className={`text-[9px] font-semibold px-2 py-1 rounded-lg border ${
              darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      <form onSubmit={onSend} className={`flex gap-2 p-3 border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
        {supported.stt && (
          <button
            type="button"
            onClick={handleMic}
            className={`p-2.5 rounded-xl border ${
              listening
                ? 'bg-rose-500 text-white border-rose-500'
                : darkMode
                  ? 'border-slate-700 text-slate-300'
                  : 'border-slate-200 text-slate-600'
            }`}
            title={listening ? 'Dinlemeyi durdur' : 'Mikrofonla konuş'}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <input
          type="text"
          value={aiChatQuery}
          onChange={(e) => setAiChatQuery(e.target.value)}
          placeholder="Koça sor…"
          enterKeyHint="send"
          autoComplete="off"
          className={`flex-1 text-base sm:text-xs px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`p-2.5 rounded-xl text-white ${activeTheme.bg} disabled:opacity-50`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
