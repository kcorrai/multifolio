"use client";

// İş akışı workspace'i — UpHunt tarzı TAM EKRAN 3 kolon (referans 5.png):
//  [Sol] feed sidebar: "Feed oluştur" + feed listesi (Tümü + kayıtlı feed'ler,
//        okunmamış rozetli) + Arama/Yıldızlı/Başvurulanlar nav.
//  [Orta] ilan rayı: "İşler" başlığı + düşük skor toggle + tümünü okundu + satırlar
//        + "X/Y gösteriliyor" alt bilgisi (kendi kaydırması).
//  [Sağ] seçili feed'in ayar paneli (FeedSettingsPanel) — feed seçilmemişse yer tutucu.
//  Kolonlar lg+ ekranda ayrı ayrı kayar; mobilde dikey yığılır. Feed/pool durumu ve
//  okundu takibi burada (sidebar sayaçları + ray aynı state'i paylaşır).
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Briefcase, Plus, Trash2, Rss, Layers, Sparkles, ArrowRight, Search, Star, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobRow } from "./shared";
import type { PoolJob, JobFeedRow } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { JobSlideOver } from "./job-slide-over";
import { FeedModal } from "./feed-modal";
import { FeedSettingsPanel } from "./feed-settings-panel";
import { SearchView } from "./search-view";
import { StarredView } from "./starred-view";
import { AppliedView } from "./applied-view";
import { useDashboard } from "./dashboard-context";

type View = "feed" | "search" | "starred" | "applied";
// Sayfa boyutu SSR'ın ilk dilimiyle (jobs/page.tsx slice(0, 25)) tutarlı.
const PAGE_SIZE = 25;

export function JobsTab({
  initialJobs, profileSaved, initialFeedJobs, initialFeedTotal, initialFeeds, initialView,
  weakRelevanceSignal = false,
}: {
  initialJobs: JobRow[];
  profileSaved: boolean;
  initialFeedJobs: PoolJob[];
  initialFeedTotal: number;
  initialFeeds: JobFeedRow[];
  initialView: View;
  weakRelevanceSignal?: boolean;
}) {
  const t = useTranslations("feed");
  const router = useRouter();
  const params = useSearchParams();
  const { applyCredits } = useDashboard();

  const [view, setView] = useState<View>(initialView);
  const [jobs, setJobs] = useState<PoolJob[]>(initialFeedJobs);
  const [total, setTotal] = useState(initialFeedTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feeds, setFeeds] = useState<JobFeedRow[]>(initialFeeds);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showLowScores, setShowLowScores] = useState(false);
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (!actionError) return;
    const id = setTimeout(() => setActionError(""), 5000);
    return () => clearTimeout(id);
  }, [actionError]);

  function syncViewUrl(v: View) {
    const next = new URLSearchParams(params.toString());
    next.set("view", v);
    router.replace(`/dashboard/jobs?${next.toString()}`, { scroll: false });
  }

  function selectNav(v: View) {
    setView(v);
    setSelectedFeedId(null);
    setSelectedJobId(null);
    setConfirmingDelete(false);
    syncViewUrl(v);
  }

  function selectFeed(id: string | null) {
    const wasFeed = view === "feed";
    setView("feed");
    setSelectedFeedId(id);
    setSelectedJobId(null);
    setConfirmingDelete(false);
    setShowLowScores(false);
    if (!wasFeed) syncViewUrl("feed");
  }

  async function refresh() {
    const [feedsRes, feedJobsRes] = await Promise.all([fetch("/api/feeds"), fetch(`/api/feed?offset=0&limit=${PAGE_SIZE}`)]);
    const f = await feedsRes.json().catch(() => ({ feeds: [] }));
    const j = await feedJobsRes.json().catch(() => ({ jobs: [] }));
    setFeeds(f.feeds ?? []);
    setJobs(j.jobs ?? []);
    setTotal(typeof j.total === "number" ? j.total : (j.jobs ?? []).length);
  }

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
    setActionError("");
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    if (selectedFeedId === id) setSelectedFeedId(null);
    const res = await fetch(`/api/feeds/${id}`, { method: "DELETE" });
    if (!res.ok) setActionError(t("actionFailed"));
    await refresh();
  }

  function onFeedSaved(updated: JobFeedRow) {
    setFeeds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    void refresh();
  }

  async function toggleStar(job: PoolJob) {
    const next = !job.isStarred;
    setActionError("");
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: next } : j));
    const res = await fetch(`/api/starred${next ? "" : `?jobPoolId=${job.id}`}`, {
      method: next ? "POST" : "DELETE",
      headers: next ? { "Content-Type": "application/json" } : undefined,
      body: next ? JSON.stringify({ jobPoolId: job.id }) : undefined,
    });
    if (!res.ok) {
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isStarred: !next } : j));
      setActionError(t("actionFailed"));
    }
  }

  function onScored(poolId: string, score: number, result: JobMatchResult) {
    setJobs((prev) => prev.map((j) => j.id === poolId ? { ...j, score, scoreResult: result } : j));
  }

  // Okundu işaretle (fire-and-forget; iyimser). id listesi boşsa no-op.
  function markRead(ids: string[]) {
    const fresh = ids.filter((id) => jobs.some((j) => j.id === id && !j.isRead));
    if (fresh.length === 0) return;
    setJobs((prev) => prev.map((j) => fresh.includes(j.id) ? { ...j, isRead: true } : j));
    void fetch("/api/job-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobPoolIds: fresh }),
    }).catch(() => {});
  }

  function openJob(job: PoolJob) {
    setSelectedJobId(job.id);
    markRead([job.id]);
  }

  const activeFeed = selectedFeedId ? feeds.find((f) => f.id === selectedFeedId) ?? null : null;
  const countFor = (f: JobFeedRow) => jobs.filter((j) => matchesFeed(j, feedCriteria(f), j.score)).length;
  const unreadFor = (f: JobFeedRow) => jobs.filter((j) => !j.isRead && matchesFeed(j, feedCriteria(f), j.score)).length;
  const allUnread = jobs.filter((j) => !j.isRead).length;
  const activeCriteria = activeFeed
    ? { ...feedCriteria(activeFeed), min_score: showLowScores ? null : activeFeed.min_score }
    : null;
  const visibleJobs = activeCriteria ? jobs.filter((j) => matchesFeed(j, activeCriteria, j.score)) : jobs;
  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null;

  const navItems: { key: View; label: string; Icon: typeof Search }[] = [
    { key: "search", label: t("navSearch"), Icon: Search },
    { key: "starred", label: t("navStarred"), Icon: Star },
    { key: "applied", label: t("navApplied"), Icon: Briefcase },
  ];

  const sideItem = "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer";
  const sideActive = "border-[#00F0FF]/30 bg-[#00F0FF]/10 text-foreground";
  const sideIdle = "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  // Sidebar okunmamış rozeti / sayaç.
  const countBadge = (unread: number, totalCount: number) =>
    unread > 0
      ? <span className="rounded-full bg-[#00F0FF]/20 px-1.5 text-[11px] font-bold tabular-nums text-[#00F0FF]">{unread}</span>
      : <span className="text-[11px] tabular-nums text-muted-foreground">{totalCount}</span>;

  return (
    <div className="lg:flex lg:h-full lg:min-h-0">
      {actionError && (
        <button
          type="button"
          role="alert"
          title={t("close")}
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 shadow-lg backdrop-blur cursor-pointer"
          onClick={() => setActionError("")}
        >
          {actionError}
        </button>
      )}

      {/* ── [Sol] feed sidebar ─────────────────────────────────────────── */}
      <aside className="shrink-0 border-b border-border lg:w-56 lg:border-b-0 lg:border-r lg:overflow-y-auto max-h-60 lg:max-h-none overflow-y-auto">
        <div className="p-3 space-y-1">
          <Button onClick={() => setCreateOpen(true)} className="w-full gap-2 mb-1">
            <Plus className="h-4 w-4" />{t("createFeed")}
          </Button>

          <p className="px-2.5 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t("savedFeeds")}</p>
          <button onClick={() => selectFeed(null)} className={`${sideItem} ${view === "feed" && !activeFeed ? sideActive : sideIdle}`}>
            <span className="inline-flex items-center gap-2 min-w-0"><Layers className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{t("allJobs")}</span></span>
            {countBadge(allUnread, total)}
          </button>
          {feeds.map((f) => (
            <button key={f.id} onClick={() => selectFeed(f.id)} className={`${sideItem} ${view === "feed" && f.id === selectedFeedId ? sideActive : sideIdle}`}>
              <span className="inline-flex items-center gap-2 min-w-0"><Rss className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]/70" /><span className="truncate">{f.name}</span></span>
              {countBadge(unreadFor(f), countFor(f))}
            </button>
          ))}

          <div className="my-2 border-t border-border" />
          {navItems.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => selectNav(key)} aria-current={view === key ? "page" : undefined} className={`${sideItem} ${view === key ? sideActive : sideIdle}`}>
              <span className="inline-flex items-center gap-2 min-w-0"><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span></span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── İçerik ──────────────────────────────────────────────────────── */}
      <div className="lg:flex-1 lg:min-h-0 lg:flex lg:overflow-hidden">
        <h2 className="sr-only">{t(`tabs.${view}`)}</h2>

        {/* Arama / Yıldızlı / Başvurulanlar: tek geniş içerik kolonu */}
        {view !== "feed" && (
          <section className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto">
            <div className="px-4 sm:px-6 py-5">
              {view === "search" && <SearchView />}
              {view === "starred" && <StarredView />}
              {view === "applied" && <AppliedView initialJobs={initialJobs} profileSaved={profileSaved} />}
            </div>
          </section>
        )}

        {view === "feed" && (
          <>
            {/* [Orta] ilan rayı */}
            <section className="shrink-0 border-b border-border lg:w-[360px] xl:w-[400px] lg:border-b-0 lg:border-r lg:flex lg:flex-col lg:overflow-hidden">
              {/* Ray başlığı: "İşler" + düşük skor toggle */}
              <div className="flex items-center justify-between gap-2 px-4 h-12 border-b border-border shrink-0">
                <h3 className="text-sm font-bold truncate">{t("railTitle")}</h3>
                {activeFeed && activeFeed.min_score != null && activeFeed.min_score > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input type="checkbox" checked={showLowScores} onChange={(e) => setShowLowScores(e.target.checked)} className="h-3.5 w-3.5 accent-[#00F0FF] cursor-pointer" />
                    <span className="text-[11px] text-muted-foreground">{t("showLowScores")}</span>
                  </label>
                )}
              </div>
              {/* Tümünü okundu + sayaç */}
              <div className="flex items-center justify-between gap-2 px-4 py-1.5 border-b border-border shrink-0">
                {allUnread > 0 ? (
                  <button onClick={() => markRead(visibleJobs.map((j) => j.id))} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <CheckCheck className="h-3.5 w-3.5" />{t("markAllRead")}
                  </button>
                ) : <span />}
                <span className="text-[11px] tabular-nums text-muted-foreground/70">{visibleJobs.length}</span>
              </div>
              {/* Satırlar (kaydırma) */}
              <div className="lg:flex-1 lg:overflow-y-auto p-2 space-y-1.5">
                {visibleJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
                    <Briefcase className="h-6 w-6 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground max-w-[220px]">{t("feedEmptyHint")}</p>
                  </div>
                ) : (
                  visibleJobs.map((job) => (
                    <PoolJobRow key={job.id} job={job} selected={job.id === selectedJobId} onStar={toggleStar} onOpen={openJob} />
                  ))
                )}
                {jobs.length < total && (
                  <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore} className="w-full mt-1">
                    {loadingMore ? t("loadingMore") : t("loadMore")}
                  </Button>
                )}
              </div>
              {/* Alt bilgi: X/Y gösteriliyor */}
              <div className="px-4 h-9 flex items-center border-t border-border shrink-0 text-[11px] text-muted-foreground">
                {t("showingOf", { shown: visibleJobs.length, total })}
              </div>
            </section>

            {/* [Sağ] ayar paneli / yer tutucu */}
            <section className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto">
              {activeFeed ? (
                <div className="px-4 sm:px-6 py-4 space-y-4">
                  {/* Feed adı + sil (referans üst şeridi) */}
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold truncate min-w-0">{activeFeed.name}</h2>
                    <Button
                      variant={confirmingDelete ? "destructive" : "ghost"}
                      size="sm"
                      onClick={() => confirmingDelete ? deleteFeed(activeFeed.id) : setConfirmingDelete(true)}
                      onBlur={() => setConfirmingDelete(false)}
                      className="gap-1.5 h-8 text-xs shrink-0"
                      title={t("modal.delete")}
                      aria-label={t("modal.delete")}
                    >
                      <Trash2 className="h-3 w-3" />{confirmingDelete ? t("deleteConfirm") : null}
                    </Button>
                  </div>
                  <FeedSettingsPanel key={activeFeed.id} feed={activeFeed} jobs={visibleJobs} onSaved={onFeedSaved} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] px-6 py-12 text-center">
                  {weakRelevanceSignal ? (
                    <Link href="/dashboard/profile" className="flex flex-col items-center gap-3 max-w-sm">
                      <div className="h-14 w-14 rounded-2xl bg-[#00F0FF]/10 flex items-center justify-center"><Sparkles className="h-7 w-7 text-[#00F0FF]" /></div>
                      <p className="text-sm font-semibold">{t("weakSignalHint")}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00F0FF]">{t("weakSignalCta")}<ArrowRight className="h-3.5 w-3.5" /></span>
                    </Link>
                  ) : (
                    <div className="flex flex-col items-center gap-3 max-w-sm">
                      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center"><Rss className="h-7 w-7 text-muted-foreground/40" /></div>
                      <p className="text-sm font-semibold text-muted-foreground">{t("settingsPlaceholderTitle")}</p>
                      <p className="text-xs text-muted-foreground/60">{t("settingsPlaceholderHint")}</p>
                      <Button onClick={() => setCreateOpen(true)} className="gap-2 mt-1"><Plus className="h-4 w-4" />{t("createFeed")}</Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
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
