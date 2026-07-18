"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, ChevronDown, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { matchesFeed } from "@/lib/feed/filter";
import { PLATFORMS } from "@/lib/ai/platforms";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { JobSlideOver } from "./job-slide-over";
import { FeedModal } from "./feed-modal";
import { ChipsInput } from "./chips-input";
import { JobTypeSelect } from "./job-type-select";
import { useDashboard } from "./dashboard-context";

// Yayınlanma zamanı pencereleri (ms). posted_at yoksa ilan ELENMEZ (lenient).
const TIME_WINDOWS = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
} as const;
type TimeKey = "all" | keyof typeof TIME_WINDOWS;
const TIME_KEYS: TimeKey[] = ["all", "hour", "day", "week", "month"];

// Sayısal opsiyonel alan: boş/geçersiz → null.
function numOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function SearchView() {
  const t = useTranslations("feed");
  const { applyCredits, platforms } = useDashboard();
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Zaman filtresi referansı: render saf kalsın diye fetch anında sabitlenir.
  const [loadedAt, setLoadedAt] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filtreler: platform sunucuya gider, kalanı istemcide saf matchesFeed ile uygulanır.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [time, setTime] = useState<TimeKey>("all");
  const [platform, setPlatform] = useState("");
  const [excludeCountries, setExcludeCountries] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [minHourly, setMinHourly] = useState("");
  const [minFixed, setMinFixed] = useState("");
  const [saveModal, setSaveModal] = useState(false);
  const [actionError, setActionError] = useState("");
  // Hata bildirimi 5 sn sonra kendiliğinden kapanır (klavye kullanıcısını kilitlemez).
  useEffect(() => {
    if (!actionError) return;
    const id = setTimeout(() => setActionError(""), 5000);
    return () => clearTimeout(id);
  }, [actionError]);

  // Canlı arama: q/platform değişince debounce'lu çek. Boş q = tüm pool (açılışta hepsi).
  // Yeni arama listeyi DEĞİŞTİRİR (sayfalama sıfırlanır); loadedAt yalnız burada sabitlenir.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ limit: "50" });
      if (q.trim()) params.set("q", q.trim());
      if (platform) params.set("platform", platform);
      fetch(`/api/feed/search?${params.toString()}`)
        .then((r) => r.json())
        .then((b) => {
          if (!cancelled) {
            setJobs(b.jobs ?? []);
            setTotal(typeof b.total === "number" ? b.total : (b.jobs ?? []).length);
            setLoaded(true); setLoadedAt(Date.now()); setSelectedId(null);
          }
        })
        .catch(() => { if (!cancelled) setLoaded(true); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, platform]);

  // Sonraki dilimi aynı arama parametreleriyle çekip listeye ekler (id bazlı dedup).
  async function loadMore() {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "50", offset: String(jobs.length) });
      if (q.trim()) params.set("q", q.trim());
      if (platform) params.set("platform", platform);
      const res = await fetch(`/api/feed/search?${params.toString()}`);
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

  // İlanı açınca okundu işaretle (iyimser; okunmamış noktası temizlensin).
  function openJob(job: PoolJob) {
    setSelectedId(job.id);
    if (job.isRead) return;
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, isRead: true } : j));
    void fetch("/api/job-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobPoolIds: [job.id] }),
    }).catch(() => {});
  }

  function clearFilters() {
    setTime("all"); setPlatform(""); setExcludeCountries([]);
    setJobTypes([]); setMinHourly(""); setMinFixed("");
  }

  // İstemci tarafı filtre: ülke/harcama/ücret + zaman penceresi.
  const visible = useMemo(() => {
    return jobs.filter((j) => {
      if (time !== "all" && j.posted_at && loadedAt - new Date(j.posted_at).getTime() > TIME_WINDOWS[time]) return false;
      return matchesFeed(j, {
        keywords: [],
        min_budget: null,
        platform: null,
        exclude_countries: excludeCountries,
        job_types: jobTypes,
        min_hourly_rate: numOrNull(minHourly),
        min_fixed_price: numOrNull(minFixed),
      });
    });
  }, [jobs, loadedAt, time, excludeCountries, jobTypes, minHourly, minFixed]);

  // Atıl filtre tespiti: yüklenen havuzda ilgili veri hiç yoksa filtre pasif işaretlenir
  // (DEEP P1 — havuz Upwork-kalite bütçe vermiyor). Veri gelince otomatik aktif.
  const hasBudgetData = useMemo(() => jobs.some((j) => (j.budget ?? "").trim() !== ""), [jobs]);

  const selected = selectedId ? visible.find((j) => j.id === selectedId) ?? null : null;
  const activeCount = [platform, excludeCountries.length > 0, jobTypes.length > 0, minHourly.trim(), minFixed.trim()].filter(Boolean).length;
  const anyFilter = activeCount > 0 || time !== "all";

  return (
    <div className="space-y-3">
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40" />
      </div>

      {/* ── Filtre çubuğu: zaman çipleri + filtre paneli + temizle + feed kaydet ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {TIME_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={time === k}
              onClick={() => setTime(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                time === k ? "bg-[#00F0FF]/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`time.${k}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filtersOpen || activeCount > 0 ? "border-[#00F0FF]/40 bg-[#00F0FF]/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filters")}
          {activeCount > 0 && <span className="rounded-full bg-[#00F0FF]/20 px-1.5 text-[11px] font-bold tabular-nums">{activeCount}</span>}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>
        {anyFilter && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="h-3.5 w-3.5" />{t("clearFilters")}
          </button>
        )}
        <Button variant="outline" size="sm" onClick={() => setSaveModal(true)} className="gap-1.5 ml-auto h-8 text-xs">
          <Plus className="h-3.5 w-3.5" />{t("saveAsFeed")}
        </Button>
      </div>
      {/* Dürüstlük: zaman filtresi feed'e taşınmaz (job_feeds şemasında yaş yok). */}
      {time !== "all" && (
        <p className="text-xs text-muted-foreground/70">{t("timeNotSaved")}</p>
      )}

      {filtersOpen && (
        <div className="rounded-2xl border border-border bg-card p-4 animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.excludeCountriesLabel")}</span>
              <ChipsInput values={excludeCountries} onChange={setExcludeCountries} placeholder={t("modal.addCountry")} removeTitle={t("modal.removeKeyword")} max={20} />
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.platformLabel")}</span>
              <div className="relative">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm cursor-pointer"
                >
                  <option value="">{t("modal.allPlatforms")}</option>
                  {platforms.map((id) => <option key={id} value={id}>{PLATFORMS[id].label}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </label>
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">{t("jobTypeLabel")}</span>
              <JobTypeSelect values={jobTypes} onChange={setJobTypes} />
            </div>
            <label className={`block space-y-1 ${hasBudgetData ? "" : "opacity-50"}`}>
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.minHourlyLabel")}</span>
              <input value={minHourly} onChange={(e) => setMinHourly(e.target.value)} disabled={!hasBudgetData} inputMode="numeric" placeholder="25" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed" />
              {!hasBudgetData && <span className="block text-xs text-muted-foreground/70">{t("filterInactive")}</span>}
            </label>
            <label className={`block space-y-1 ${hasBudgetData ? "" : "opacity-50"}`}>
              <span className="text-xs font-semibold text-muted-foreground">{t("modal.minFixedLabel")}</span>
              <input value={minFixed} onChange={(e) => setMinFixed(e.target.value)} disabled={!hasBudgetData} inputMode="numeric" placeholder="500" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed" />
              {!hasBudgetData && <span className="block text-xs text-muted-foreground/70">{t("filterInactive")}</span>}
            </label>
          </div>
        </div>
      )}

      {loaded && (
        <p className="text-xs text-muted-foreground">
          {t("resultsCount", { count: visible.length })}
          {/* Zaman filtresi aktifken tarihsiz ilanlar elenmiyor (lenient) → şeffaf ol. */}
          {time !== "all" && visible.some((j) => !j.posted_at) && (
            <span className="text-muted-foreground/60">
              {" · "}{t("undatedIncluded", { count: visible.filter((j) => !j.posted_at).length })}
            </span>
          )}
        </p>
      )}
      {loaded && visible.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">{t("searchEmpty")}</p>}

      <div className="space-y-1.5">
        {visible.map((job) => (
          <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={toggleStar} onOpen={openJob} />
        ))}
        {/* Ham yüklenen sayıya bakılır — istemci filtresi gizlese de sunucudaki kalan çekilebilmeli. */}
        {loaded && jobs.length < total && (
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore} aria-busy={loadingMore} className="w-full mt-1">
            {loadingMore ? t("loadingMore") : t("loadMore")}
          </Button>
        )}
      </div>

      {selected && (
        <JobSlideOver onClose={() => setSelectedId(null)}>
          <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(c) => applyCredits(c)} />
        </JobSlideOver>
      )}

      {saveModal && (
        <FeedModal
          onClose={() => setSaveModal(false)}
          onSaved={() => {}}
          initial={{
            name: q.trim(),
            keywords: q.trim() ? [q.trim()] : [],
            platform: platform || undefined,
            excludeCountries,
            jobTypes,
            minHourlyRate: numOrNull(minHourly) ?? undefined,
            minFixedPrice: numOrNull(minFixed) ?? undefined,
          }}
        />
      )}
    </div>
  );
}
