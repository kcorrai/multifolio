// POST /api/profile/import/translate → içe aktarılan profil taslağını (headline/summary/
// skills) kullanıcının UI diline çevirir. ÜCRETSİZDİR (kredi düşmez — onboarding sürtünmesi
// sıfır; import zaten ücretsiz). Taslak DB'ye YAZILMAZ; kullanıcı wizard'da inceleyip
// kaydeder. Saatlik limit usage_events(kind='profile_translate') — proposal_translate deseni.
import { NextResponse } from "next/server";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { AuthError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { translateProfileDraft } from "@/lib/ai/translate";

const HOURLY_LIMIT = 20;

const bodySchema = z.object({
  headline: z.string().trim().max(400).default(""),
  summary: z.string().trim().max(4000).default(""),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, bodySchema);

  // Rate-limit: son 1 saatteki profile_translate sayısı.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "profile_translate")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) {
    throw new RateLimitError((await getTranslations("errors"))("translateRateLimited"));
  }

  const result = await translateProfileDraft(input);

  // Maliyet + rate-limit kaydı (kredi düşmez, server-otoritatif).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "profile_translate", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ draft: result.draft });
});
