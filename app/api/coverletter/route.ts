// POST /api/coverletter → seçili ilan için AI ön yazı (cover letter) üretir.
// Kredili (cover_letter). KALICI DEĞİL — kullanıcı okur/kopyalar (followup deseni).
// Geleneksel iş başvurusu için (freelance teklifinden farklı, platform-bağımsız).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { coverLetterCreateSchema } from "@/lib/validation/schemas/cover-letter";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateCoverLetter } from "@/lib/ai/coverletter";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, coverLetterCreateSchema);

  const [profileRes, jobRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_listings")
      .select("title, company")
      .eq("id", input.job_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequired"));
  if (jobRes.error) throw jobRes.error;

  const jobTitle = (jobRes.data?.title as string | null) ?? null;
  const company = (jobRes.data?.company as string | null) ?? null;

  const locale = await getUserLocale();
  const { result, balance, spent } = await spendCredits(user.id, "cover_letter", async () => {
    return generateCoverLetter(profileRes.data as ProfileInput, input.job_description, { locale, jobTitle, company });
  });

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cover_letter",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ content: result.content, credits: { balance, spent } });
});
