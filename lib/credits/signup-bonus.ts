// Kayıt bonusu: yeni kullanıcıya reklamı yapılan ücretsiz krediyi BİR KEZ verir.
// create_initial_credits trigger'ı (migration 0005) bakiyeyi 0 açıyor; landing/pricing
// "100 ücretsiz kredi" vaat ediyor → bu fonksiyon o boşluğu kapatır. maybeGrantReferralBonus
// deseni: service-role, idempotent, hata İZOLE (çağıran akış asla patlamaz). Migration YOK —
// idempotency user_metadata.signup_bonus_granted bayrağıyla sağlanır.
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Pazarlama vaadiyle uyumlu (landing hero + pricing + FAQ "100 kredi").
export const SIGNUP_BONUS_CREDITS = 100;

/**
 * Yeni kullanıcıya kayıt kredisini bir kez ekler. İlk dashboard ziyaretinde çağrılır
 * (her kullanıcının geçtiği choke-point). Bayrak zaten set ise sorgusuz çıkar.
 * Yarış/çift-veriş: önce bayrağı "claim" eder; grant patlarsa bayrağı geri alır
 * (sonraki ziyarette tekrar denenir) — böylece kullanıcı krediyi asla kaybetmez.
 */
export async function maybeGrantSignupCredits(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.signup_bonus_granted === true) return; // çoğunluk yolu: sorgusuz çık

  try {
    const admin = createSupabaseAdminClient();

    // Bayrağı ÖNCE yaz (eşzamanlı ilk-ziyaret çift-verişini daraltır). Diğer
    // metadata anahtarları (ör. referred_by_code) korunur → spread.
    const { error: claimErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, signup_bonus_granted: true },
    });
    if (claimErr) return; // claim yazılamadı → grant deneme (sonra tekrar denenir)

    try {
      await admin.rpc("grant_credits", {
        p_user: user.id,
        p_amount: SIGNUP_BONUS_CREDITS,
        p_reason: "signup",
      });
    } catch (grantErr) {
      // Grant patladı → claim'i geri al ki bir sonraki ziyarette tekrar denensin.
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...meta, signup_bonus_granted: false },
      });
      throw grantErr;
    }
  } catch (err) {
    console.error("kayıt bonusu verilemedi", { userId: user.id, err });
  }
}
