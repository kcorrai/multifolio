import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobsTab } from "@/components/dashboard/jobs-tab";
import type { JobRow } from "@/components/dashboard/shared";
import type { PoolJob, PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { jobRelevance, skillGap, orderDefaultFeed, dedupeNearDuplicates, RELEVANCE_MIN_SIGNAL_SKILLS, type RelevanceProfile } from "@/lib/feed/relevance";

type View = "feed" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "search", "starred", "applied"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { view: viewParam } = await searchParams;

  const [profileRes, jobsRes, feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("profiles").select("user_id, headline, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at, reminder_date, deadline_date, tags, budget").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_feeds").select("id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, created_at").eq("user_id", user.id),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const profileSaved = profileRes.data !== null;
  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const relProfile: RelevanceProfile = {
    headline: (profileRes.data?.headline as string | undefined) ?? null,
    skills: (profileRes.data?.skills as string[] | undefined) ?? null,
  };

  // Feedsiz varsayılan görünüm profil alakasına göre sıralanır/elenir (route ile aynı).
  // Near-duplicate (aynı başlık farklı şehir) ilanlar tekilleştirilir (JOBS-FLOWS P1).
  const matched = feeds.length === 0
    ? orderDefaultFeed(pool, relProfile)
    : dedupeNearDuplicates(pool.filter((p) => {
        const s = scores.get(p.id);
        const score = s ? (s.score as number) : null;
        return feeds.some((f) => matchesFeed(p, feedCriteria(f), score));
      }));

  const initialFeedJobs: PoolJob[] = matched.slice(0, 25).map((p) => {
    const s = scores.get(p.id);
    return {
      ...p,
      isStarred: starred.has(p.id),
      score: s ? (s.score as number) : null,
      scoreResult: s ? s.result : null,
      relevance: jobRelevance(relProfile, p),
    skillGap: skillGap(relProfile, p),
    };
  });

  const requested = (viewParam && VIEWS.includes(viewParam as View)) ? (viewParam as View) : null;
  const initialView: View = requested ?? (profileSaved ? "feed" : "applied");

  // Profil skill sinyali zayıfsa (<3) varsayılan feed relevance sıralaması devre dışı
  // kalır (orderDefaultFeed kronolojiye düşer) — UI'da "profilini tamamla" ipucu göster.
  const skillCount = (relProfile.skills ?? []).filter((s) => s.trim()).length;
  const weakRelevanceSignal = skillCount < RELEVANCE_MIN_SIGNAL_SKILLS;

  return (
    <JobsTab
      initialJobs={jobs}
      profileSaved={profileSaved}
      initialFeedJobs={initialFeedJobs}
      initialFeedTotal={matched.length}
      initialFeeds={feeds}
      initialView={initialView}
      weakRelevanceSignal={weakRelevanceSignal}
    />
  );
}
