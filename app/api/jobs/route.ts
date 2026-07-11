// GET  /api/jobs → kullanıcının ilanlarını döner (yeniden eskiye sıralı).
// POST /api/jobs → yeni ilan oluşturur.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { jobCreateSchema } from "@/lib/validation/schemas/job";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// İş ekleme saatlik limiti — özellikle tarayıcı uzantısı iş-yakalama akışının
// spam vektörü olmasını önler (elle ekleme için de fazlasıyla yüksek).
const JOB_CAPTURE_HOURLY_LIMIT = 30;

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, company, platform, status, match_score, match_result, created_at, reminder_date, deadline_date, tags, budget")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ jobs: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, jobCreateSchema);

  // Rate-limit: son 1 saatteki iş eklemeleri (job_capture usage kayıtları).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "job_capture")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= JOB_CAPTURE_HOURLY_LIMIT) {
    throw new RateLimitError((await getTranslations("errors"))("jobCaptureRateLimited"));
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ user_id: user.id, ...input })
    .select("id, title, company, platform, status, match_score, match_result, created_at, reminder_date, deadline_date, tags, budget")
    .single();

  if (error) throw error;

  // Rate-limit sayacı için usage kaydı (kredi düşmez).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "job_capture", model: "none", credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ job: data }, { status: 201 });
});
