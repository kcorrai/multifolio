// POST /api/jobs/[id]/match → kullanıcının profilini ilanla karşılaştırır,
// sonucu job_listings'e yazar ve maliyeti usage_events'e kaydeder.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchJobToProfile } from "@/lib/ai/match";
import { sendMatchNotificationEmail } from "@/lib/notifications/email";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (_req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Profil ve ilan aynı anda çek; RLS sahipliği garanti eder.
  const [profileRes, jobRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_listings")
      .select("description")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data)
    throw new NotFoundError("Eşleştirme için önce profil doldurmalısın.");

  if (jobRes.error) throw jobRes.error;
  if (!jobRes.data) throw new NotFoundError("İlan bulunamadı.");

  const match = await matchJobToProfile(
    profileRes.data as ProfileInput,
    jobRes.data.description,
  );

  // Sonucu ilana yaz (regular client — RLS update_own politikası yeterli).
  const { data: updated, error: updateError } = await supabase
    .from("job_listings")
    .update({ match_score: match.result.score, match_result: match.result })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, company, platform, status, match_score, match_result, created_at")
    .single();

  if (updateError) throw updateError;

  // Maliyet kaydı — yalnızca service-role yazabilir (usage_events kuralı).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "job_match",
    model: match.model,
    input_tokens: match.inputTokens,
    output_tokens: match.outputTokens,
    cost_usd: match.costUsd,
  });
  if (usageError) throw usageError;

  // E-posta bildirimi: yüksek skor varsa bildir (fire-and-forget)
  if (user.email) {
    sendMatchNotificationEmail(
      user.email,
      updated.title,
      match.result.score,
      match.result.summary,
    ).catch(() => {});
  }

  return NextResponse.json({
    job: updated,
    cost: { usd: match.costUsd, inputTokens: match.inputTokens, outputTokens: match.outputTokens },
  });
});
