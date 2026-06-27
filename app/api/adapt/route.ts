// MVP çekirdeği — uyarlama uç noktası. /api/profile şablonuyla aynı koruma deseni:
// withErrorHandler + auth + Zod. Kullanıcının profilini (satır-içi veya kayıtlı)
// hedef platform için Claude ile uyarlar.
//
// NOT (Faz 1 sonraki adım): kredi düşümü burada yapılacak — uyarlama bir kredi
// tüketen işlemdir. Şu an kredi kontrolü/düşümü henüz eklenmedi.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { adaptRequestSchema } from "@/lib/validation/schemas/adapt";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
    if (!data) throw new NotFoundError("Önce bir profil oluşturmalısın.");
    profile = data as ProfileInput;
  }

  const result = await adaptProfile(profile, input.platform);

  return NextResponse.json({ platform: input.platform, result });
});
