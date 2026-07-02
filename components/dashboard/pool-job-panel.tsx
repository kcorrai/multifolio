"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Sparkles, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { scoreColor, scoreBarColor } from "./shared";

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
  const [scoring, setScoring] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setScoring(true); setError("");
    const res = await fetch(`/api/feed/${job.id}/score`, { method: "POST" });
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
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {job.source}{job.budget ? ` · ${job.budget}` : ""}{job.client_country ? ` · ${job.client_country}` : ""}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground/50 hover:text-foreground shrink-0"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {job.score !== null && result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold rounded-md px-2 py-0.5 ${scoreColor(job.score)}`}>{t("score")} {job.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor(job.score)}`} style={{ width: `${job.score}%` }} />
            </div>
            {result.summary && <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>}
            {result.strengths.length > 0 && (
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        ) : (
          <Button variant="outline" onClick={analyze} disabled={scoring} className="gap-2 w-full">
            <Sparkles className="h-4 w-4" />{scoring ? t("analyzing") : t("analyze")}
          </Button>
        )}

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">{t("description")}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{job.description}</p>
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
