// POST /api/profile/suggest → kullanıcının bağlı public profillerinden (platform_profiles)
// AI ile master profil önerisi üretir (ÜCRETSİZDİR — aktivasyon yardımcısı; import/analyze
// deseni). Öneri KAYDEDİLMEZ; kullanıcı alan bazlı "Uygula" ile forma taşır. Saatte 10 limit
// (usage_events kind='profile_suggest'). Bağlı public veri yoksa 400 → önce platform çek.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { suggestProfile, type SuggestPlatformProfile } from "@/lib/ai/profile-suggest";

const HOURLY_LIMIT = 10;

export const POST = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const t = await getTranslations("errors");

  // Rate-limit: son 1 saatteki profile_suggest sayısı (profile_import deseni).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "profile_suggest")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) throw new RateLimitError(t("importRateLimited"));

  const [platformRes, profileRes] = await Promise.all([
    supabase
      .from("platform_profiles")
      .select("platform, headline, summary, skills")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (platformRes.error) throw platformRes.error;
  if (profileRes.error) throw profileRes.error;

  // Anlamlı veri şart: en az bir platform profilinde headline/summary/skills olmalı.
  const platformProfiles = ((platformRes.data ?? []) as SuggestPlatformProfile[]).filter(
    (p) => (p.headline?.trim() || p.summary?.trim() || (p.skills?.length ?? 0) > 0),
  );
  if (platformProfiles.length === 0) throw new ValidationError(t("suggestNoData"));

  const locale = await getUserLocale();
  const current = profileRes.data
    ? {
        headline: (profileRes.data.headline as string) ?? "",
        summary: (profileRes.data.summary as string) ?? "",
        skills: (profileRes.data.skills as string[]) ?? [],
      }
    : null;

  const result = await suggestProfile({ platformProfiles, current, locale });

  // Rate-limit + gözlemlenebilirlik kaydı (ücretsiz — kredi düşmez, server-otoritatif).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "profile_suggest", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ suggestion: result.draft });
});
