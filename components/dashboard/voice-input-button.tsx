"use client";

// Sesli cevap dikte butonu: tarayıcının Web Speech API'siyle konuşmayı metne çevirir ve
// mevcut cevaba EKLER. Sunucu/kredi YOK — tamamen istemcide. Desteklenmeyen tarayıcıda
// (SpeechRecognition yok) buton hiç render edilmez (graceful). Mülakat pratiğini gerçek
// konuşmaya yaklaştırır.
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Mic, Square } from "lucide-react";

// Web Speech API tipleri standart lib'de yok — minimum tanım.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// Locale → BCP-47 konuşma dili (katalog İngilizce; TR bölge desteği için map).
const SPEECH_LANG: Record<string, string> = { en: "en-US", tr: "tr-TR" };

export function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }) {
  const t = useTranslations("mockInterview.voice");
  const locale = useLocale();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // Yetenek tespiti (yalnız istemci). setState .then microtask'ında → effect gövdesinde
    // senkron DEĞİL (react-hooks/set-state-in-effect tetiklenmez). SSR'da false → hydration uyumlu.
    Promise.resolve().then(() => setSupported(getRecognitionCtor() !== null));
    return () => { recognitionRef.current?.stop(); };
  }, []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = SPEECH_LANG[locale] ?? "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      // Yalnız kesinleşen (isFinal) parçaları ekle — geçici tahminleri değil.
      // onTranscript event-handler scope'undan taze yakalanır (dinleme kısa ömürlü).
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onTranscript(r[0].transcript.trim());
      }
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
        listening
          ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
      aria-pressed={listening}
    >
      {listening ? <Square className="h-3 w-3 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
      {listening ? t("listening") : t("start")}
    </button>
  );
}
