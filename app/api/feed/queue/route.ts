// GET /api/feed/queue → başvuru kuyruğu: başvurulmamış + feed-eşleşen pool ilanları,
// skor→relevance sıralı (kredisiz; taslak üretimi istek üzerine). feed route deseni.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { type PoolJobRow, type JobFeedRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { buildApplyQueue } from "@/lib/feed/queue";
import { jobRelevance, skillGap, type RelevanceProfile } from "@/lib/feed/relevance";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;
const QUEUE_LIMIT = 20;

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const [profileRes, feedsRes, poolRes, starRes, scoreRes, readRes, appliedRes] = await Promise.all([
    supabase.from("profiles").select("headline, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_feeds").select("id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, job_types, notify, proposal_prompt, created_at").eq("user_id", user.id),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr, job_type").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
    supabase.from("job_reads").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_listings").select("source_pool_id").eq("user_id", user.id).not("source_pool_id", "is", null),
  ]);
  if (feedsRes.error) throw feedsRes.error;
  if (poolRes.error) throw poolRes.error;

  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const reads = new Set((readRes.data ?? []).map((r) => r.job_pool_id as string));
  const scoreRows = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const scores = new Map<string, number | null>((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, (r.score as number | null) ?? null]));
  const appliedIds = new Set((appliedRes.data ?? []).map((r) => r.source_pool_id as string).filter(Boolean));
  const relProfile: RelevanceProfile = { headline: profileRes.data?.headline ?? null, skills: profileRes.data?.skills ?? null };

  const queue = buildApplyQueue(pool, feeds, scores, appliedIds, relProfile, QUEUE_LIMIT);

  const jobs: PoolJob[] = queue.map((p) => {
    const s = scoreRows.get(p.id);
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

  return NextResponse.json({ jobs });
});
