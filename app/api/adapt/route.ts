// MVP çekirdeği — uyarlama uç noktası. /api/profile şablonuyla aynı koruma deseni:
// withErrorHandler + auth + Zod. Kullanıcının profilini (satır-içi veya kayıtlı)
// hedef platform için Claude ile uyarlar ve gerçek maliyeti server-otoritatif
// olarak (service-role) usage_events'e kaydeder (harcama takibi).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { adaptRequestSchema } from "@/lib/validation/schemas/adapt";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adaptProfile } from "@/lib/ai/adapt";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, adaptRequestSchema);

  // Profil: gövdede verildiyse onu kullan; aksi halde RLS'li sorguyla kayıtlıyı çek.
  let profile: ProfileInput | undefined = input.profile;
  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError((await getTranslations("errors"))("profileRequired"));
    profile = data as ProfileInput;
  }

  const result = await adaptProfile(profile, input.platform, await getUserLocale());

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
  });
  if (insertError) throw insertError;

  return NextResponse.json({
    platform: input.platform,
    output: result.output,
    cost: { usd: result.costUsd, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
  });
});
