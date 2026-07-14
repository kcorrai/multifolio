// POST /api/negotiation → alınan teklif için AI maaş pazarlığı koçluğu üretir.
// Kredili (negotiation). KALICI DEĞİL — kullanıcı okur/kopyalar (followup deseni).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { negotiationRequestSchema } from "@/lib/validation/schemas/negotiation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateNegotiationCoaching } from "@/lib/ai/negotiation";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, negotiationRequestSchema);

  const [profileRes, jobRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    input.job_id
      ? supabase.from("job_listings").select("title, company").eq("id", input.job_id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequired"));
  if (jobRes.error) throw jobRes.error;

  const jobTitle = (jobRes.data?.title as string | null) ?? null;
  const company = (jobRes.data?.company as string | null) ?? null;

  const locale = await getUserLocale();
  const { result, balance, spent } = await spendCredits(user.id, "negotiation", async () => {
    return generateNegotiationCoaching(profileRes.data as ProfileInput, input.offer, input.target ?? null, { locale, jobTitle, company });
  });

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "negotiation",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ negotiation: result.negotiation, credits: { balance, spent } });
});
