// GET    /api/starred → yıldızlı pool ilanları (+ cache skor).
// POST   /api/starred → yıldız ekle { jobPoolId }.
// DELETE /api/starred?jobPoolId= → yıldız kaldır.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseQuery } from "@/lib/validation";
import { starToggleSchema, type PoolJobRow, type PoolJob } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const POOL_COLS = "id, source, external_id, title, description, url, budget, skills, client_country, posted_at, created_at";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data: stars, error: starErr } = await supabase.from("starred_jobs").select("job_pool_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  if (starErr) throw starErr;

  const ids = (stars ?? []).map((s) => s.job_pool_id as string);
  if (ids.length === 0) return NextResponse.json({ jobs: [] });

  const [poolRes, scoreRes] = await Promise.all([
    supabase.from("job_pool").select(POOL_COLS).in("id", ids),
    supabase.from("job_scores").select("job_pool_id, score, result").eq("user_id", user.id).in("job_pool_id", ids),
  ]);
  if (poolRes.error) throw poolRes.error;
  if (scoreRes.error) throw scoreRes.error;

  const scores = new Map((scoreRes.data ?? []).map((r) => [r.job_pool_id as string, r]));
  const byId = new Map(((poolRes.data as PoolJobRow[]) ?? []).map((p) => [p.id, p]));

  // Yıldız sırasını koru.
  const jobs: PoolJob[] = ids.map((id) => byId.get(id)).filter((p): p is PoolJobRow => Boolean(p)).map((p) => {
    const s = scores.get(p.id);
    return { ...p, isStarred: true, score: s ? (s.score as number) : null, scoreResult: s ? s.result : null };
  });
  return NextResponse.json({ jobs });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { jobPoolId } = await parseJson(req, starToggleSchema);
  const { error } = await supabase.from("starred_jobs").upsert({ user_id: user.id, job_pool_id: jobPoolId }, { onConflict: "user_id,job_pool_id" });
  if (error) throw error;
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { jobPoolId } = parseQuery(new URL(req.url).searchParams, starToggleSchema);
  const { error } = await supabase.from("starred_jobs").delete().eq("user_id", user.id).eq("job_pool_id", jobPoolId);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
