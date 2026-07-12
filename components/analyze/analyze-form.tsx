"use client";

// Kayıtsız analiz formu: URL | metin toggle → POST /api/analyze → teaser
// (skor+verdict+ilk öneri). Kilitli bölüm JENERİK placeholder'dır — gerçek
// veri DOM'a HİÇ gelmez (sunucu full:null keser); blur CSS hilesi değildir.
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Link2, ClipboardPaste, Sparkles, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ANALYSIS_KEYS, ANALYSIS_WEIGHTS, type AnalysisDimensionKey, type AnalysisVerdict } from "@/lib/analyze/score";

interface AnalyzeResponse {
  score: number;
  verdict: AnalysisVerdict;
  firstSuggestion: string | null;
  // Kilitli madde ADEDİ (içerik değil) — kayıtsıza "N iyileştirme daha var" göstermek için.
  lockedSuggestions?: number;
  lockedNotes?: number;
  full: {
    dimensions: Record<AnalysisDimensionKey, { score: number; reason: string }>;
    suggestions: string[];
    upworkApprovalNotes: string[];
  } | null;
}

const VERDICT_CLASSES: Record<AnalysisVerdict, string> = {
  strong:  "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800",
  average: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  weak:    "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900",
};

function scoreBar(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function AnalyzeForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("publicAnalysis");
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Sonuç fold altında beliriyordu → geldiğinde otomatik kaydır (reduced-motion'a saygı).
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const canSubmit = mode === "url" ? url.trim().length > 8 : text.trim().length >= 40;

  async function analyze() {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "url" ? { url: url.trim() } : { text: text.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? t("genericError"));
        return;
      }
      setResult(data as AnalyzeResponse);
    } catch {
      setError(t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40";

  return (
    <div className="space-y-6">
      {/* ── Girdi kartı ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 space-y-4 shadow-sm">
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 p-0.5">
          {(["url", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                mode === m ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-[#94A3B8]"
              }`}
            >
              {m === "url" ? <Link2 className="h-3.5 w-3.5" /> : <ClipboardPaste className="h-3.5 w-3.5" />}
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <div className="space-y-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              aria-label={t("mode.url")}
              className={input}
            />
            <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/70">{t("urlHint")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              maxLength={15000}
              placeholder={t("textPlaceholder")}
              aria-label={t("mode.text")}
              className={`${input} resize-y leading-relaxed`}
            />
            <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]/70">{t("textHint")}</p>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

        <Button onClick={analyze} disabled={!canSubmit || loading} className="w-full gap-2 font-semibold bg-violet-600 hover:bg-violet-500 text-white">
          <Sparkles className="h-4 w-4" />
          {loading ? t("analyzing") : t("analyzeCta")}
        </Button>
        <p className="text-center text-[11px] text-slate-400 dark:text-[#94A3B8]/70">{t("freeNote")}</p>
      </div>

      {/* ── Sonuç ──────────────────────────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8]">{t("resultTitle")}</p>
              <p className="text-5xl font-extrabold tabular-nums mt-1">{result.score}<span className="text-xl text-slate-400">/100</span></p>
            </div>
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-bold ${VERDICT_CLASSES[result.verdict]}`}>
              {t(`verdict.${result.verdict}`)}
            </span>
          </div>

          {result.firstSuggestion && (
            <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-3.5">
              <p className="text-xs font-bold text-[#00F0FF] mb-1">{t("topSuggestion")}</p>
              <p className="text-sm leading-relaxed">{result.firstSuggestion}</p>
            </div>
          )}

          {result.full ? (
            <div className="space-y-5">
              {/* Boyut dökümü */}
              <div className="space-y-2.5">
                {ANALYSIS_KEYS.map((key) => {
                  const dim = result.full!.dimensions[key];
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-medium">
                          {t(`dimensions.${key}`)}{" "}
                          <span className="text-slate-400">{t("weight", { percent: Math.round(ANALYSIS_WEIGHTS[key] * 100) })}</span>
                        </span>
                        <span className="font-bold tabular-nums">{dim.score}</span>
                      </div>
                      <div className="h-1 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBar(dim.score)}`} style={{ width: `${dim.score}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-snug">{dim.reason}</p>
                    </div>
                  );
                })}
              </div>

              {/* Tüm öneriler */}
              {result.full.suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold">{t("allSuggestions")}</p>
                  <ul className="text-sm text-slate-600 dark:text-[#94A3B8] list-disc pl-5 space-y-1">
                    {result.full.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Upwork onay notları */}
              {result.full.upworkApprovalNotes.length > 0 && (
                <div className="space-y-1.5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />{t("upworkNotes")}
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-[#94A3B8] list-disc pl-5 space-y-1">
                    {result.full.upworkApprovalNotes.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Kilitli bölüm: jenerik placeholder — gerçek içerik sunucudan hiç gelmedi. */
            <div className="relative rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="p-4 space-y-3 select-none" aria-hidden>
                {[70, 55, 85].map((w, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 rounded bg-slate-200 dark:bg-white/10" style={{ width: `${w}%` }} />
                    <div className="h-2 rounded bg-slate-100 dark:bg-white/5" style={{ width: `${w - 15}%` }} />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 backdrop-blur-[3px] bg-white/60 dark:bg-[#090A0F]/60 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold">
                  <Lock className="h-4 w-4 text-[#00F0FF]" />{t("lockedTitle")}
                </p>
                {((result.lockedSuggestions ?? 0) + (result.lockedNotes ?? 0)) > 0 && (
                  <p className="text-xs font-semibold text-[#0891b2] dark:text-[#00F0FF]">
                    {t("lockedCount", { suggestions: result.lockedSuggestions ?? 0, notes: result.lockedNotes ?? 0 })}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-xs">{t("lockedBody")}</p>
                <Button asChild size="sm" className="gap-1.5 font-semibold bg-violet-600 hover:bg-violet-500 text-white">
                  <Link href="/signup">{t("lockedCta")}<ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </div>
          )}

          {!isLoggedIn && result.full === null && (
            <p className="text-center text-[11px] text-slate-400 dark:text-[#94A3B8]/70">{t("signupPerk")}</p>
          )}
        </div>
      )}
    </div>
  );
}
