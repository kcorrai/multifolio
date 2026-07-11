// POST /api/portfolio/generate → kullanıcının kayıtlı profilinden Claude ile portfolyo
// içeriği üretir, portfolios tablosuna yazar ve maliyeti usage_events'e kaydeder.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generatePortfolio } from "@/lib/ai/portfolio";
import { slugify } from "@/lib/portfolio/slug";
import { spendCredits } from "@/lib/credits/spend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { portfolioThemeSchema, type PortfolioMedia } from "@/lib/validation/schemas/portfolio";
import type { ProfileInput, PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";
import { buildGallery, buildProjectGroups } from "@/lib/portfolio/media";

// İlk üretimde okunabilir + benzersiz slug türetir. Başlıktan slugify → alınmışsa
// kısa user-id eki → o da alınmışsa hex fallback. RLS bypass (admin) ile TÜM
// slug'lara karşı kontrol (portfolios.slug UNIQUE; select-own RLS başkasınınkini gizler).
async function deriveUniqueSlug(admin: SupabaseClient, headline: string | null, userId: string): Promise<string> {
  const base = slugify(headline ?? "");
  const hex = userId.slice(0, 8);
  const candidates = [base, base ? `${base}-${userId.slice(0, 4)}` : "", hex].filter(Boolean);
  for (const slug of candidates) {
    const { data: taken } = await admin.from("portfolios").select("slug").eq("slug", slug).maybeSingle();
    if (!taken) return slug;
  }
  return hex; // aşırı düşük olasılık — hex zaten user'a özgü
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
    .select("headline, summary, skills, avatar_url, portfolio, projects")
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
    // Proje-proje modu için gruplu görseller (yapılandırılmış projelerden).
    projectGroups: buildProjectGroups(profileData.projects as ProfileProject[] | null),
  };

  const portfolioLocale = await getUserLocale();
  const admin = createSupabaseAdminClient();

  // Mevcut portfolyoyu güncelle (yoksa oluştur). Slug: ilk üretimde profil başlığından
  // OKUNABİLİR türetilir (/p/senior-react-developer), benzersizlik DB'den kontrol edilir.
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id, slug, content")
    .eq("user_id", user.id)
    .maybeSingle();
  const slug = existing?.slug ?? (await deriveUniqueSlug(admin, profileData.headline as string | null, user.id));
  // Yeniden üretimde kullanıcının seçtiği tema + iletişim CTA hedefi KORUNUR (AI bunları üretmez).
  const existingContent = existing?.content as
    | { theme?: unknown; layout?: unknown; contactEmail?: unknown; contactUrl?: unknown; embedUrl?: unknown }
    | null;
  const theme = portfolioThemeSchema.parse(existingContent?.theme);
  // Gösterim modu (gallery/projects) yeniden üretimde KORUNUR (kullanıcı seçimi).
  const layout: "gallery" | "projects" = existingContent?.layout === "projects" ? "projects" : "gallery";
  // İletişim CTA: ilk üretimde hesap e-postasına VARSAYILAN (public sayfada "İşe al"
  // butonu default çalışsın — P1 #6). Editörde görünür + değiştirilebilir/silinebilir;
  // yeniden üretimde kullanıcının değeri (boş bıraktıysa boş dahil) KORUNUR.
  const contactEmail = typeof existingContent?.contactEmail === "string"
    ? existingContent.contactEmail
    : (existing ? undefined : (user.email ?? undefined));
  const contactUrl = typeof existingContent?.contactUrl === "string" ? existingContent.contactUrl : undefined;
  // Canlı gömme linki yeniden üretimde KORUNUR (AI üretmez).
  const embedUrl = typeof existingContent?.embedUrl === "string" ? existingContent.embedUrl : undefined;

  // AI üretimi + portfolyonun yazımı tek closure'da: yazım patlarsa spendCredits krediyi iade eder.
  const { result, balance, spent } = await spendCredits(user.id, "portfolio_generation", async () => {
    const ai = await generatePortfolio(profileData as ProfileInput, portfolioLocale, media);
    const content = { ...ai.content, theme, layout, ...(contactEmail !== undefined ? { contactEmail } : {}), ...(contactUrl !== undefined ? { contactUrl } : {}), ...(embedUrl !== undefined ? { embedUrl } : {}) };
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
