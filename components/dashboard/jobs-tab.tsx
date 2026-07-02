"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { JobRow } from "./shared";
import type { PoolJob } from "@/lib/validation/schemas/feed";
import { FeedView } from "./feed-view";
import { SearchView } from "./search-view";
import { StarredView } from "./starred-view";
import { AppliedView } from "./applied-view";
import { FeedModal } from "./feed-modal";

type View = "feed" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "search", "starred", "applied"];

export function JobsTab({
  initialJobs, profileSaved, initialFeedJobs, hasFeeds, initialView,
}: {
  initialJobs: JobRow[];
  profileSaved: boolean;
  initialFeedJobs: PoolJob[];
  hasFeeds: boolean;
  initialView: View;
}) {
  const t = useTranslations("feed");
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<View>(initialView);
  const [feedModalOpen, setFeedModalOpen] = useState(false);

  function selectView(v: View) {
    setView(v);
    const next = new URLSearchParams(params.toString());
    next.set("view", v);
    router.replace(`/dashboard/jobs?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => selectView(v)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`tabs.${v}`)}
          </button>
        ))}
      </div>

      {view === "feed" && <FeedView initialJobs={initialFeedJobs} hasFeeds={hasFeeds} onCreateFeed={() => setFeedModalOpen(true)} />}
      {view === "search" && <SearchView />}
      {view === "starred" && <StarredView />}
      {view === "applied" && <AppliedView initialJobs={initialJobs} profileSaved={profileSaved} />}

      {feedModalOpen && <FeedModal onClose={() => setFeedModalOpen(false)} onSaved={() => selectView("feed")} />}
    </div>
  );
}
