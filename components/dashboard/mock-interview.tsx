"use client";

// AI Sahte Mülakat (interaktif pratik): rol-özel sorular üretilir, kullanıcı cevaplar
// yazar, AI puan + geri bildirim + model cevap verir. Mülakat prep'ten FARKLI (senin
// hikâyelerin değil, SANA sorulacak sorular + cevap pratiği). Kullanıcı hangi cevabı
// değerlendireceğini seçer → kredi kontrolü (soru üretimi 3, cevap başına 1 kredi).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Sparkles, Loader2, ThumbsUp, AlertTriangle, Lightbulb, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { useDashboard } from "./dashboard-context";
import type { MockQuestion, MockFeedback } from "@/lib/validation/schemas/mock-interview";

interface JobOption { id: string; title: string }
interface QState { answer: string; feedback: MockFeedback | null; evaluating: boolean; error: string }

const CATEGORY_TINT: Record<MockQuestion["category"], string> = {
  behavioral: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  technical: "bg-[#00F0FF]/10 text-[#00F0FF]",
  role_fit: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  motivation: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function scoreColor(n: number) {
  if (n >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function MockInterview({ profileSaved, jobs }: { profileSaved: boolean; jobs: JobOption[] }) {
  const t = useTranslations("mockInterview");
  const { applyCredits, triggerComingSoon } = useDashboard();
  const [jobId, setJobId] = useState<string>("");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [qStates, setQStates] = useState<QState[]>([]);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  async function start() {
    setStarting(true); setStartError("");
    const res = await fetch("/api/interview/mock/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobId ? { job_id: jobId } : {}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setStartError(body?.error?.message ?? t("startError"));
      if (res.status === 402) triggerComingSoon();
      setStarting(false); return;
    }
    const qs = body.questions as MockQuestion[];
    setQuestions(qs);
    setQStates(qs.map(() => ({ answer: "", feedback: null, evaluating: false, error: "" })));
    if (body.credits) applyCredits(body.credits);
    setStarting(false);
  }

  function setState(i: number, patch: Partial<QState>) {
    setQStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function evaluate(i: number) {
    const st = qStates[i];
    if (!st || !st.answer.trim()) return;
    setState(i, { evaluating: true, error: "" });
    const res = await fetch("/api/interview/mock/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questions[i].question, answer: st.answer, ...(jobId ? { job_id: jobId } : {}) }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setState(i, { evaluating: false, error: body?.error?.message ?? t("feedbackError") });
      if (res.status === 402) triggerComingSoon();
      return;
    }
    setState(i, { evaluating: false, feedback: body.feedback as MockFeedback });
    if (body.credits) applyCredits(body.credits);
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00F0FF]/80">{t("eyebrow")}</p>
        <h2 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-amber-500" />{t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {!profileSaved && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />{t("needProfile")}
        </div>
      )}

      {/* Başlat: opsiyonel iş seçimi + soru üret */}
      {questions.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">{t("jobLabel")}</label>
            <div className="relative">
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-sm outline-none cursor-pointer"
              >
                <option value="">{t("jobGeneral")}</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 opacity-50 pointer-events-none" />
            </div>
            <p className="text-[11px] text-muted-foreground/70">{t("jobHint")}</p>
          </div>
          <Button onClick={start} disabled={!profileSaved || starting} className="gap-2">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {starting ? t("starting") : t("start")}
            <CreditCost kind="mock_questions" />
          </Button>
          {startError && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{startError}</p>}
        </div>
      )}

      {/* Sorular + cevap pratiği */}
      {questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("progress", { count: qStates.filter((s) => s.feedback).length, total: questions.length })}</p>
            <button onClick={() => { setQuestions([]); setQStates([]); }} className="text-xs text-muted-foreground hover:text-foreground underline">{t("restart")}</button>
          </div>

          {questions.map((q, i) => {
            const st = qStates[i];
            return (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${CATEGORY_TINT[q.category]}`}>{t(`category.${q.category}`)}</span>
                  <p className="text-sm font-semibold leading-snug">{q.question}</p>
                </div>
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-px text-amber-500" />{q.strongAnswerHint}
                </p>

                {!st.feedback ? (
                  <>
                    <Textarea
                      value={st.answer}
                      onChange={(e) => setState(i, { answer: e.target.value })}
                      placeholder={t("answerPlaceholder")}
                      rows={4}
                      className="resize-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => evaluate(i)} disabled={st.evaluating || !st.answer.trim()} className="gap-2">
                        {st.evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {st.evaluating ? t("evaluating") : t("getFeedback")}
                        <CreditCost kind="mock_answer" />
                      </Button>
                      {st.error && <span className="text-[11px] text-destructive">{st.error}</span>}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 pt-1">
                    {/* Kullanıcının cevabı + puan */}
                    <div className="rounded-xl bg-muted/40 border border-border p-3">
                      <p className="text-[11px] text-muted-foreground mb-1">{t("yourAnswer")}</p>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{st.answer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{t("score")}</span>
                      <span className={`text-lg font-extrabold tabular-nums ${scoreColor(st.feedback.score)}`}>{st.feedback.score}/100</span>
                    </div>
                    {st.feedback.strengths.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{t("strengths")}</p>
                        {st.feedback.strengths.map((s, k) => <p key={k} className="text-[11px] text-muted-foreground">· {s}</p>)}
                      </div>
                    )}
                    {st.feedback.improvements.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{t("improvements")}</p>
                        {st.feedback.improvements.map((s, k) => <p key={k} className="text-[11px] text-muted-foreground">· {s}</p>)}
                      </div>
                    )}
                    <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] p-3 space-y-1">
                      <p className="text-[11px] font-semibold text-[#00F0FF]">{t("modelAnswer")}</p>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{st.feedback.modelAnswer}</p>
                    </div>
                    <button onClick={() => setState(i, { feedback: null })} className="text-[11px] text-muted-foreground hover:text-foreground underline">{t("tryAgain")}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
