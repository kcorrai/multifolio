// ŞABLON KORUMALI UÇ NOKTA — gelecekteki tüm API route'ları için referans desen.
// Üç sütunu birlikte gösterir:
//   1) withErrorHandler  → her hata yapılandırılmış cevaba/Sentry'ye gider.
//   2) parseJson(zod)    → istemci girdisine güvenilmez; sunucuda doğrulanır.
//   3) auth + RLS        → getUser() ile kimlik; DB erişimi RLS politikalarıyla
//                          (auth.uid() = user_id) sahibe sınırlı, parametreli sorgu.
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { profileInputSchema } from "@/lib/validation/schemas/profile";
import { mergeByPlatform } from "@/lib/profile/merge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const REFERRAL_BONUS = 20;
// Platform bazlı merge sonrası birikimli üst sınır (birden çok platform sığsın; jsonb
// büyümesini de sınırlar). İçe aktarma başına giriş şeması zaten 30/50 ile sınırlı.
const MERGED_PROJECTS_CAP = 60;
const MERGED_PORTFOLIO_CAP = 120;

// Referral aktivasyon tetiği: kayıtta ?ref= ile gelen kullanıcı İLK profilini
// kaydettiğinde iki tarafa da bonus verilir. referrals.referred_id UNIQUE =
// idempotency (tekrar kayıtta bonus verilmez). Hata İZOLE — profil kaydı
// asla patlamaz; log Sentry/console'a düşer, sessiz yutulmaz.
async function maybeGrantReferralBonus(user: User): Promise<boolean> {
  const referredByCode = (user.user_metadata as { referred_by_code?: unknown })?.referred_by_code;
  if (typeof referredByCode !== "string" || !referredByCode.trim()) return false; // çoğunluk yolu: sorgusuz çık

  try {
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin
      .from("referrals").select("id").eq("referred_id", user.id).maybeSingle();
    if (existing) return false;

    const { data: codeRow } = await admin
      .from("referral_codes").select("user_id").eq("code", referredByCode.trim()).maybeSingle();
    if (!codeRow || codeRow.user_id === user.id) return false; // geçersiz kod / self-referral

    const { error: refError } = await admin
      .from("referrals")
      .insert({ referrer_id: codeRow.user_id, referred_id: user.id, credited: true });
    if (refError) return false; // yarışta unique ihlali vb. — bonus verilmez, kayıt etkilenmez

    await admin.rpc("grant_credits", { p_user: codeRow.user_id, p_amount: REFERRAL_BONUS, p_reason: "referral" });
    await admin.rpc("grant_credits", { p_user: user.id, p_amount: REFERRAL_BONUS, p_reason: "referral" });
    return true;
  } catch (err) {
    console.error("referral bonus verilemedi", { userId: user.id, err });
    return false;
  }
}

// GET /api/profile → oturum sahibinin profilini döner (yoksa null).
export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // RLS zaten sahibe sınırlar; user_id filtresi niyeti açık kılar.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, headline, summary, skills, avatar_url, portfolio, projects, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error; // withErrorHandler → Sentry + generic 500.

  return NextResponse.json({ profile: data });
});

// POST /api/profile → profili oluşturur/günceller (kullanıcı başına tek profil).
export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Doğrulanmamış istemci verisi buraya kadar gelmez.
  const input = await parseJson(req, profileInputSchema);

  // avatar_url/portfolio yalnız gönderildiyse yazılır → düz profil düzenlemesi
  // (bu alanları göndermez) içe aktarılan görselleri EZMEZ.
  const row: Record<string, unknown> = {
    user_id: user.id,
    headline: input.headline,
    summary: input.summary,
    skills: input.skills,
  };

  // İçe aktarma save'i sourcePlatform gönderir → portfolio/projects PLATFORM BAZLI merge
  // edilir (diğer platformların öğeleri korunur). ProfileTab göndermez → tam-durum replace.
  const mergeMode = input.sourcePlatform !== undefined;
  const src = input.sourcePlatform ?? null;
  let existing: { avatar_url?: string | null; portfolio?: unknown; projects?: unknown } | null = null;
  if (mergeMode && (input.portfolio !== undefined || input.projects !== undefined || input.avatar_url !== undefined)) {
    const { data: existingRow, error: existingError } = await supabase
      .from("profiles").select("avatar_url, portfolio, projects").eq("user_id", user.id).maybeSingle();
    if (existingError) throw existingError;
    existing = existingRow;
  }

  // Avatar: import modunda kullanıcının SEÇTİĞİ avatar VARSA korunur (yeni platform onu
  // ezmesin); yoksa (ilk import) set edilir. Tüm platform avatarları platform_profiles'ta
  // durur → ProfileTab seçicisinden istediği zaman değiştirebilir. ProfileTab save'i
  // (mergeMode false) her zaman yazar — kullanıcı orada açıkça seçti.
  if (input.avatar_url !== undefined && (!mergeMode || !existing?.avatar_url)) {
    row.avatar_url = input.avatar_url;
  }
  if (input.portfolio !== undefined) {
    row.portfolio = mergeMode ? mergeByPlatform(existing?.portfolio, input.portfolio, src, MERGED_PORTFOLIO_CAP) : input.portfolio;
  }
  if (input.projects !== undefined) {
    row.projects = mergeMode ? mergeByPlatform(existing?.projects, input.projects, src, MERGED_PROJECTS_CAP) : input.projects;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "user_id" })
    .select("id, headline, summary, skills, avatar_url, portfolio, projects, updated_at")
    .single();

  if (error) throw error;

  // Referral bonusu ancak profil kaydı BAŞARILI olduktan sonra denenir.
  const referralBonus = await maybeGrantReferralBonus(user);

  return NextResponse.json({ profile: data, referralBonus }, { status: 200 });
});
