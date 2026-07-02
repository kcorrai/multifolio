// GET /api/feed → kullanıcının kayıtlı feed'lerine uyan pool ilanları
// (+ yıldız durumu + cache'li skor). Feed yoksa en yeni pool ilanları.
// MVP: sınırlı bir pencere çekilir (200), eşleştirme JS'te yapılır; ölçek
// büyüyünce sunucu-taraflı sorguya taşınır.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseQuery } from "@/lib/validation";
import { feedListQuerySchema, type PoolJobRow, type JobFeedRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { matchesFeed } from "@/lib/feed/filter";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { offset, limit } = parseQuery(new URL(req.url).searchParams, feedListQuerySchema);

  const [feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("job_feeds").select("id, name, keywords, min_budget, platform, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
  ]);
  if (feedsRes.error) throw feedsRes.error;
  if (poolRes.error) throw poolRes.error;
  if (starRes.error) throw starRes.error;
  if (scoreRes.error) throw scoreRes.error;

  const feeds = (feedsRes.data ?? []) as JobFeedRow[];
  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));

  const matched = feeds.length === 0
    ? pool
    : pool.filter((p) => feeds.some((f) => matchesFeed(p, { keywords: f.keywords, min_budget: f.min_budget, platform: f.platform })));

  const page: PoolJob[] = matched.slice(offset, offset + limit).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: starred.has(p.id), score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });

  return NextResponse.json({ jobs: page, total: matched.length, hasFeeds: feeds.length > 0 });
});
