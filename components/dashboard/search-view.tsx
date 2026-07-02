"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import { PoolJobRow } from "./pool-job-row";
import { PoolJobPanel } from "./pool-job-panel";
import { useDashboard } from "./dashboard-context";

export function SearchView() {
  const t = useTranslations("feed");
  const { applyCredits } = useDashboard();
  const [q, setQ] = useState("");
  const [jobs, setJobs] = useState<PoolJob[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`);
    const body = await res.json().catch(() => ({ jobs: [] }));
    setJobs(body.jobs ?? []); setSearched(true); setSelectedId(null);
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

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null;

  return (
    <div className="space-y-3">
      <form onSubmit={runSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/40" />
      </form>
      {searched && jobs.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">{t("searchEmpty")}</p>}
      <div className="grid lg:grid-cols-5 gap-3">
        <div className={`space-y-1.5 ${selected ? "lg:col-span-2" : "lg:col-span-5"}`}>
          {jobs.map((job) => (
            <PoolJobRow key={job.id} job={job} selected={job.id === selectedId} onStar={toggleStar} onOpen={(j) => setSelectedId(j.id === selectedId ? null : j.id)} />
          ))}
        </div>
        {selected && (
          <div className="lg:col-span-3 rounded-2xl border border-border overflow-hidden min-h-[400px]">
            <PoolJobPanel job={selected} onClose={() => setSelectedId(null)} onScored={onScored} onApplied={() => {}} onCreditsUpdate={(c) => applyCredits(c)} />
          </div>
        )}
      </div>
    </div>
  );
}
