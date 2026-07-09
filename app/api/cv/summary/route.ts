// POST /api/cv/summary → gönderilen (kaydedilmemiş olabilir) CV içeriğinden 2 profesyonel
// özet varyantı üretir. Kredi harcar (cv_summary). Sonuç DÖNER, kaydedilmez — kullanıcı
// birini seçip editörde uygular + PUT'lar. tailor/route.ts deseni: spendCredits closure.
import { NextResponse } from "next/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { spendCredits } from "@/lib/credits/spend";
import { generateSummary } from "@/lib/ai/cv";
import { cvSummarySchema } from "@/lib/validation/schemas/cv";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, cvSummarySchema);
  const locale = await getUserLocale();

  const { result, balance, spent } = await spendCredits(user.id, "cv_summary", async () =>
    generateSummary(input.content, locale),
  );

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cv_summary",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ summaries: result.summaries, credits: { balance, spent } });
});
