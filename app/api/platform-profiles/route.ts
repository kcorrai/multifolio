// POST /api/platform-profiles → bağlı profil URL'inden platform verisini çekip
// platform_profiles'a upsert eder (ÜCRETSİZ — yapılandırılmış public veri, AI yok).
// Yalnız sunucudan çekilebilen platformlar: Bionluk (public API) + LinkedIn
// (public ld+json). Upwork/Fiverr bot duvarı → tarayıcı uzantısı yazar (profile/import).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, NotFoundError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { platformProfileSyncSchema, platformProfileUpdateSchema } from "@/lib/validation/schemas/platform-profile";
import { parseLinkedinUsername, fetchLinkedinProfile } from "@/lib/import/linkedin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const HOURLY_LIMIT = 10;
const ROW_COLS = "platform, headline, summary, skills, avatar_url, portfolio, source_url, fetched_at";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const t = await getTranslations("errors");
  const { platform } = await parseJson(req, platformProfileSyncSchema);

  // Rate-limit: son 1 saatteki platform_sync sayısı (profile_import ile aynı desen).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "platform_sync")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) throw new RateLimitError(t("importRateLimited"));

  // Bağlı URL şart — çekim her zaman kayıtlı bağlantı üzerinden yapılır.
  const { data: conn, error: connError } = await supabase
    .from("platform_connections")
    .select("profile_url")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .maybeSingle();
  if (connError) throw connError;
  const url = (conn?.profile_url as string | undefined)?.trim();
  if (!url) throw new ValidationError(t("syncNoConnection"));

  // Platforma göre yapılandırılmış çekim.
  let row: {
    headline: string; summary: string; skills: string[];
    avatar_url: string | null; portfolio: unknown[]; model: string;
  };
  if (platform === "linkedin") {
    const username = parseLinkedinUsername(url);
    if (!username) throw new ValidationError(t("importFetchFailed"));
    let p = null;
    try {
      p = await fetchLinkedinProfile(username);
    } catch {
      throw new ValidationError(t("importFetchFailed"));
    }
    if (!p) throw new ValidationError(t("importFetchFailed"));
    row = { ...p.draft, avatar_url: p.avatarUrl, portfolio: [], model: "linkedin-structured" };
  } else {
    // Upwork/Fiverr sunucudan çekilemez — uzantı akışı platform_profiles'a yazar.
    throw new ValidationError(t("syncUnsupported"));
  }

  const { data: saved, error: upsertError } = await supabase
    .from("platform_profiles")
    .upsert(
      {
        user_id: user.id,
        platform,
        headline: row.headline,
        summary: row.summary,
        skills: row.skills,
        avatar_url: row.avatar_url,
        portfolio: row.portfolio,
        source_url: url,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    )
    .select(ROW_COLS)
    .single();
  if (upsertError) throw upsertError;

  // Rate-limit + gözlemlenebilirlik kaydı (server-otoritatif, service-role; ücretsiz).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "platform_sync", platform, model: row.model,
    input_tokens: 0, output_tokens: 0, cost_usd: 0, credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ profile: saved });
});

// PATCH /api/platform-profiles → çekilmiş profilin metnini (headline/summary/skills)
// günceller — çeviri sonrası kalıcı kaydetmek için. Avatar/portfolyo/kaynak KORUNUR.
// RLS'li istemci (kullanıcının kendi satırı); satır yoksa 404. Uyarı: sonraki POST
// (yeniden çek) platformdan orijinal dilde geri çeker → çeviri kaybolur (beklenen).
export const PATCH = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, platformProfileUpdateSchema);

  const { data: saved, error } = await supabase
    .from("platform_profiles")
    .update({ headline: input.headline, summary: input.summary, skills: input.skills })
    .eq("user_id", user.id)
    .eq("platform", input.platform)
    .select(ROW_COLS)
    .maybeSingle();
  if (error) throw error;
  if (!saved) throw new NotFoundError((await getTranslations("errors"))("syncNoConnection"));

  return NextResponse.json({ profile: saved });
});
