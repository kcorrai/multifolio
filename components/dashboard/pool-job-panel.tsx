"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X, Sparkles, ExternalLink, Check, Languages, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import { ProposalModal } from "@/components/proposal-modal";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { poolJobTitle } from "@/lib/feed/filter";
import { RELEVANCE_WARN_BELOW } from "@/lib/feed/relevance";
import { scoreColor, scoreBarColor } from "./shared";
import { MatchRubric, VerdictBadge, RiskBadges, MatchImprovements } from "./match-rubric";
import { JobScamWarning } from "./job-risk";

export function PoolJobPanel({
  job, onClose, onScored, onApplied, onCreditsUpdate,
}: {
  job: PoolJob;
  onClose: () => void;
  onScored: (poolId: string, score: number, result: JobMatchResult) => void;
  onApplied: (poolId: string) => void;
  onCreditsUpdate: (credits: { balance: number; spent: number }) => void;
}) {
  const t = useTranslations("feed");
  const tRubric = useTranslations("rubric");
  const locale = useLocale();
  const [scoring, setScoring] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  // Asistanlı başvuru teklif modalı (zengin deneyim: ton/uzunluk/kapsama/kalite/çeviri).
  // İlan değişince RENDER'da sıfırlanır. jobId = oluşturulan job_listings satırı.
  const [proposal, setProposalState] = useState({ jobIdFor: job.id, open: false, jobId: null as string | null });
  if (proposal.jobIdFor !== job.id) setProposalState({ jobIdFor: job.id, open: false, jobId: null });
  // Düşük-alaka skorlama uyarısı (kredi israfını önler); ilan değişince RENDER'da sıfırlanır.
  const [gate, setGate] = useState({ jobId: job.id, warned: false });
  if (gate.jobId !== job.id) setGate({ jobId: job.id, warned: false });
  // Çeviri durumu tek nesnede; ilan/dil değişince RENDER sırasında sıfırlanır
  // (effect içinde senkron setState yasak — react-hooks/set-state-in-effect).
  const [tr, setTr] = useState({ jobId: job.id, locale, text: null as string | null, failed: false, showOriginal: false });
  if (tr.jobId !== job.id || tr.locale !== locale) {
    setTr({ jobId: job.id, locale, text: null, failed: false, showOriginal: false });
  }

  // İlan UI dilinde değilse açıklamayı otomatik çevir (paylaşımlı cache — çoğu
  // zaman anında döner). Başarısızlıkta sessizce orijinal gösterilir.
  const needsTranslation = job.lang !== null && job.lang !== locale;
  const translating = needsTranslation && tr.text === null && !tr.failed;
  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    fetch(`/api/feed/${job.id}/translate`, { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (cancelled) return;
        const text = typeof body?.description === "string" ? body.description : null;
        setTr((s) => (s.jobId === job.id && s.locale === locale ? { ...s, text, failed: text === null } : s));
      })
      .catch(() => {
        if (!cancelled) setTr((s) => (s.jobId === job.id && s.locale === locale ? { ...s, failed: true } : s));
      });
    return () => { cancelled = true; };
  }, [job.id, locale, needsTranslation]);

  async function analyze(force = false) {
    setScoring(true); setError("");
    // force=true → cache bypass: eski rubriksiz skoru rubrikli analizle yeniler (1 kredi).
    const res = await fetch(`/api/feed/${job.id}/score`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setError(body?.error?.message ?? t("actionFailed")); setScoring(false); return; }
    onScored(job.id, body.score, body.result);
    if (body.credits) onCreditsUpdate(body.credits);
    setScoring(false);
  }

  async function apply() {
    // Çift-tık koruması: uçuşta ikinci tık mükerrer job_listings satırı açar (idempotency yok).
    if (applying || applied) return;
    setApplying(true); setError("");
    // Upwork'te aç + mevcut job_listings pipeline'ına köprü.
    if (job.url) window.open(job.url, "_blank", "noopener");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: job.title, description: job.description, platform: job.source,
          url: job.url ?? undefined, budget: job.budget ?? undefined, source_pool_id: job.id,
        }),
      });
      if (res.ok) { setApplied(true); onApplied(job.id); }
      else {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? t("actionFailed"));
      }
    } catch {
      setError(t("actionFailed"));
    } finally {
      setApplying(false);
    }
  }

  // Asistanlı başvuru: (1) job_listings oluştur (başvuruldu + pool bağı) → (2) platformda aç →
  // (3) zengin teklif modalını AÇ (autoGenerate — o işe özel teklif + ton/uzunluk/kapsama/kalite/
  // çeviri). Teklif "latest" olur; uzantı Upwork'te yapıştırır. Gönderim OTOMATİK DEĞİL.
  async function generateAndApply() {
    if (generating || applying) return;
    setGenerating(true); setError("");
    try {
      const jobRes = await fetch("/api/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: job.title, description: job.description, platform: job.source,
          url: job.url ?? undefined, budget: job.budget ?? undefined, source_pool_id: job.id,
        }),
      });
      const jobBody = await jobRes.json().catch(() => null);
      if (!jobRes.ok) { setError(jobBody?.error?.message ?? t("actionFailed")); setGenerating(false); return; }
      setApplied(true); onApplied(job.id);
      const jobId = jobBody.job?.id as string;
      if (job.url) window.open(job.url, "_blank", "noopener");
      setProposalState({ jobIdFor: job.id, open: true, jobId });
    } catch {
      setError(t("actionFailed"));
    } finally {
      setGenerating(false);
    }
  }

  const result = job.scoreResult;
  const lowRelevance = job.relevance !== null && job.relevance < RELEVANCE_WARN_BELOW;

  // Skorlama tıklaması: düşük alakada önce uyar (ikinci tık kredi harcar).
  function requestAnalyze() {
    if (lowRelevance && !gate.warned) { setGate({ jobId: job.id, warned: true }); return; }
    analyze();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{poolJobTitle(job, locale)}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {job.source}{job.budget ? ` · ${job.budget}` : ""}{job.client_country ? ` · ${job.client_country}` : ""}
          </p>
        </div>
        <button onClick={onClose} title={t("close")} aria-label={t("close")} className="text-muted-foreground/50 hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <JobScamWarning text={`${job.title} ${job.description}`} />
        {job.score !== null && result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold rounded-md px-2 py-0.5 ${scoreColor(job.score)}`}>{t("score")} {job.score}</span>
              {result.verdict && <VerdictBadge verdict={result.verdict} />}
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor(job.score)}`} style={{ width: `${job.score}%` }} />
            </div>
            {result.summary && <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>}
            {result.risks && <RiskBadges risks={result.risks} />}
            {result.rubric && <MatchRubric rubric={result.rubric} />}
            {result.strengths.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
            {result.improvements && <MatchImprovements improvements={result.improvements} />}
            {!result.rubric && (
              /* Rubrik öncesi cache'lenmiş skor: rubrikli yeniden analiz (cache bypass, 1 kredi). */
              <Button variant="outline" size="sm" onClick={() => analyze(true)} disabled={scoring} className="gap-2 w-full">
                <RefreshCw className="h-3.5 w-3.5" />{scoring ? t("analyzing") : tRubric("reanalyze")}
                <CreditCost kind="job_match" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {job.relevance !== null && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t("relevanceLabel")}</span>
                <span className={`font-bold rounded-md px-1.5 py-0.5 tabular-nums ${scoreColor(job.relevance)}`}>{job.relevance}</span>
              </div>
            )}
            {gate.warned && lowRelevance && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />{t("lowRelevanceWarn")}
              </p>
            )}
            <Button variant="outline" onClick={requestAnalyze} disabled={scoring} className="gap-2 w-full">
              <Sparkles className="h-4 w-4" />
              {scoring ? t("analyzing") : gate.warned && lowRelevance ? t("analyzeAnyway") : t("analyze")}
              <CreditCost kind="job_match" />
            </Button>
          </div>
        )}

        {job.skillGap && (job.skillGap.matched.length > 0 || job.skillGap.missing.length > 0) && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">{t("skillGapTitle")}</p>
            <div className="flex flex-wrap gap-1.5">
              {job.skillGap.matched.map((s) => (
                <span key={`m-${s}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />{s}
                </span>
              ))}
              {job.skillGap.missing.map((s) => (
                <span key={`x-${s}`} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {s}
                </span>
              ))}
            </div>
            {job.skillGap.missing.length > 0 && (
              <p className="text-xs text-muted-foreground">{t("skillGapMissingHint", { count: job.skillGap.missing.length })}</p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold text-muted-foreground">{t("description")}</p>
            {translating && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Languages className="h-3 w-3" />{t("translating")}
              </span>
            )}
            {tr.text && (
              <button
                onClick={() => setTr((s) => ({ ...s, showOriginal: !s.showOriginal }))}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Languages className="h-3 w-3" />
                {tr.showOriginal ? t("showTranslation") : t("showOriginal")}
              </button>
            )}
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">
            {tr.text && !tr.showOriginal ? tr.text : job.description}
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Asistanlı başvuru: zengin teklif modalı (açılışta otomatik üretir). */}
      {proposal.open && proposal.jobId && (
        <ProposalModal
          jobId={proposal.jobId}
          jobDescription={job.description}
          defaultPlatform={job.source}
          autoGenerate
          onClose={() => setProposalState((s) => ({ ...s, open: false }))}
          onCreditsUpdate={onCreditsUpdate}
        />
      )}

      <div className="border-t border-border p-4 space-y-2">
        <Button onClick={generateAndApply} disabled={generating || applying} aria-busy={generating} className="w-full gap-2">
          <Sparkles className="h-4 w-4" />{generating ? t("generating") : t("generateAndApply")}
          <CreditCost kind="proposal" />
        </Button>
        <div className="flex items-center gap-2">
          {job.url && (
            <Button asChild variant="outline" className="gap-2 flex-1">
              <a href={job.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{t("openOnPlatform")}</a>
            </Button>
          )}
          <Button variant="ghost" onClick={apply} disabled={applied || applying} className="gap-2 flex-1">
            {applied ? <><Check className="h-4 w-4" />{t("applied")}</> : t("markApplied")}
          </Button>
        </div>
      </div>
    </div>
  );
}
