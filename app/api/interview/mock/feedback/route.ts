// POST /api/interview/mock/feedback → adayın bir soruya verdiği cevabı değerlendirir.
// Kredili (mock_answer=1; kullanıcı hangi cevabı göndereceğini seçer → kredi kontrolü).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { mockFeedbackRequestSchema } from "@/lib/validation/schemas/mock-interview";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { evaluateMockAnswer } from "@/lib/ai/mock-interview";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, mockFeedbackRequestSchema);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new NotFoundError((await getTranslations("errors"))("profileRequired"));

  // Bağlam: doğrudan job_description ya da job_id ile (kullanıcının kendi ilanı).
  let jobDescription = input.job_description ?? null;
  if (!jobDescription && input.job_id) {
    const { data: job } = await supabase
      .from("job_listings")
      .select("description")
      .eq("id", input.job_id)
      .eq("user_id", user.id)
      .maybeSingle();
    jobDescription = (job?.description as string | null) ?? null;
  }

  const locale = await getUserLocale();
  const { result, balance, spent } = await spendCredits(user.id, "mock_answer", async () => {
    return evaluateMockAnswer(profile as ProfileInput, input.question, input.answer, jobDescription, { locale });
  });

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "mock_answer",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ feedback: result.result, credits: { balance, spent } });
});
