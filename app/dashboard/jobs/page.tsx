import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobsTab } from "@/components/dashboard/jobs-tab";
import type { JobRow } from "@/components/dashboard/shared";
import type { PoolJob, PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import { matchesFeed } from "@/lib/feed/filter";

type View = "feed" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "search", "starred", "applied"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { view: viewParam } = await searchParams;

  const [profileRes, jobsRes, feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_feeds").select("id, name, keywords, min_budget, platform, created_at").eq("user_id", user.id),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const profileSaved = profileRes.data !== null;
  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));

  const matched = feeds.length === 0
    ? pool
    : pool.filter((p) => feeds.some((f) => matchesFeed(p, { keywords: f.keywords, min_budget: f.min_budget, platform: f.platform })));

  const initialFeedJobs: PoolJob[] = matched.slice(0, 25).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: starred.has(p.id), score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });

  const requested = (viewParam && VIEWS.includes(viewParam as View)) ? (viewParam as View) : null;
  const initialView: View = requested ?? (profileSaved ? "feed" : "applied");

  return (
    <JobsTab
      initialJobs={jobs}
      profileSaved={profileSaved}
      initialFeedJobs={initialFeedJobs}
      hasFeeds={feeds.length > 0}
      initialView={initialView}
    />
  );
}
