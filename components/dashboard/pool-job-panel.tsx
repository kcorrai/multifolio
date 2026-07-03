"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X, Sparkles, ExternalLink, Check, Languages, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreditCost } from "@/components/credit-cost";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { poolJobTitle } from "@/lib/feed/filter";
import { scoreColor, scoreBarColor } from "./shared";
import { MatchRubric, VerdictBadge } from "./match-rubric";

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
  const [error, setError] = useState("");
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
    if (!res.ok) { setError(body?.error?.message ?? "Error"); setScoring(false); return; }
    onScored(job.id, body.score, body.result);
    if (body.credits) onCreditsUpdate(body.credits);
    setScoring(false);
  }

  async function apply() {
    // Upwork'te aç + mevcut job_listings pipeline'ına köprü.
    if (job.url) window.open(job.url, "_blank", "noopener");
    const res = await fetch("/api/jobs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: job.title, description: job.description, platform: job.source,
        url: job.url ?? undefined, budget: job.budget ?? undefined, source_pool_id: job.id,
      }),
    });
    if (res.ok) { setApplied(true); onApplied(job.id); }
  }

  const result = job.scoreResult;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{poolJobTitle(job, locale)}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {job.source}{job.budget ? ` · ${job.budget}` : ""}{job.client_country ? ` · ${job.client_country}` : ""}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            {result.rubric && <MatchRubric rubric={result.rubric} />}
            {result.strengths.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
            {!result.rubric && (
              /* Rubrik öncesi cache'lenmiş skor: rubrikli yeniden analiz (cache bypass, 1 kredi). */
              <Button variant="outline" size="sm" onClick={() => analyze(true)} disabled={scoring} className="gap-2 w-full">
                <RefreshCw className="h-3.5 w-3.5" />{scoring ? t("analyzing") : tRubric("reanalyze")}
                <CreditCost kind="job_match" />
              </Button>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={() => analyze()} disabled={scoring} className="gap-2 w-full">
            <Sparkles className="h-4 w-4" />{scoring ? t("analyzing") : t("analyze")}
            <CreditCost kind="job_match" />
          </Button>
        )}

        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-semibold text-muted-foreground">{t("description")}</p>
            {translating && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Languages className="h-3 w-3" />{t("translating")}
              </span>
            )}
            {tr.text && (
              <button
                onClick={() => setTr((s) => ({ ...s, showOriginal: !s.showOriginal }))}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

      <div className="border-t border-border p-4 flex items-center gap-2">
        {job.url && (
          <Button asChild variant="outline" className="gap-2 flex-1">
            <a href={job.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{t("openOnPlatform")}</a>
          </Button>
        )}
        <Button onClick={apply} disabled={applied} className="gap-2 flex-1">
          {applied ? <><Check className="h-4 w-4" />{t("applied")}</> : t("markApplied")}
        </Button>
      </div>
    </div>
  );
}
