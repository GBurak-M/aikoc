import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(lang = 'tr-TR') {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState({ stt: false, tts: false });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported({
      stt: Boolean(getRecognitionCtor()),
      tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported.tts || !text.trim()) return;
      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
      utterance.lang = lang;
      utterance.rate = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, supported.tts, stopSpeaking],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(
    (onResult: (transcript: string) => void, onError?: (msg: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) {
        onError?.('Tarayıcınız mikrofon dinlemeyi desteklemiyor.');
        return;
      }

      stopListening();
      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = () => {
        setListening(false);
        onError?.('Mikrofon hatası — izin verildiğinden emin olun.');
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) onResult(transcript);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [lang, stopListening],
  );

  useEffect(() => () => {
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking]);

  return {
    listening,
    speaking,
    supported,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
