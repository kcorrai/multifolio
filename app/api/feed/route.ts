// GET /api/feed → kullanıcının kayıtlı feed'lerine uyan pool ilanları
// (+ yıldız durumu + cache'li skor). Feed yoksa en yeni pool ilanları.
// MVP: sınırlı bir pencere çekilir (200), eşleştirme JS'te yapılır; ölçek
// büyüyünce sunucu-taraflı sorguya taşınır.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseQuery } from "@/lib/validation";
import { feedListQuerySchema, type PoolJobRow, type JobFeedRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { jobRelevance, orderDefaultFeed, type RelevanceProfile } from "@/lib/feed/relevance";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { offset, limit } = parseQuery(new URL(req.url).searchParams, feedListQuerySchema);

  const [profileRes, feedsRes, poolRes, starRes, scoreRes] = await Promise.all([
    supabase.from("profiles").select("headline, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_feeds").select("id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
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
  const relProfile: RelevanceProfile = { headline: profileRes.data?.headline ?? null, skills: profileRes.data?.skills ?? null };

  // Feedsiz varsayılan görünüm profil alakasına göre sıralanır/elenir; kayıtlı
  // feed'de kullanıcının kendi kriterleri (matchesFeed) geçerli, sıra korunur.
  const matched = feeds.length === 0
    ? orderDefaultFeed(pool, relProfile)
    : pool.filter((p) => {
        const s = scores.get(p.id);
        const score = s ? (s.score as number) : null;
        return feeds.some((f) => matchesFeed(p, feedCriteria(f), score));
      });

  const page: PoolJob[] = matched.slice(offset, offset + limit).map((p) => {
    const s = scores.get(p.id);
    return {
      ...p,
      isStarred: starred.has(p.id),
      score: s ? (s.score as number) : null,
      scoreResult: s ? s.result : null,
      relevance: jobRelevance(relProfile, p),
    };
  });

  return NextResponse.json({ jobs: page, total: matched.length, hasFeeds: feeds.length > 0 });
});
