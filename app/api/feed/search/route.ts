// GET /api/feed/search → pool üzerinde anlık arama (kaydedilmez).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseQuery } from "@/lib/validation";
import { feedSearchQuerySchema, type PoolJobRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { searchPool } from "@/lib/feed/filter";
import { jobRelevance, skillGap, dedupeNearDuplicates, type RelevanceProfile } from "@/lib/feed/relevance";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_WINDOW = 200;

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { q, platform, minBudget, offset, limit } = parseQuery(new URL(req.url).searchParams, feedSearchQuerySchema);

  const [profileRes, poolRes, starRes, scoreRes, readRes] = await Promise.all([
    supabase.from("profiles").select("headline, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_pool").select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr").order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(POOL_WINDOW),
    supabase.from("starred_jobs").select("job_pool_id").eq("user_id", user.id),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id),
    supabase.from("job_reads").select("job_pool_id").eq("user_id", user.id),
  ]);
  if (poolRes.error) throw poolRes.error;
  if (starRes.error) throw starRes.error;
  if (scoreRes.error) throw scoreRes.error;
  if (readRes.error) throw readRes.error;

  const pool = (poolRes.data ?? []) as PoolJobRow[];
  const starred = new Set((starRes.data ?? []).map((r) => r.job_pool_id as string));
  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const reads = new Set((readRes.data ?? []).map((r) => r.job_pool_id as string));
  const relProfile: RelevanceProfile = { headline: profileRes.data?.headline ?? null, skills: profileRes.data?.skills ?? null };

  // Arama sonucu kullanıcının sorgusuna göre (searchPool) filtrelenir; sıra korunur,
  // relevance yalnız rozet/skorlama-uyarısı için eklenir (arama sıralamasını değiştirmez).
  // Near-duplicate (aynı başlık farklı şehir) ilanlar tekilleştirilir (JOBS-FLOWS P1).
  const filtered = dedupeNearDuplicates(searchPool(pool, { q, platform, minBudget }));
  const page: PoolJob[] = filtered.slice(offset, offset + limit).map((p) => {
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

  return NextResponse.json({ jobs: page, total: filtered.length });
});
