// POST /api/portfolio/generate → kullanıcının kayıtlı profilinden Claude ile portfolyo
// içeriği üretir, portfolios tablosuna yazar ve maliyeti usage_events'e kaydeder.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generatePortfolio } from "@/lib/ai/portfolio";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Kayıtlı profilden üret; profil yoksa anlamlı hata.
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileData) throw new NotFoundError((await getTranslations("errors"))("profileRequiredPortfolio"));

  const portfolioLocale = await getUserLocale();
  const admin = createSupabaseAdminClient();

  // Mevcut portfolyoyu güncelle (yoksa oluştur). Slug: ilk üretimde user id'den türetilir (salt-okuma).
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();
  const slug = existing?.slug ?? user.id.slice(0, 8);

  // AI üretimi + portfolyonun yazımı tek closure'da: yazım patlarsa spendCredits krediyi iade eder.
  const { result, balance, spent } = await spendCredits(user.id, "portfolio_generation", async () => {
    const ai = await generatePortfolio(profileData as ProfileInput, portfolioLocale);
    const { data: portfolio, error: upsertError } = await admin
      .from("portfolios")
      .upsert(
        { user_id: user.id, slug, content: ai.content },
        { onConflict: "user_id" },
      )
      .select("id, slug, published, content, updated_at")
      .single();
    if (upsertError) throw upsertError;
    return { ai, portfolio };
  });

  // Maliyet kaydı (analitik — kredi iadesi kapsamı dışında; server-otoritatif, service-role ile).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "portfolio_generation",
    model: result.ai.model,
    input_tokens: result.ai.inputTokens,
    output_tokens: result.ai.outputTokens,
    cost_usd: result.ai.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({
    portfolio: result.portfolio,
    credits: { balance, spent },
  });
});
