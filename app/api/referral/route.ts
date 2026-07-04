// GET /api/referral → kullanıcının davet kodu (yoksa üretilir) + istatistik.
// Kod üretimi service-role ile (INSERT politikası bilinçli yok); okuma RLS'li.
// Davet linkinin origin'ini CLIENT kurar (window.location.origin) — API kod döndürür.
import { NextResponse } from "next/server";
import { AuthError, InternalError, withErrorHandler } from "@/lib/errors";
import { generateReferralCode } from "@/lib/referral/code";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const REFERRAL_BONUS = 20;
const MAX_CODE_ATTEMPTS = 5;

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const admin = createSupabaseAdminClient();

  // Getir-yoksa-üret: unique code çakışmasında (23505) yeniden dene.
  const { data: existing, error: selError } = await admin
    .from("referral_codes")
    .select("code")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selError) throw selError;

  let code = existing?.code as string | undefined;
  if (!code) {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !code; attempt++) {
      const candidate = generateReferralCode();
      const { error: insError } = await admin
        .from("referral_codes")
        .insert({ user_id: user.id, code: candidate });
      if (!insError) {
        code = candidate;
      } else if (insError.code === "23505") {
        // user_id çakışması = eşzamanlı istek zaten üretti → tekrar oku.
        const { data: raced } = await admin.from("referral_codes").select("code").eq("user_id", user.id).maybeSingle();
        if (raced?.code) code = raced.code as string;
        // code çakışmasıysa döngü yeni aday üretir.
      } else {
        throw insError;
      }
    }
    if (!code) throw new InternalError("Davet kodu üretilemedi.", { context: { userId: user.id } });
  }

  // İstatistik: RLS'li istemci (referrer kendi satırlarını okur).
  const { data: rows, error: statError } = await supabase
    .from("referrals")
    .select("credited")
    .eq("referrer_id", user.id);
  if (statError) throw statError;

  const invited = rows?.length ?? 0;
  const creditsEarned = (rows ?? []).filter((r) => r.credited).length * REFERRAL_BONUS;

  return NextResponse.json({ code, invited, creditsEarned });
});
