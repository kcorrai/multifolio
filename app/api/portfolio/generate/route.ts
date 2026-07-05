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
import { portfolioThemeSchema, type PortfolioMedia } from "@/lib/validation/schemas/portfolio";
import type { ProfileInput, PortfolioItem } from "@/lib/validation/schemas/profile";

// Profil/platform görsellerini portfolyo galerisine çevirir (url'siz atlanır,
// caption 120'ye kırpılır, url'ye göre dedup, 24 ile sınırlı).
function buildGallery(...sources: (PortfolioItem[] | null | undefined)[]): PortfolioMedia["gallery"] {
  const seen = new Set<string>();
  const out: PortfolioMedia["gallery"] = [];
  for (const list of sources) {
    for (const item of list ?? []) {
      const url = item?.imageUrl?.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push({ url, caption: (item.title ?? "").slice(0, 120) });
      if (out.length >= 24) return out;
    }
  }
  return out;
}

export const POST = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Kayıtlı profilden üret; profil yoksa anlamlı hata. Avatar + portfolyo görselleri
  // de çekilir (public sayfaya gömülür → bağlı public profillerdeki veri iş görür).
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("headline, summary, skills, avatar_url, portfolio")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileData) throw new NotFoundError((await getTranslations("errors"))("profileRequiredPortfolio"));

  // Bağlı platform profillerinden avatar + galeri görselleri (yedek/ek kaynak).
  const { data: platformRows } = await supabase
    .from("platform_profiles")
    .select("avatar_url, portfolio")
    .eq("user_id", user.id)
    .order("fetched_at", { ascending: false });

  const media: PortfolioMedia = {
    avatarUrl:
      (profileData.avatar_url as string | null) ??
      (platformRows ?? []).find((r) => r.avatar_url)?.avatar_url ??
      null,
    gallery: buildGallery(
      profileData.portfolio as PortfolioItem[] | null,
      ...(platformRows ?? []).map((r) => r.portfolio as PortfolioItem[] | null),
    ),
  };

  const portfolioLocale = await getUserLocale();
  const admin = createSupabaseAdminClient();

  // Mevcut portfolyoyu güncelle (yoksa oluştur). Slug: ilk üretimde user id'den türetilir (salt-okuma).
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id, slug, content")
    .eq("user_id", user.id)
    .maybeSingle();
  const slug = existing?.slug ?? user.id.slice(0, 8);
  // Yeniden üretimde kullanıcının seçtiği tema + iletişim CTA hedefi KORUNUR (AI bunları üretmez).
  const existingContent = existing?.content as
    | { theme?: unknown; contactEmail?: unknown; contactUrl?: unknown }
    | null;
  const theme = portfolioThemeSchema.parse(existingContent?.theme);
  const contactEmail = typeof existingContent?.contactEmail === "string" ? existingContent.contactEmail : undefined;
  const contactUrl = typeof existingContent?.contactUrl === "string" ? existingContent.contactUrl : undefined;

  // AI üretimi + portfolyonun yazımı tek closure'da: yazım patlarsa spendCredits krediyi iade eder.
  const { result, balance, spent } = await spendCredits(user.id, "portfolio_generation", async () => {
    const ai = await generatePortfolio(profileData as ProfileInput, portfolioLocale, media);
    const content = { ...ai.content, theme, ...(contactEmail !== undefined ? { contactEmail } : {}), ...(contactUrl !== undefined ? { contactUrl } : {}) };
    const { data: portfolio, error: upsertError } = await admin
      .from("portfolios")
      .upsert(
        { user_id: user.id, slug, content },
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
