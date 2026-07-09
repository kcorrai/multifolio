// POST /api/cv/bullets → bir deneyim/proje girdisinin tüm madde işaretlerini tek
// çağrıda güçlendirir (aksiyon fiili + kapsam + mevcut metrik; uydurma YOK). Kredi
// harcar (cv_bullets). Sonuç DÖNER, kaydedilmez — kullanıcı editörde uygular + PUT'lar.
// tailor/route.ts deseni: spendCredits closure (AI patlarsa iade).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { spendCredits } from "@/lib/credits/spend";
import { enhanceBullets } from "@/lib/ai/cv";
import { cvBulletsSchema } from "@/lib/validation/schemas/cv";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, cvBulletsSchema);

  const { result, balance, spent } = await spendCredits(user.id, "cv_bullets", async () =>
    enhanceBullets(input.bullets, { role: input.role, company: input.company }),
  );

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cv_bullets",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ bullets: result.bullets, credits: { balance, spent } });
});
