"use client";

// AI Sahte Mülakat (interaktif oturum): kullanıcı kapsam seçer (zorluk/sayı/kategori), rol-özel
// sorular üretilir, soruları TEK TEK yanıtlar, AI puan + geri bildirim + model cevap + gerekirse
// derinleştirici TAKİP sorusu verir; oturum bitince deterministik RAPOR (genel skor + temalar)
// gösterilir ve GEÇMİŞe düşer. Oturum DB'de (interview_sessions) → yenilemeye dayanıklı.
// Kredi: soru üretimi 3, cevap başına 1 (takip cevabı da 1). Sesli dikte + kronometre ücretsiz.
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare, Sparkles, Loader2, ThumbsUp, AlertTriangle, Lightbulb, ChevronRight, ChevronLeft,
  AlertCircle, Clock, CornerDownRight, FileCheck2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreditCost } from "@/components/credit-cost";
import { VoiceInputButton } from "./voice-input-button";
import { InterviewReport } from "./interview-report";
import { InterviewHistory } from "./interview-history";
import { useDashboard } from "./dashboard-context";
import type {
  MockQuestion, MockFeedback, MockDifficulty, MockCategory,
  InterviewQuestionRecord, InterviewSession,
} from "@/lib/validation/schemas/mock-interview";

interface JobOption { id: string; title: string }

// Bir sorunun istemci durumu: birincil cevap/feedback + opsiyonel takip sorusu cevabı.
interface QState {
  answer: string;
  feedback: MockFeedback | null;
  evaluating: boolean;
  error: string;
  followAnswer: string;
  followFeedback: MockFeedback | null;
  followEvaluating: boolean;
  followError: string;
}

const CATEGORIES: MockCategory[] = ["behavioral", "technical", "role_fit", "motivation"];
const DIFFICULTIES: MockDifficulty[] = ["junior", "mid", "senior"];
const COUNT_OPTIONS = [4, 6, 8];

const CATEGORY_TINT: Record<MockCategory, string> = {
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

function emptyState(): QState {
  return { answer: "", feedback: null, evaluating: false, error: "", followAnswer: "", followFeedback: null, followEvaluating: false, followError: "" };
}

// Soru + istemci durumundan DB kayıt biçimini (rapor için) kur.
function recordsFromState(questions: MockQuestion[], states: QState[]): InterviewQuestionRecord[] {
  return questions.map((q, i) => {
    const st = states[i];
    const fb = st?.feedback;
    return {
      category: q.category,
      question: q.question,
      strongAnswerHint: q.strongAnswerHint,
      answer: fb ? st.answer : null,
      score: fb ? fb.score : null,
      strengths: fb ? fb.strengths : [],
      improvements: fb ? fb.improvements : [],
      modelAnswer: fb ? fb.modelAnswer : null,
    };
  });
}

// mm:ss biçimi.
function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Soru başına sıfırlanan kronometre (key={index} ile remount). Yalnız cevaplanmamışken sayar.
function Stopwatch({ running }: { running: boolean }) {
  const t = useTranslations("mockInterview");
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
      <Clock className="h-3 w-3" />{t("elapsed", { time: fmt(sec) })}
    </span>
  );
}

export function MockInterview({ profileSaved, jobs }: { profileSaved: boolean; jobs: JobOption[] }) {
  const t = useTranslations("mockInterview");
  const { applyCredits, triggerComingSoon } = useDashboard();

  // ── Kurulum ayarları ────────────────────────────────────────────────
  const [jobId, setJobId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<MockDifficulty>("mid");
  const [count, setCount] = useState<number>(6);
  const [categories, setCategories] = useState<Set<MockCategory>>(new Set());
  const [timerEnabled, setTimerEnabled] = useState(false);

  // ── Oturum durumu ───────────────────────────────────────────────────
  const [phase, setPhase] = useState<"setup" | "active" | "report">("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [qStates, setQStates] = useState<QState[]>([]);
  const [current, setCurrent] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [finishing, setFinishing] = useState(false);
  // Rapor gösterilen soru kayıtları (oturum sonu VEYA geçmişten açılan tamamlanmış oturum).
  const [reportQuestions, setReportQuestions] = useState<InterviewQuestionRecord[]>([]);

  // ── Geçmiş oturumlar ────────────────────────────────────────────────
  const [history, setHistory] = useState<InterviewSession[]>([]);
  // Event handler'lardan (finish sonrası) yenileme — async/await serbest.
  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/interview/sessions");
    const body = await res.json().catch(() => null);
    if (res.ok && body?.sessions) setHistory(body.sessions as InterviewSession[]);
  }, []);
  // İlk yükleme: setState .then callback'inde (effect gövdesinde senkron DEĞİL →
  // react-hooks/set-state-in-effect tetiklenmez). Hata/migration yoksa geçmiş boş kalır.
  useEffect(() => {
    let active = true;
    fetch("/api/interview/sessions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.sessions) setHistory(d.sessions as InterviewSession[]); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  function toggleCategory(c: MockCategory) {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }

  function setState(i: number, patch: Partial<QState>) {
    setQStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  const jobContext = jobId ? { job_id: jobId } : {};

  // ── Oturum başlat ───────────────────────────────────────────────────
  async function start() {
    setStarting(true); setStartError("");
    const res = await fetch("/api/interview/mock/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...jobContext,
        difficulty,
        count,
        categories: categories.size > 0 ? [...categories] : undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setStartError(body?.error?.message ?? t("startError"));
      if (res.status === 402) triggerComingSoon();
      setStarting(false); return;
    }
    const qs = body.questions as MockQuestion[];
    setSessionId(body.sessionId as string);
    setQuestions(qs);
    setQStates(qs.map(() => emptyState()));
    setCurrent(0);
    setPhase("active");
    if (body.credits) applyCredits(body.credits);
    setStarting(false);
  }

  // ── Birincil cevabı değerlendir (oturuma kalıcı yazılır) ────────────
  async function evaluate(i: number) {
    const st = qStates[i];
    if (!st || !st.answer.trim()) return;
    setState(i, { evaluating: true, error: "" });
    const res = await fetch("/api/interview/mock/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questions[i].question, answer: st.answer, ...jobContext, session_id: sessionId, question_index: i }),
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

  // ── Takip sorusu cevabını değerlendir (kalıcı DEĞİL — session_id gönderilmez) ──
  async function evaluateFollowUp(i: number) {
    const st = qStates[i];
    if (!st || !st.feedback?.followUp || !st.followAnswer.trim()) return;
    setState(i, { followEvaluating: true, followError: "" });
    const res = await fetch("/api/interview/mock/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: st.feedback.followUp, answer: st.followAnswer, ...jobContext }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setState(i, { followEvaluating: false, followError: body?.error?.message ?? t("feedbackError") });
      if (res.status === 402) triggerComingSoon();
      return;
    }
    setState(i, { followEvaluating: false, followFeedback: body.feedback as MockFeedback });
    if (body.credits) applyCredits(body.credits);
  }

  // ── Oturumu bitir → rapor ───────────────────────────────────────────
  async function finish() {
    if (!sessionId) return;
    setFinishing(true);
    // Rapor deterministik (istemcide de hesaplanır); complete oturumu 'completed' damgalar.
    await fetch("/api/interview/mock/complete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => null);
    setReportQuestions(recordsFromState(questions, qStates));
    setPhase("report");
    setFinishing(false);
    void loadHistory();
  }

  // ── Baştan başla ────────────────────────────────────────────────────
  function reset() {
    setPhase("setup");
    setSessionId(null);
    setQuestions([]);
    setQStates([]);
    setCurrent(0);
    setReportQuestions([]);
    setStartError("");
  }

  // ── Geçmişten oturum aç ─────────────────────────────────────────────
  function openHistory(s: InterviewSession) {
    if (s.status === "completed") {
      setReportQuestions(s.questions);
      setPhase("report");
      return;
    }
    // Devam eden oturum → durumu rehydrate et.
    setSessionId(s.id);
    setJobId(s.job_id ?? "");
    setDifficulty(s.difficulty);
    const qs: MockQuestion[] = s.questions.map((q) => ({ category: q.category, question: q.question, strongAnswerHint: q.strongAnswerHint }));
    setQuestions(qs);
    setQStates(s.questions.map((q) => {
      const st = emptyState();
      if (q.answer !== null && q.score !== null) {
        st.answer = q.answer;
        st.feedback = { score: q.score, strengths: q.strengths, improvements: q.improvements, modelAnswer: q.modelAnswer ?? "", followUp: "" };
      }
      return st;
    }));
    setCurrent(0);
    setPhase("active");
  }

  const answeredCount = qStates.filter((s) => s.feedback).length;

  // ══════════════════════════════════════════════════════════════════════
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

      {/* ═══ KURULUM ═══ */}
      {phase === "setup" && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
            {/* İş seçimi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("jobLabel")}</label>
              <div className="relative">
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2 pr-8 text-sm outline-none cursor-pointer"
                >
                  <option value="">{t("jobGeneral")}</option>
                  {jobs.map((j) => (<option key={j.id} value={j.id}>{j.title}</option>))}
                </select>
                <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 opacity-50 pointer-events-none" />
              </div>
              <p className="text-[11px] text-muted-foreground/70">{t("jobHint")}</p>
            </div>

            {/* Zorluk */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("difficultyLabel")}</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => {
                  const on = difficulty === d;
                  return (
                    <button
                      key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={on}
                      className={`rounded-xl border px-3 py-2 text-left transition-colors ${on ? "border-[#00F0FF]/40 bg-[#00F0FF]/10" : "border-border hover:border-foreground/20"}`}
                    >
                      <p className="text-xs font-bold">{t(`difficulty.${d}`)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t(`difficulty.${d}Desc`)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Soru sayısı */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("countLabel")}</label>
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                {COUNT_OPTIONS.map((n) => (
                  <button
                    key={n} type="button" onClick={() => setCount(n)}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${count === n ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori odak */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">{t("categoryLabel")}</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const on = categories.has(c);
                  return (
                    <button
                      key={c} type="button" onClick={() => toggleCategory(c)} aria-pressed={on}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-[#00F0FF]/40 bg-[#00F0FF]/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/20"}`}
                    >
                      {t(`category.${c}`)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground/70">{t("categoryHint")}</p>
            </div>

            {/* Kronometre */}
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input type="checkbox" checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} className="h-4 w-4 rounded border-border accent-[#00F0FF]" />
              {t("timerLabel")}
            </label>

            <Button onClick={start} disabled={!profileSaved || starting} className="gap-2 w-full sm:w-auto">
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {starting ? t("starting") : t("start")}
              <CreditCost kind="mock_questions" />
            </Button>
            {startError && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{startError}</p>}
          </div>

          <InterviewHistory sessions={history} onOpen={openHistory} />
        </>
      )}

      {/* ═══ AKTİF OTURUM (tek soru) ═══ */}
      {phase === "active" && questions.length > 0 && (() => {
        const i = current;
        const q = questions[i];
        const st = qStates[i] ?? emptyState();
        const answered = !!st.feedback;
        return (
          <div className="space-y-4">
            {/* İlerleme + bitir */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t("questionOf", { current: i + 1, total: questions.length })}</p>
                <div className="flex items-center gap-2">
                  {timerEnabled && !answered && <Stopwatch key={i} running />}
                  <Button size="sm" variant="outline" onClick={finish} disabled={finishing} className="gap-1.5 h-7 text-xs">
                    {finishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                    {finishing ? t("finishing") : t("finish")}
                  </Button>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-[#00F0FF] transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start gap-2">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${CATEGORY_TINT[q.category]}`}>{t(`category.${q.category}`)}</span>
                <p className="text-sm font-semibold leading-snug">{q.question}</p>
              </div>
              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-px text-amber-500" />{q.strongAnswerHint}
              </p>

              {!answered ? (
                <>
                  <Textarea
                    value={st.answer}
                    onChange={(e) => setState(i, { answer: e.target.value })}
                    placeholder={t("answerPlaceholder")}
                    rows={5}
                    className="resize-none text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => evaluate(i)} disabled={st.evaluating || !st.answer.trim()} className="gap-2">
                      {st.evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {st.evaluating ? t("evaluating") : t("getFeedback")}
                      <CreditCost kind="mock_answer" />
                    </Button>
                    <VoiceInputButton onTranscript={(txt) => setState(i, { answer: (st.answer ? st.answer + " " : "") + txt })} />
                    {st.error && <span className="text-[11px] text-destructive">{st.error}</span>}
                  </div>
                </>
              ) : (
                <FeedbackView
                  answer={st.answer}
                  feedback={st.feedback!}
                  onRetry={() => setState(i, emptyState())}
                  followAnswer={st.followAnswer}
                  followFeedback={st.followFeedback}
                  followEvaluating={st.followEvaluating}
                  followError={st.followError}
                  onFollowChange={(v) => setState(i, { followAnswer: v })}
                  onFollowSubmit={() => evaluateFollowUp(i)}
                />
              )}
            </div>

            {/* Gezinme */}
            <div className="flex items-center justify-between">
              <Button size="sm" variant="ghost" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={i === 0} className="gap-1.5 h-8 text-xs">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {i < questions.length - 1 ? (
                <Button size="sm" variant="outline" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="gap-1.5 h-8 text-xs">
                  {t("next")}<ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button size="sm" onClick={finish} disabled={finishing} className="gap-1.5 h-8 text-xs">
                  {finishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="h-3.5 w-3.5" />}
                  {t("finish")}
                </Button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══ RAPOR ═══ */}
      {phase === "report" && (
        <div className="space-y-4">
          <InterviewReport questions={reportQuestions} />
          <Button onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />{t("report.newSession")}
          </Button>
        </div>
      )}
    </div>
  );
}

// Birincil cevabın feedback görünümü + opsiyonel takip sorusu bloğu.
function FeedbackView({
  answer, feedback, onRetry, followAnswer, followFeedback, followEvaluating, followError, onFollowChange, onFollowSubmit,
}: {
  answer: string;
  feedback: MockFeedback;
  onRetry: () => void;
  followAnswer: string;
  followFeedback: MockFeedback | null;
  followEvaluating: boolean;
  followError: string;
  onFollowChange: (v: string) => void;
  onFollowSubmit: () => void;
}) {
  const t = useTranslations("mockInterview");
  return (
    <div className="space-y-3 pt-1">
      <div className="rounded-xl bg-muted/40 border border-border p-3">
        <p className="text-[11px] text-muted-foreground mb-1">{t("yourAnswer")}</p>
        <p className="text-xs leading-relaxed whitespace-pre-wrap">{answer}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t("score")}</span>
        <span className={`text-lg font-extrabold tabular-nums ${scoreColor(feedback.score)}`}>{feedback.score}/100</span>
      </div>
      {feedback.strengths.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{t("strengths")}</p>
          {feedback.strengths.map((s, k) => <p key={k} className="text-[11px] text-muted-foreground">· {s}</p>)}
        </div>
      )}
      {feedback.improvements.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{t("improvements")}</p>
          {feedback.improvements.map((s, k) => <p key={k} className="text-[11px] text-muted-foreground">· {s}</p>)}
        </div>
      )}
      <div className="rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/[0.04] p-3 space-y-1">
        <p className="text-[11px] font-semibold text-[#00F0FF]">{t("modelAnswer")}</p>
        <p className="text-xs leading-relaxed whitespace-pre-wrap">{feedback.modelAnswer}</p>
      </div>

      {/* Derinleştirici takip sorusu (varsa) */}
      {feedback.followUp && !followFeedback && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-3 space-y-2">
          <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1"><CornerDownRight className="h-3 w-3" />{t("followUpTitle")}</p>
          <p className="text-xs">{feedback.followUp}</p>
          <p className="text-[11px] text-muted-foreground">{t("followUpHint")}</p>
          <Textarea value={followAnswer} onChange={(e) => onFollowChange(e.target.value)} placeholder={t("answerPlaceholder")} rows={3} className="resize-none text-sm" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onFollowSubmit} disabled={followEvaluating || !followAnswer.trim()} className="gap-2">
              {followEvaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {followEvaluating ? t("evaluating") : t("answerFollowUp")}
              <CreditCost kind="mock_answer" />
            </Button>
            <VoiceInputButton onTranscript={(txt) => onFollowChange((followAnswer ? followAnswer + " " : "") + txt)} />
            {followError && <span className="text-[11px] text-destructive">{followError}</span>}
          </div>
        </div>
      )}
      {followFeedback && (
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-3 space-y-1">
          <p className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1"><CornerDownRight className="h-3 w-3" />{t("followUpTitle")}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("score")}</span>
            <span className={`text-sm font-extrabold tabular-nums ${scoreColor(followFeedback.score)}`}>{followFeedback.score}/100</span>
          </div>
          {followFeedback.improvements.length > 0 && followFeedback.improvements.map((s, k) => <p key={k} className="text-[11px] text-muted-foreground">· {s}</p>)}
        </div>
      )}

      <button onClick={onRetry} className="text-[11px] text-muted-foreground hover:text-foreground underline">{t("tryAgain")}</button>
    </div>
  );
}
