// POST /api/interview/prep → seçili ilan için AI mülakat hazırlığı üretir.
// Kredili (interview_prep). KALICI DEĞİL — kullanıcı okur/kopyalar (followup deseni).
// STAR hikâyeleri kullanıcının profiles.projects verisinden türer.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { interviewPrepCreateSchema } from "@/lib/validation/schemas/interview";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateInterviewPrep } from "@/lib/ai/interview";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput, ProfileProject } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, interviewPrepCreateSchema);

  const [profileRes, jobRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills, projects")
      .eq("user_id", user.id)
      .maybeSingle(),
    // İlan başlığı bağlam olarak (RLS: kendi ilanı). Yoksa yalnız description kullanılır.
    supabase
      .from("job_listings")
      .select("title")
      .eq("id", input.job_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequired"));
  if (jobRes.error) throw jobRes.error;

  const profileRow = profileRes.data as ProfileInput & { projects?: ProfileProject[] | null };
  const projects = Array.isArray(profileRow.projects) ? profileRow.projects : [];
  const jobTitle = (jobRes.data?.title as string | null) ?? null;

  const locale = await getUserLocale();
  const { result, balance, spent } = await spendCredits(user.id, "interview_prep", async () => {
    return generateInterviewPrep(
      { headline: profileRow.headline, summary: profileRow.summary, skills: profileRow.skills },
      projects,
      input.job_description,
      { locale, jobTitle },
    );
  });

  // Maliyet kaydı (analitik — kredi iadesi kapsamı dışında).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "interview_prep",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ prep: result.prep, credits: { balance, spent } });
});
