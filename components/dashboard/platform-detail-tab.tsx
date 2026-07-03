"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft, Sparkles, Save, ExternalLink, Trash2, AlertCircle,
  Briefcase, Clock, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlatformLogo } from "@/components/platform-logo";
import { JobDetailPanel } from "@/components/job-detail-panel";
import { PLATFORMS, type PlatformId } from "@/lib/ai/platforms";
import type { ProposalRow } from "@/lib/validation/schemas/proposal";
import {
  ELEVATED, PLATFORM_STYLES, PLATFORM_URL_PLACEHOLDERS,
  STATUS_DOT, scoreColor, scoreBarColor, type JobRow, type AdaptOutput,
} from "./shared";
import { CopyButton } from "./copy-button";
import { useDashboard } from "./dashboard-context";
import { useAdapt } from "./use-adapt";

export function PlatformDetailTab({
  platform, profileSaved, connectionUrl, jobs: initialJobs, proposals, initialAdaptResult,
}: {
  platform: PlatformId;
  profileSaved: boolean;
  connectionUrl: string | null;
  jobs: JobRow[];
  proposals: ProposalRow[];
  initialAdaptResult: AdaptOutput | null;
}) {
  const t = useTranslations("platforms");
  const ta = useTranslations("adapt");
  const tc = useTranslations("accounts");
  const tj = useTranslations("jobs");
  const locale = useLocale();
  const style = PLATFORM_STYLES[platform];
  const { adaptResults, applyCredits, setConnectionsCount } = useDashboard();
  const { adapt, adapting, error: adaptError } = useAdapt();
  // Oturum içi taze üretim öncelikli; yenilemede DB'deki kalıcı kayıt devralır.
  const adaptResult = adaptResults[platform] ?? initialAdaptResult ?? undefined;

  // ── Bağlantı (tek platform) ──────────────────────────────────────────
  const [saved, setSaved] = useState<string | null>(connectionUrl);
  const [draft, setDraft] = useState(connectionUrl ?? "");
  const [savingConn, setSavingConn] = useState(false);
  const [deletingConn, setDeletingConn] = useState(false);
  const [connError, setConnError] = useState("");
  const isDirty = draft !== (saved ?? "");

  async function saveConnection() {
    const url = draft.trim();
    setSavingConn(true); setConnError("");
    const res = await fetch("/api/platform-connections", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, profile_url: url }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { setConnError(body?.error?.message ?? tc("errorSave")); setSavingConn(false); return; }
    if (!saved) setConnectionsCount((c) => c + 1);
    setSaved(url); setSavingConn(false);
  }

  async function removeConnection() {
    setDeletingConn(true); setConnError("");
    const res = await fetch("/api/platform-connections", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setConnError(body?.error?.message ?? tc("errorDelete")); setDeletingConn(false); return;
    }
    if (saved) setConnectionsCount((c) => Math.max(0, c - 1));
    setSaved(null); setDraft(""); setDeletingConn(false);
  }

  // ── Eşleşen işler (platform-filtreli) ────────────────────────────────
  const [jobs, setJobs] = useState<JobRow[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  // ── Teklifler → iş başlığı eşlemesi ──────────────────────────────────
  const jobTitleById = new Map(jobs.map((j) => [j.id, j.title]));
  const tips = t.raw(`tips.${platform}`) as string[];

  return (
    <div className="space-y-6">
      {/* Başlık + geri */}
      <div className="space-y-3">
        <Link href="/dashboard/platforms" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />{t("detail.back")}
        </Link>
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${style.icon}`}>
            <PlatformLogo platform={platform} size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{PLATFORMS[platform].label}</h2>
        </div>
      </div>

      {/* ── Bölüm: Uyarlanmış profil ─────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#00F0FF]" />{t("detail.profileSection")}
        </h3>
        {!profileSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 shrink-0" />{ta("saveProfileFirst")}
          </div>
        )}
        {adaptError && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />{adaptError}
          </div>
        )}
        <Card className={`shadow-sm overflow-hidden ${ELEVATED} ${style.accent}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("detail.profileHint")}</p>
              <Button size="sm" variant={adaptResult ? "outline" : "default"}
                onClick={() => adapt(platform)} disabled={adapting === platform || !profileSaved}
                className="gap-1.5 h-7 text-xs shrink-0">
                <Sparkles className="h-3 w-3" />
                {adapting === platform ? ta("adapting") : adaptResult ? ta("refresh") : ta("adaptAction")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {adaptResult ? (
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug">{adaptResult.headline}</p>
                  <CopyButton text={`${adaptResult.headline}\n\n${adaptResult.body}`} />
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{adaptResult.body}</p>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border border-dashed p-4 text-center space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  {profileSaved ? ta("emptyState", { platform: PLATFORMS[platform].label }) : ta("saveProfileFirst")}
                </p>
                {profileSaved ? (
                  <Button size="sm" onClick={() => adapt(platform)} disabled={adapting === platform} className="gap-1.5 h-7 text-xs">
                    <Sparkles className="h-3 w-3" />
                    {adapting === platform ? ta("adapting") : ta("adaptAction")}
                  </Button>
                ) : (
                  <Button asChild size="sm" className="gap-1.5 h-7 text-xs">
                    <Link href="/dashboard/import">{t("detail.setupProfileCta")}</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Bölüm: Bağlantı ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />{t("detail.connectionSection")}
        </h3>
        <Card className={`shadow-sm overflow-hidden ${ELEVATED}`}>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2">
              {saved ? (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>{tc("connected")}</span>
              ) : (
                <span className="text-[10px] text-muted-foreground/60">{tc("notConnected")}</span>
              )}
            </div>
            <input
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={PLATFORM_URL_PLACEHOLDERS[platform]}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            {connError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 shrink-0" />{connError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={saved && !isDirty ? "outline" : "default"}
                disabled={savingConn || !draft.trim()}
                onClick={saveConnection}
                className="gap-1.5 h-7 text-xs"
              >
                <Save className="h-3 w-3" />
                {savingConn ? tc("saving") : saved && !isDirty ? tc("saved") : tc("save")}
              </Button>
              {saved && (
                <>
                  <a href={saved} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" />{tc("view")}
                  </a>
                  <button
                    onClick={removeConnection}
                    disabled={deletingConn}
                    className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors cursor-pointer"
                    title={tc("removeConnection")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Bölüm: Eşleşen işler ─────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />{t("detail.jobsSection")}
        </h3>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-10 text-center">
            <Briefcase className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t("detail.noJobs")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5 h-7 text-xs">
              <Link href="/dashboard/jobs">{t("detail.noJobsCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-3">
            <div className={`space-y-1.5 ${selectedJob ? "lg:col-span-2" : "lg:col-span-5"}`}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedJobId(job.id === selectedJobId ? null : job.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedJobId(job.id === selectedJobId ? null : job.id);
                    }
                  }}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40 ${
                    job.id === selectedJobId
                      ? "border-[#00F0FF]/40 bg-[#00F0FF]/5"
                      : "border-border hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug truncate">{job.title}</p>
                      {job.company && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{job.company}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{tj(`status.${job.status}`)}</p>
                    </div>
                    {job.match_score !== null && (
                      <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 tabular-nums shrink-0 ${scoreColor(job.match_score)}`}>
                        {job.match_score}
                      </span>
                    )}
                  </div>
                  {job.match_score !== null && (
                    <div className="mt-2 ml-4 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarColor(job.match_score)}`} style={{ width: `${job.match_score}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedJob && (
              <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
                <JobDetailPanel
                  job={selectedJob}
                  onClose={() => setSelectedJobId(null)}
                  onJobUpdated={(updated) => setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j))}
                  onCreditsUpdate={(c) => applyCredits(c)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Bölüm: Teklif geçmişi + ipuçları ─────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />{t("detail.proposalsSection")}
        </h3>
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-10 text-center">
            <Clock className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">{t("detail.noProposals")}</p>
            <Button asChild size="sm" variant="outline" className="mt-3 gap-1.5 h-7 text-xs">
              <Link href="/dashboard/jobs">{t("detail.noJobsCta")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {jobTitleById.get(p.job_id) ?? t("detail.proposalJob")} · {new Date(p.created_at).toLocaleDateString(locale)}
                  </span>
                  <CopyButton text={p.content} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{p.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Platforma özel ipuçları */}
        <div className="rounded-2xl border border-violet-500/15 dark:border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-2 text-violet-500 dark:text-violet-300">
            <Lightbulb className="h-3.5 w-3.5" />{t("detail.tipsTitle")}
          </p>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
