"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  X, ExternalLink, Target, CheckCircle2, AlertCircle,
  Sparkles, FileText, ChevronDown, RefreshCw, BellRing, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProposalModal } from "@/components/proposal-modal";
import { CreditCost } from "@/components/credit-cost";
import { CopyButton } from "@/components/dashboard/copy-button";
import { ChipsInput } from "@/components/dashboard/chips-input";
import { MatchRubric, VerdictBadge, RiskBadges, MatchImprovements } from "@/components/dashboard/match-rubric";
import { followUpDays } from "@/lib/followup";
import { reminderUrgency, type ReminderUrgency } from "@/lib/jobs/reminder";
import type { JobStatus, JobMatchResult } from "@/lib/validation/schemas/job";

interface JobRow {
  id: string; title: string; company: string | null; platform: string | null;
  status: JobStatus; match_score: number | null; match_result: JobMatchResult | null; created_at: string;
  reminder_date?: string | null; deadline_date?: string | null; tags?: string[] | null;
}

interface JobDetail extends JobRow {
  description: string | null;
  url: string | null;
  notes: string | null;
  budget: string | null;
  updated_at: string | null;
  status_changed_at: string | null;
}

// Aciliyet → rozet/metin rengi. overdue=kırmızı, today=amber, soon=amber-soft, upcoming=nötr.
const URGENCY_CLASS: Record<ReminderUrgency, string> = {
  overdue:  "text-red-600 dark:text-red-400",
  today:    "text-amber-700 dark:text-amber-300",
  soon:     "text-amber-600 dark:text-amber-400",
  upcoming: "text-muted-foreground",
};

const JOB_STATUSES = ["saved", "applied", "awaiting_reply", "interview", "offer", "rejected"] as const;

const STATUS_CLASSES: Record<JobStatus, string> = {
  saved:          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  applied:        "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  awaiting_reply: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  interview:      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  offer:          "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  rejected:       "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

function scoreColor(n: number) {
  if (n >= 70) return "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-800";
  if (n >= 40) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800";
  return "bg-red-50 text-red-600 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900";
}

function scoreBarColor(n: number) {
  if (n >= 70) return "bg-green-500";
  if (n >= 40) return "bg-amber-500";
  return "bg-red-500";
}

interface Props {
  job: JobRow;
  onClose: () => void;
  onJobUpdated: (job: JobRow) => void;
  onCreditsUpdate?: (c: { balance: number; spent: number }) => void;
}

export function JobDetailPanel({ job, onClose, onJobUpdated, onCreditsUpdate }: Props) {
  const t = useTranslations("jobs");
  const tRubric = useTranslations("rubric");
  const locale = useLocale();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loadedJobId, setLoadedJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showProposal, setShowProposal] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState("");
  const [followUpBusy, setFollowUpBusy] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loading = loadedJobId !== job.id;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs/${job.id}`)
      .then((r) => r.json())
      .then((b) => {
        if (!cancelled && b.job) {
          setDetail(b.job as JobDetail);
          setNotes(b.job.notes ?? "");
          setStatus((b.job.status as JobStatus) ?? job.status);
          setReminderDate(b.job.reminder_date ?? "");
          setDeadlineDate(b.job.deadline_date ?? "");
          setTags(Array.isArray(b.job.tags) ? b.job.tags : []);
          setLoadedJobId(job.id);
        }
      })
      .catch(() => { if (!cancelled) setLoadedJobId(job.id); });
    return () => { cancelled = true; };
  }, [job.id, job.status]);

  async function updateStatus(newStatus: JobStatus) {
    setStatus(newStatus);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.job) onJobUpdated(body.job as JobRow);
  }

  // Hatırlatıcı/teslim tarihini kaydeder ("" = temizle). Kart rozetleri güncellensin
  // diye dönen job onJobUpdated ile listeye yansıtılır.
  async function saveDate(field: "reminder_date" | "deadline_date", value: string) {
    if (field === "reminder_date") setReminderDate(value);
    else setDeadlineDate(value);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.job) {
      onJobUpdated(body.job as JobRow);
      setDetail((prev) => (prev ? { ...prev, [field]: value || null } : prev));
    }
  }

  // Etiketleri kaydeder (kart rozetleri + filtre güncellensin diye listeye yansır).
  async function saveTags(next: string[]) {
    setTags(next);
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.job) {
      onJobUpdated(body.job as JobRow);
      setDetail((prev) => (prev ? { ...prev, tags: next } : prev));
    }
  }

  // Rubrik öncesi eşleştirmeyi rubrikli analizle yeniler (match route her çağrıda yeniden üretir; 1 kredi).
  async function rematch() {
    setRematching(true);
    const res = await fetch(`/api/jobs/${job.id}/match`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.job) {
      const updated = body.job as JobRow;
      onJobUpdated(updated);
      setDetail((prev) => (prev ? { ...prev, match_score: updated.match_score, match_result: updated.match_result } : prev));
      if (body.credits) onCreditsUpdate?.(body.credits);
    }
    setRematching(false);
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true);
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      setSavingNotes(false);
    }, 900);
  }

  // AI takip mesajı üretimi (1 kredi; kalıcı değil — kullanıcı kopyalar).
  async function generateFollowUpMsg() {
    setFollowUpBusy(true);
    setFollowUpError("");
    const res = await fetch(`/api/jobs/${job.id}/followup`, { method: "POST" });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.message) {
      setFollowUpMsg(body.message as string);
      if (body.credits) onCreditsUpdate?.(body.credits);
    } else {
      setFollowUpError((body?.error as string | undefined) ?? t("followup.error"));
    }
    setFollowUpBusy(false);
  }

  const matchResult = detail?.match_result ?? job.match_result;
  const matchScore = detail?.match_score ?? job.match_score;
  const staleDays = detail
    ? followUpDays(status, detail.status_changed_at, detail.updated_at ?? detail.created_at, new Date())
    : null;

  return (
    <>
      <div className="flex flex-col h-full border-l border-border bg-background overflow-hidden">

        {/* Panel header */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-snug">{job.title}</h3>
            {(detail?.company || job.platform) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[detail?.company, job.platform].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="h-5 w-5 rounded-full border-2 border-[#00F0FF]/30 border-t-[#00F0FF] animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Durum selector */}
            <div className="relative">
              <select
                value={status}
                onChange={(e) => updateStatus(e.target.value as JobStatus)}
                className={`w-full appearance-none rounded-xl px-3 py-2 pr-8 text-xs font-semibold border-0 outline-none cursor-pointer ${STATUS_CLASSES[status]}`}
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-60 pointer-events-none" />
            </div>

            {/* Hatırlatıcı + teslim tarihi (kart bazlı; elle set) */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { field: "reminder_date" as const, value: reminderDate, label: t("detail.reminder") },
                { field: "deadline_date" as const, value: deadlineDate, label: t("detail.deadline") },
              ]).map(({ field, value, label }) => {
                const urgency = reminderUrgency(value, new Date());
                return (
                  <div key={field} className="rounded-lg border border-border bg-muted/30 px-2.5 py-2 space-y-1">
                    <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <CalendarClock className={`h-3 w-3 ${urgency ? URGENCY_CLASS[urgency] : ""}`} />
                      {label}
                    </label>
                    <input
                      type="date"
                      value={value}
                      onChange={(e) => saveDate(field, e.target.value)}
                      className={`w-full bg-transparent text-xs outline-none tabular-nums cursor-pointer ${urgency ? URGENCY_CLASS[urgency] : "text-foreground"}`}
                    />
                    {urgency && urgency !== "upcoming" && (
                      <p className={`text-[10px] font-semibold ${URGENCY_CLASS[urgency]}`}>{t(`detail.due_${urgency}`)}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Follow-up hatırlatıcı: X gündür durum değişmedi → AI takip mesajı */}
            {staleDays !== null && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 shrink-0" />
                  {t("followup.waiting", { days: staleDays })}
                </p>
                {followUpMsg ? (
                  <div className="rounded-lg bg-background border border-border p-2.5 space-y-1.5">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{followUpMsg}</p>
                    <div className="flex justify-end">
                      <CopyButton text={followUpMsg} />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60">{t("followup.hint")}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateFollowUpMsg}
                      disabled={followUpBusy}
                      className="gap-2 w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {followUpBusy ? t("followup.generating") : t("followup.generate")}
                      <CreditCost kind="followup" />
                    </Button>
                    {followUpError && <p className="text-[11px] text-red-600 dark:text-red-400">{followUpError}</p>}
                  </>
                )}
              </div>
            )}

            {/* Meta bilgiler */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {detail?.budget && (
                <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                  <p className="text-muted-foreground mb-0.5">{t("detail.budget")}</p>
                  <p className="font-medium">{detail.budget}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                <p className="text-muted-foreground mb-0.5">{t("detail.added")}</p>
                <p className="font-medium">{new Date(job.created_at).toLocaleDateString(locale)}</p>
              </div>
            </div>

            {/* AI Skor */}
            {matchScore !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />{t("detail.matchScore")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {matchResult?.verdict && <VerdictBadge verdict={matchResult.verdict} />}
                    <span className={`rounded-lg px-2.5 py-0.5 text-xs font-bold tabular-nums ${scoreColor(matchScore)}`}>
                      {matchScore}/100
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBarColor(matchScore)}`} style={{ width: `${matchScore}%` }} />
                </div>
                {matchResult && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{matchResult.summary}</p>
                )}
                {matchResult?.risks && <RiskBadges risks={matchResult.risks} />}
                {matchResult?.rubric && <MatchRubric rubric={matchResult.rubric} />}
                {matchResult && !matchResult.rubric && (
                  /* Rubrik öncesi eski sonuç: rubrikli yeniden analiz butonu (1 kredi). */
                  <Button variant="outline" size="sm" onClick={rematch} disabled={rematching} className="gap-2 w-full">
                    <RefreshCw className="h-3.5 w-3.5" />{rematching ? tRubric("reanalyzing") : tRubric("reanalyze")}
                    <CreditCost kind="job_match" />
                  </Button>
                )}
                {matchResult && (matchResult.strengths.length > 0 || matchResult.gaps.length > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {matchResult.strengths.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />{t("detail.strengths")}
                        </p>
                        {matchResult.strengths.map((s, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">· {s}</p>
                        ))}
                      </div>
                    )}
                    {matchResult.gaps.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />{t("detail.gaps")}
                        </p>
                        {matchResult.gaps.map((g, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground">· {g}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {matchResult?.improvements && <MatchImprovements improvements={matchResult.improvements} />}
              </div>
            )}

            {/* İlan Gereksinimleri */}
            {(matchResult?.requirements ?? []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />{t("detail.requirements")}
                </p>
                <ul className="space-y-1">
                  {(matchResult?.requirements ?? []).map((r, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                      <span className="text-[#00F0FF]">·</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Teklif Oluştur CTA */}
            <Button
              onClick={() => setShowProposal(true)}
              className="w-full gap-2"
              disabled={!detail?.description}
              title={!detail?.description ? t("detail.descriptionRequired") : undefined}
            >
              <Sparkles className="h-3.5 w-3.5" />{t("detail.createProposal")}
            </Button>

            {/* İlan Metni */}
            {detail?.description && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />{t("detail.jobDescription")}
                </p>
                <div className="rounded-xl bg-muted/30 border border-border p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                </div>
              </div>
            )}

            {/* İlanda Görüntüle */}
            {detail?.url && (
              <a
                href={detail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                {t("detail.viewListing")}
              </a>
            )}

            {/* Etiketler */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("detail.tags")}</p>
              <ChipsInput
                values={tags}
                onChange={saveTags}
                placeholder={t("detail.tagsPlaceholder")}
                removeTitle={t("detail.tagRemove")}
                max={12}
              />
            </div>

            {/* Notlar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{t("detail.notes")}</p>
                {savingNotes && <span className="text-[10px] text-muted-foreground/60">{t("detail.saving")}</span>}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={t("detail.notesPlaceholder")}
                rows={4}
                className="resize-none text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {showProposal && detail?.description && (
        <ProposalModal
          jobId={job.id}
          jobDescription={detail.description}
          defaultPlatform={job.platform ?? undefined}
          onClose={() => setShowProposal(false)}
          onCreditsUpdate={onCreditsUpdate}
        />
      )}
    </>
  );
}
