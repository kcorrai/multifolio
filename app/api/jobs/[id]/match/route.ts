// POST /api/jobs/[id]/match → kullanıcının profilini ilanla karşılaştırır,
// sonucu job_listings'e yazar ve maliyeti usage_events'e kaydeder.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseUuidParam } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchJobToProfile } from "@/lib/ai/match";
import { spendCredits } from "@/lib/credits/spend";
import { sendMatchNotificationEmail } from "@/lib/notifications/email";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
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
      .select("title, description, budget")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data)
    throw new NotFoundError((await getTranslations("errors"))("profileRequiredMatch"));

  if (jobRes.error) throw jobRes.error;
  if (!jobRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  const locale = await getUserLocale();
  const job = jobRes.data;
  // AI eşleştirme + ilana yazım tek closure'da: yazım patlarsa spendCredits krediyi iade eder.
  const { result, balance, spent } = await spendCredits(user.id, "job_match", async () => {
    const matched = await matchJobToProfile(profileRes.data as ProfileInput, job.description, locale, {
      title: job.title as string | null,
      budget: job.budget as string | null,
    });
    // Sonucu ilana yaz (regular client — RLS update_own politikası yeterli).
    const { data: updated, error: updateError } = await supabase
      .from("job_listings")
      .update({ match_score: matched.result.score, match_result: matched.result })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, company, platform, status, match_score, match_result, created_at")
      .single();
    if (updateError) throw updateError;
    return { matched, updated };
  });
  const { matched, updated } = result;

  // Maliyet kaydı (analitik — kredi iadesi kapsamı dışında; service-role yazar).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "job_match",
    model: matched.model,
    input_tokens: matched.inputTokens,
    output_tokens: matched.outputTokens,
    cost_usd: matched.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  // E-posta bildirimi: yüksek skor varsa bildir (fire-and-forget)
  if (user.email) {
    sendMatchNotificationEmail(
      user.email,
      updated.title,
      matched.result.score,
      matched.result.summary,
      locale,
    ).catch(() => {});
  }

  return NextResponse.json({
    job: updated,
    credits: { balance, spent },
  });
});
