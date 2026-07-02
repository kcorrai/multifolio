// POST /api/feed/[poolId]/score → profil × pool ilanı AI skoru.
// Cache: job_scores'ta varsa kredi harcamadan döner. Yoksa 1 kredi (job_match),
// sonucu job_scores'a upsert, maliyeti usage_events'e yazar. match route deseni.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchJobToProfile } from "@/lib/ai/match";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (_req, { params }) => {
  const { poolId } = await params as { poolId: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Cache kontrol: skor varsa kredi harcamadan döndür.
  const cachedRes = await supabase.from("job_scores").select("score, result").eq("user_id", user.id).eq("job_pool_id", poolId).maybeSingle();
  if (cachedRes.error) throw cachedRes.error;
  if (cachedRes.data) {
    return NextResponse.json({ score: cachedRes.data.score, result: cachedRes.data.result, credits: null, cached: true });
  }

  // Profil + pool ilanını çek.
  const [profileRes, poolRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_pool").select("description").eq("id", poolId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequiredMatch"));
  if (poolRes.error) throw poolRes.error;
  if (!poolRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  const locale = await getUserLocale();
  const admin = createSupabaseAdminClient();
  const description = poolRes.data.description;

  const { result, balance, spent } = await spendCredits(user.id, "job_match", async () => {
    const matched = await matchJobToProfile(profileRes.data as ProfileInput, description, locale);
    // Skoru cache'e yaz (service-role: job_scores insert politikası yok).
    const { error: upsertErr } = await admin.from("job_scores").upsert(
      { user_id: user.id, job_pool_id: poolId, score: matched.result.score, result: matched.result },
      { onConflict: "user_id,job_pool_id" },
    );
    if (upsertErr) throw upsertErr;
    return matched;
  });

  // Maliyet kaydı (kredi iadesi kapsamı dışında).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "job_match", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ score: result.result.score, result: result.result, credits: { balance, spent }, cached: false });
});
