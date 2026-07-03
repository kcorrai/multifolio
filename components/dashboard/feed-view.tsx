"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Plus, Pencil, Trash2, Rss, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob, JobFeedRow } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { PLATFORMS, type PlatformId } from "@/lib/ai/platforms";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { JobSlideOver } from "./job-slide-over";
import { FeedModal } from "./feed-modal";
import { useDashboard } from "./dashboard-context";

export function FeedView({
  initialJobs, initialFeeds,
}: {
  initialJobs: PoolJob[];
  initialFeeds: JobFeedRow[];
}) {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>(initialJobs);
  const [feeds, setFeeds] = useState<JobFeedRow[]>(initialFeeds);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ feed: JobFeedRow | null } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Feed'ler değişince (oluştur/düzenle/sil) hem feed listesini hem eşleşen işleri tazele.
  async function refresh() {
    const [feedsRes, feedJobsRes] = await Promise.all([fetch("/api/feeds"), fetch("/api/feed?limit=50")]);
    const f = await feedsRes.json().catch(() => ({ feeds: [] }));
    const j = await feedJobsRes.json().catch(() => ({ jobs: [] }));
    setFeeds(f.feeds ?? []);
    setJobs(j.jobs ?? []);
    setSelectedJobId(null);
  }

  async function deleteFeed(id: string) {
    setConfirmingDelete(false);
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    if (selectedFeedId === id) setSelectedFeedId(null);
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function toggleStar(job: PoolJob) {
    const next = !job.isStarred;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: next } : j));
    await fetch(`/api/starred${next ? "" : `?jobPoolId=${job.id}`}`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ jobPoolId: job.id }) : undefined,
    });
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  const activeFeed = selectedFeedId ? feeds.find((f) => f.id === selectedFeedId) ?? null : null;
  // Feed başına eşleşme sayısı ve seçili feed'in ilanları istemcide, saf
  // matchesFeed ile hesaplanır (API zaten birleşik eşleşen listeyi döner).
  const countFor = (f: JobFeedRow) => jobs.filter((j) => matchesFeed(j, feedCriteria(f), j.score)).length;
  const visibleJobs = activeFeed ? jobs.filter((j) => matchesFeed(j, feedCriteria(activeFeed), j.score)) : jobs;
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;
  const hasFeeds = feeds.length > 0;

  // Seçili feed'in kriter özet çipleri (dil-nötr değerler i18n şablonlarıyla).
  const summaryChips = activeFeed
    ? [
        activeFeed.platform ? (PLATFORMS[activeFeed.platform as PlatformId]?.label ?? activeFeed.platform) : null,
        ...activeFeed.keywords,
        ...activeFeed.exclude_countries.map((c) => `− ${c}`),
        activeFeed.min_hourly_rate != null ? t("chipHourly", { value: activeFeed.min_hourly_rate }) : null,
        activeFeed.min_fixed_price != null ? t("chipFixed", { value: activeFeed.min_fixed_price }) : null,
        activeFeed.min_client_spent != null ? t("chipSpent", { value: activeFeed.min_client_spent }) : null,
        activeFeed.min_score != null && activeFeed.min_score > 0 ? t("chipScore", { value: activeFeed.min_score }) : null,
        activeFeed.notify ? t("chipNotify") : null,
      ].filter((c): c is string => c !== null)
    : [];

  if (!hasFeeds && jobs.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Rss className="h-7 w-7 text-muted-foreground/40" /></div>
          <p className="text-sm font-semibold text-muted-foreground">{t("noFeedsTitle")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("noFeedsHint")}</p>
          <Button onClick={() => setModal({ feed: null })} className="gap-2 mt-4"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
        </div>
        {modal && <FeedModal feed={modal.feed} onClose={() => setModal(null)} onSaved={refresh} />}
      </>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
      {/* ── Sol ray: kayıtlı feed'ler ─────────────────────────────────── */}
      <aside className="space-y-1 lg:sticky lg:top-3 lg:self-start">
        <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t("savedFeeds")}</p>
        <button
          onClick={() => { setSelectedFeedId(null); setConfirmingDelete(false); }}
          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
            !activeFeed ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-2 min-w-0"><Layers className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{t("allJobs")}</span></span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{jobs.length}</span>
        </button>
        {feeds.map((f) => (
          <button
            key={f.id}
            onClick={() => { setSelectedFeedId(f.id); setSelectedJobId(null); setConfirmingDelete(false); }}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
              f.id === selectedFeedId ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-2 min-w-0"><Rss className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]/70" /><span className="truncate">{f.name}</span></span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{countFor(f)}</span>
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setModal({ feed: null })} className="w-full gap-2 mt-2">
          <Plus className="h-4 w-4" />{t("createFeed")}
        </Button>
      </aside>

      {/* ── Sağ içerik: feed başlığı + ilanlar ────────────────────────── */}
      <div className="space-y-3 min-w-0">
        {activeFeed && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold leading-snug truncate">{activeFeed.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("jobCount", { count: visibleJobs.length })}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setModal({ feed: activeFeed })} className="gap-1.5 h-8 text-xs">
                  <Pencil className="h-3 w-3" />{t("editFeed")}
                </Button>
                <Button
                  variant={confirmingDelete ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => confirmingDelete ? deleteFeed(activeFeed.id) : setConfirmingDelete(true)}
                  onBlur={() => setConfirmingDelete(false)}
                  className="gap-1.5 h-8 text-xs"
                  title={t("modal.delete")}
                >
                  <Trash2 className="h-3 w-3" />{confirmingDelete ? t("deleteConfirm") : null}
                </Button>
              </div>
            </div>
            {summaryChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {summaryChips.map((chip, i) => (
                  <span key={i} className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{chip}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {visibleJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Briefcase className="h-7 w-7 text-muted-foreground/40" /></div>
            <p className="text-sm font-semibold text-muted-foreground">{t("feedEmptyTitle")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("feedEmptyHint")}</p>
            {activeFeed && (
              <Button variant="outline" onClick={() => setModal({ feed: activeFeed })} className="gap-2 mt-4"><Pencil className="h-4 w-4" />{t("editFeed")}</Button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleJobs.map((job) => (
              <PoolJobRow key={job.id} job={job} selected={job.id === selectedJobId} onStar={toggleStar} onOpen={(j) => setSelectedJobId(j.id)} />
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <JobSlideOver onClose={() => setSelectedJobId(null)}>
          <PoolJobPanel
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
            onScored={onScored}
            onApplied={() => {}}
            onCreditsUpdate={(c) => applyCredits(c)}
          />
        </JobSlideOver>
      )}

      {modal && <FeedModal feed={modal.feed} onClose={() => setModal(null)} onSaved={refresh} />}
    </div>
  );
}
