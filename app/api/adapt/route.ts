// MVP çekirdeği — uyarlama uç noktası. /api/profile şablonuyla aynı koruma deseni:
// withErrorHandler + auth + Zod. Kullanıcının profilini (satır-içi veya kayıtlı)
// hedef platform için Claude ile uyarlar ve gerçek maliyeti server-otoritatif
// olarak (service-role) usage_events'e kaydeder (harcama takibi).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { adaptRequestSchema } from "@/lib/validation/schemas/adapt";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adaptProfile } from "@/lib/ai/adapt";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, adaptRequestSchema);
  const source = input.source ?? "both";
  const errors = await getTranslations("errors");

  // Platformdan çekilmiş gerçek profil (kaynak "platform"/"both" için gerekli/bağlam).
  const { data: platformProfileRow, error: ppError } = await supabase
    .from("platform_profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .eq("platform", input.platform)
    .maybeSingle();
  if (ppError) throw ppError;
  const platformProfile = platformProfileRow as
    | { headline: string; summary: string; skills: string[] }
    | null;

  // Çekirdek profil: gövdede verildiyse onu kullan; aksi halde RLS'li sorguyla çek.
  async function loadCoreProfile(): Promise<ProfileInput> {
    if (input.profile) return input.profile;
    const { data, error } = await supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(errors("profileRequired"));
    return data as ProfileInput;
  }

  // Kaynağa göre uyarlamaya girecek profil + ek platform bağlamı belirlenir.
  let profile: ProfileInput;
  let platformContext: { headline: string; summary: string; skills: string[] } | null;
  if (source === "platform") {
    // Yalnız platform profili: çekilmiş veri şart; çekirdek profil gerekmez.
    if (!platformProfile) throw new NotFoundError(errors("platformProfileRequired"));
    profile = platformProfile;
    platformContext = null;
  } else if (source === "core") {
    profile = await loadCoreProfile();
    platformContext = null;
  } else {
    // "both": çekirdek profil + platform profili bağlam olarak.
    profile = await loadCoreProfile();
    platformContext = platformProfile;
  }

  const { result, balance, spent } = await spendCredits(user.id, "adaptation", async () => {
    const r = await adaptProfile(profile, input.platform, platformContext);
    // Kalıcılık closure İÇİNDE: yazım patlarsa kredi iade edilir (Faz 9 kuralı).
    const { error: upsertError } = await supabase
      .from("adaptations")
      .upsert(
        { user_id: user.id, platform: input.platform, headline: r.output.headline, body: r.output.body },
        { onConflict: "user_id,platform" },
      );
    if (upsertError) throw upsertError;
    return r;
  });

  // Maliyeti server-otoritatif kaydet (service-role — RLS yazma politikası yok).
  const admin = createSupabaseAdminClient();
  const { error: insertError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "adaptation",
    platform: input.platform,
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (insertError) throw insertError;

  return NextResponse.json({
    platform: input.platform,
    output: result.output,
    credits: { balance, spent },
  });
});
