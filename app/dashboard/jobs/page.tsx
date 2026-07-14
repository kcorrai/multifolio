import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { JobsTab } from "@/components/dashboard/jobs-tab";
import type { JobRow } from "@/components/dashboard/shared";
import type { PoolJob, PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { jobRelevance, skillGap, orderDefaultFeed, dedupeNearDuplicates, RELEVANCE_MIN_SIGNAL_SKILLS, type RelevanceProfile } from "@/lib/feed/relevance";
import { buildApplyQueue } from "@/lib/feed/queue";

type View = "feed" | "queue" | "search" | "starred" | "applied";
const VIEWS: View[] = ["feed", "queue", "search", "starred", "applied"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const user = await getRequestUser();
  if (!user) redirect("/login");

  const { view: viewParam } = await searchParams;

  const [profileRes, jobsRes, feedsRes, poolRes, starRes, scoreRes, readRes] = await Promise.all([
    supabase.from("profiles").select("user_id, headline, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at, reminder_date, deadline_date, tags, budget, source_pool_id, referred").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_feeds").select("id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, auto_draft_daily, created_at").eq("user_id", user.id),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(200),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
    supabase.from("job_reads").select("job_pool_id").eq("user_id", user.id),
  ]);

  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const profileSaved = profileRes.data !== null;
  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const reads = new Set((readRes.data ?? []).map((r) => r.job_pool_id as string));
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
      isRead: reads.has(p.id),
      score: s ? (s.score as number) : null,
      scoreResult: s ? s.result : null,
      relevance: jobRelevance(relProfile, p),
    skillGap: skillGap(relProfile, p),
    };
  });

  // Başvuru kuyruğu: başvurulmamış + feed-eşleşen, skor→relevance sıralı (kredisiz).
  // appliedIds = daha önce feed'den takibe alınan pool ilanları (source_pool_id).
  const appliedIds = new Set(
    ((jobsRes.data ?? []) as { source_pool_id?: string | null }[])
      .map((j) => j.source_pool_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  );
  const scoresById = new Map<string, number | null>(
    (scoreRes.data ?? []).map((r) => [r.job_pool_id as string, (r.score as number | null) ?? null]),
  );
  const initialQueue: PoolJob[] = buildApplyQueue(pool, feeds, scoresById, appliedIds, relProfile, 20).map((p) => {
    const s = scores.get(p.id);
    return {
      ...p,
      isStarred: starred.has(p.id),
      isRead: reads.has(p.id),
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
      initialQueue={initialQueue}
      initialView={initialView}
      weakRelevanceSignal={weakRelevanceSignal}
    />
  );
}
