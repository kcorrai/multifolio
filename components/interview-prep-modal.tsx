"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, Copy, Check, MessageSquare, Layers, ThumbsUp, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { useDashboard } from "./dashboard/dashboard-context";
import type { InterviewPrep, StarStory } from "@/lib/validation/schemas/interview";

interface Props {
  jobId: string;
  jobDescription: string;
  onClose: () => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
}

function CopyBtn({ text }: { text: string }) {
  const t = useTranslations("interview");
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? t("copied") : t("copy")}
    </button>
  );
}

function starText(s: StarStory, labels: { s: string; t: string; a: string; r: string }): string {
  return `${s.title}\n\n${labels.s}: ${s.situation}\n${labels.t}: ${s.task}\n${labels.a}: ${s.action}\n${labels.r}: ${s.result}`;
}

export function InterviewPrepModal({ jobId, jobDescription, onClose, onCreditsUpdate }: Props) {
  const t = useTranslations("interview");
  const { triggerComingSoon } = useDashboard();
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ranRef = useRef(false);

  // A11y: Escape kapatır + arka plan kaydırması kilitli.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function generate() {
    setBusy(true); setError("");
    const res = await fetch("/api/interview/prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, job_description: jobDescription }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? t("error"));
      if (res.status === 402) triggerComingSoon();
      setBusy(false); return;
    }
    setPrep(body.prep as InterviewPrep);
    if (body.credits) onCreditsUpdate?.(body.credits);
    setBusy(false);
  }

  // Açılışta bir kez otomatik üret (kullanıcı hazırlanmak için açtı). ranRef mükerrer
  // tetiklemeyi önler; jobId dep'te → prop değişse bile doğru iş bağlamı kullanılır.
  useEffect(() => {
    if (!ranRef.current && jobDescription) {
      ranRef.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDescription, jobId]);

  const starLabels = { s: t("star.situation"), t: t("star.task"), a: t("star.action"), r: t("star.result") };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{t("title")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {busy && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
              <p className="text-xs text-muted-foreground">{t("generating")}</p>
            </div>
          )}

          {error && !busy && (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={generate} size="sm" className="gap-2">
                <Sparkles className="h-3.5 w-3.5" />{t("retry")}<CreditCost kind="interview_prep" />
              </Button>
            </div>
          )}

          {prep && !busy && (
            <>
              {/* Tell me about yourself */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-amber-500" />{t("tellMe")}</h4>
                  <CopyBtn text={prep.tellMeAboutYourself} />
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/40 border border-border p-3">{prep.tellMeAboutYourself}</p>
              </section>

              {/* STAR stories */}
              {prep.starStories.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-amber-500" />{t("starTitle")}</h4>
                  <p className="text-[11px] text-muted-foreground">{t("starHint")}</p>
                  <div className="space-y-2.5">
                    {prep.starStories.map((s, i) => (
                      <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{s.title}</p>
                          <CopyBtn text={starText(s, starLabels)} />
                        </div>
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <p><span className="font-semibold text-muted-foreground">{starLabels.s}:</span> {s.situation}</p>
                          <p><span className="font-semibold text-muted-foreground">{starLabels.t}:</span> {s.task}</p>
                          <p className="rounded-md bg-amber-500/5 px-1.5 py-1"><span className="font-semibold text-amber-600 dark:text-amber-400">{starLabels.a}:</span> {s.action}</p>
                          <p><span className="font-semibold text-muted-foreground">{starLabels.r}:</span> {s.result}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Strengths */}
              {prep.strengths.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-green-500" />{t("strengths")}</h4>
                  <ul className="space-y-1">
                    {prep.strengths.map((s, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5"><span className="text-green-500">·</span><span>{s}</span></li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Weakness */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" />{t("weakness")}</h4>
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5 text-[11px] leading-relaxed">
                  <p>{prep.weakness.text}</p>
                  <p className="text-muted-foreground"><span className="font-semibold">{t("weaknessImprovement")}:</span> {prep.weakness.improvement}</p>
                </div>
              </section>

              {/* Questions to ask */}
              {prep.questionsToAsk.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5 text-[#00F0FF]" />{t("questions")}</h4>
                    <CopyBtn text={prep.questionsToAsk.map((q) => `• ${q}`).join("\n")} />
                  </div>
                  <ul className="space-y-1">
                    {prep.questionsToAsk.map((q, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5"><span className="text-[#00F0FF]">·</span><span>{q}</span></li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Teşekkür notu hatırlatması (CareerBuilder: göndermek fark yaratır) */}
              <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] p-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{t("thankYouTitle")}</span> {t("thankYouBody")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
