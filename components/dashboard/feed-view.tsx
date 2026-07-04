"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Briefcase, Plus, Trash2, Rss, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob, JobFeedRow } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { JobSlideOver } from "./job-slide-over";
import { FeedModal } from "./feed-modal";
import { FeedSettingsPanel } from "./feed-settings-panel";
import { useDashboard } from "./dashboard-context";

// Sayfa boyutu SSR'ın ilk dilimiyle (jobs/page.tsx slice(0, 25)) tutarlı.
const PAGE_SIZE = 25;

export function FeedView({
  initialJobs, initialFeeds, initialTotal,
}: {
  initialJobs: PoolJob[];
  initialFeeds: JobFeedRow[];
  initialTotal: number;
}) {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [jobs, setJobs] = useState<PoolJob[]>(initialJobs);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feeds, setFeeds] = useState<JobFeedRow[]>(initialFeeds);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showLowScores, setShowLowScores] = useState(false);

  // Feed'ler değişince (oluştur/düzenle/sil) hem feed listesini hem eşleşen işleri
  // tazele; sayfalama baştan başlar (offset=0).
  async function refresh() {
    const [feedsRes, feedJobsRes] = await Promise.all([fetch("/api/feeds"), fetch(`/api/feed?offset=0&limit=${PAGE_SIZE}`)]);
    const f = await feedsRes.json().catch(() => ({ feeds: [] }));
    const j = await feedJobsRes.json().catch(() => ({ jobs: [] }));
    setFeeds(f.feeds ?? []);
    setJobs(j.jobs ?? []);
    setTotal(typeof j.total === "number" ? j.total : (j.jobs ?? []).length);
  }

  // Sonraki dilimi çekip mevcut listeye ekler; pool bu arada değişmiş olabilir
  // diye id bazlı dedup yapılır.
  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?offset=${jobs.length}&limit=${PAGE_SIZE}`);
      const b = await res.json().catch(() => ({ jobs: [] }));
      const incoming = (b.jobs ?? []) as PoolJob[];
      setJobs((prev) => {
        const seen = new Set(prev.map((j) => j.id));
        return [...prev, ...incoming.filter((j) => !seen.has(j.id))];
      });
      if (typeof b.total === "number") setTotal(b.total);
    } finally {
      setLoadingMore(false);
    }
  }

  async function deleteFeed(id: string) {
    setConfirmingDelete(false);
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    if (selectedFeedId === id) setSelectedFeedId(null);
    await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    await refresh();
  }

  // Sayfa içi ayar paneli kaydedince: local state güncelle + genişleyen kriter
  // yeni ilanları getirebilsin diye arka planda tazele.
  function onFeedSaved(updated: JobFeedRow) {
    setFeeds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    void refresh();
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
  const activeCriteria = activeFeed
    ? { ...feedCriteria(activeFeed), min_score: showLowScores ? null : activeFeed.min_score }
    : null;
  const visibleJobs = activeCriteria ? jobs.filter((j) => matchesFeed(j, activeCriteria, j.score)) : jobs;
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;
  const hasFeeds = feeds.length > 0;
  // Ham yüklenen sayıya bakılır (istemci filtreli görünür sayıya DEĞİL) —
  // filtre gizlese de sunucudaki kalan ilanlar çekilebilmeli.
  const hasMore = jobs.length < total;

  if (!hasFeeds && jobs.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Rss className="h-7 w-7 text-muted-foreground/40" /></div>
          <p className="text-sm font-semibold text-muted-foreground">{t("noFeedsTitle")}</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("noFeedsHint")}</p>
          <Button onClick={() => setCreateOpen(true)} className="gap-2 mt-4"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
        </div>
        {createOpen && <FeedModal onClose={() => setCreateOpen(false)} onSaved={refresh} />}
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
            onClick={() => { setSelectedFeedId(f.id); setSelectedJobId(null); setConfirmingDelete(false); setShowLowScores(false); }}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
              f.id === selectedFeedId ? "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span className="inline-flex items-center gap-2 min-w-0"><Rss className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]/70" /><span className="truncate">{f.name}</span></span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{countFor(f)}</span>
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} className="w-full gap-2 mt-2">
          <Plus className="h-4 w-4" />{t("createFeed")}
        </Button>
      </aside>

      {/* ── Sağ içerik ────────────────────────────────────────────────── */}
      <div className="space-y-3 min-w-0">
        {activeFeed ? (
          <>
            {/* Feed başlığı: ad + sayı + sil */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold leading-snug truncate">{activeFeed.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("jobCount", { count: visibleJobs.length })}</p>
              </div>
              <Button
                variant={confirmingDelete ? "destructive" : "ghost"}
                size="sm"
                onClick={() => confirmingDelete ? deleteFeed(activeFeed.id) : setConfirmingDelete(true)}
                onBlur={() => setConfirmingDelete(false)}
                className="gap-1.5 h-8 text-xs shrink-0"
                title={t("modal.delete")}
              >
                <Trash2 className="h-3 w-3" />{confirmingDelete ? t("deleteConfirm") : null}
              </Button>
            </div>

            {/* UpHunt düzeni: dar ilan sütunu (sol) + geniş ayar panelleri (sağ) */}
            <div className="grid gap-4 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
              <div className="space-y-1.5 min-w-0">
                {activeFeed.min_score != null && activeFeed.min_score > 0 && (
                  <label className="flex items-center gap-2 px-1 pb-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLowScores}
                      onChange={(e) => setShowLowScores(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#00F0FF] cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{t("showLowScores")}</span>
                  </label>
                )}
                {visibleJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
                    <Briefcase className="h-6 w-6 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground max-w-[220px]">{t("feedEmptyHint")}</p>
                  </div>
                ) : (
                  visibleJobs.map((job) => (
                    <PoolJobRow key={job.id} job={job} selected={job.id === selectedJobId} onStar={toggleStar} onOpen={(j) => setSelectedJobId(j.id)} />
                  ))
                )}
                {hasMore && (
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} className="w-full mt-1">
                    {t("loadMore")}
                  </Button>
                )}
              </div>
              {/* key={id}: feed değişince panel state'i tazelenir */}
              <FeedSettingsPanel key={activeFeed.id} feed={activeFeed} onSaved={onFeedSaved} />
            </div>
          </>
        ) : visibleJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Briefcase className="h-7 w-7 text-muted-foreground/40" /></div>
            <p className="text-sm font-semibold text-muted-foreground">{t("feedEmptyTitle")}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">{t("feedEmptyHint")}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleJobs.map((job) => (
              <PoolJobRow key={job.id} job={job} selected={job.id === selectedJobId} onStar={toggleStar} onOpen={(j) => setSelectedJobId(j.id)} />
            ))}
            {hasMore && (
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} className="w-full mt-1">
                {t("loadMore")}
              </Button>
            )}
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

      {createOpen && <FeedModal onClose={() => setCreateOpen(false)} onSaved={refresh} />}
    </div>
  );
}
