// POST /api/portfolio/generate → kullanıcının kayıtlı profilinden Claude ile portfolyo
// içeriği üretir, portfolios tablosuna yazar ve maliyeti usage_events'e kaydeder.
import { NextResponse } from "next/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generatePortfolio } from "@/lib/ai/portfolio";
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
  if (!profileData) throw new NotFoundError("Portfolyo oluşturmak için önce profil doldurmalısın.");

  const result = await generatePortfolio(profileData as ProfileInput, await getUserLocale());

  // Mevcut portfolyoyu güncelle (yoksa oluştur). Slug: ilk üretimde user id'den türetilir.
  const { data: existing } = await supabase
    .from("portfolios")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  const slug = existing?.slug ?? user.id.slice(0, 8);

  const admin = createSupabaseAdminClient();

  const { data: portfolio, error: upsertError } = await admin
    .from("portfolios")
    .upsert(
      { user_id: user.id, slug, content: result.content },
      { onConflict: "user_id" },
    )
    .select("id, slug, published, content, updated_at")
    .single();

  if (upsertError) throw upsertError;

  // Maliyet kaydı (server-otoritatif, service-role ile).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "portfolio_generation",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
  });
  if (usageError) throw usageError;

  return NextResponse.json({
    portfolio,
    cost: { usd: result.costUsd, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
  });
});
