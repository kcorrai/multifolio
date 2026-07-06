// Onboarding tamamlama ödülü: kullanıcı "Getting Started" adımlarının HEPSİNİ
// tamamlayınca BİR KEZ bonus kredi verir. maybeGrantSignupCredits deseninin aynısı:
// service-role, idempotent (user_metadata bayrağı — migration YOK), hata İZOLE.
// Yalnız allStepsDone=true iken çağrılır (start sayfası ziyaretinde).
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const ONBOARDING_BONUS_CREDITS = 15;

/**
 * Tüm onboarding adımları tamamlandıysa ödülü bir kez ekler. `allStepsDone` false
 * ise ya da bayrak zaten set ise sorgusuz çıkar. Claim-first/rollback ile yarışa
 * dayanıklı (kullanıcı krediyi asla kaybetmez, çift verilmez).
 * @returns bu çağrıda YENİ verildiyse true (client kutlama + bonus notu gösterir).
 */
export async function maybeGrantOnboardingBonus(user: User, allStepsDone: boolean): Promise<boolean> {
  if (!allStepsDone) return false;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.onboarding_bonus_granted === true) return false; // zaten verildi

  try {
    const admin = createSupabaseAdminClient();

    // Bayrağı ÖNCE yaz (eşzamanlı çift-verişi daraltır); diğer metadata korunur.
    const { error: claimErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, onboarding_bonus_granted: true },
    });
    if (claimErr) return false;

    try {
      await admin.rpc("grant_credits", {
        p_user: user.id,
        p_amount: ONBOARDING_BONUS_CREDITS,
        p_reason: "onboarding",
      });
      return true;
    } catch (grantErr) {
      // Grant patladı → claim'i geri al (sonraki ziyarette tekrar denenir).
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, onboarding_bonus_granted: false },
      });
      throw grantErr;
    }
  } catch (err) {
    console.error("onboarding bonusu verilemedi", { userId: user.id, err });
    return false;
  }
}
