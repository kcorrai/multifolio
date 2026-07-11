// POST /api/checkout/callback → iyzico ödeme sonrası bu URL'e token POST'lar (form-encoded).
// Sonucu SUNUCUDAN retrieve ile doğrula (istemciye güvenme) → başarılıysa 'pending'→'paid'
// ATOMİK geçiş + grant_credits (çift callback kredi vermez). Ardından kullanıcıyı sonuç
// sayfasına 303 ile yönlendir (POST → GET).
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { retrieveCheckoutForm, isPaymentSuccessful } from "@/lib/payments/iyzico";
import { appBaseUrl } from "@/lib/payments/app-url";

function resultRedirect(req: Request, status: "success" | "failed"): NextResponse {
  return NextResponse.redirect(`${appBaseUrl(req)}/checkout/result?status=${status}`, { status: 303 });
}

export const POST = withErrorHandler(async (req) => {
  let token: string | null = null;
  try {
    const form = await req.formData();
    const raw = form.get("token");
    token = typeof raw === "string" ? raw : null;
  } catch {
    token = null;
  }
  if (!token) return resultRedirect(req, "failed");

  const admin = createSupabaseAdminClient();

  try {
    const result = await retrieveCheckoutForm({ token });

    // Token'la eşleşen bekleyen satın alımı bul (service-role; token UNIQUE).
    const { data: purchase } = await admin
      .from("purchases")
      .select("id, user_id, credits, status, amount, currency, conversation_id")
      .eq("token", token)
      .maybeSingle();

    if (!purchase) return resultRedirect(req, "failed");
    if (purchase.status === "paid") return resultRedirect(req, "success"); // idempotent

    if (!isPaymentSuccessful(result)) {
      await admin.from("purchases").update({ status: "failed" }).eq("id", purchase.id);
      return resultRedirect(req, "failed");
    }

    // Tutar/para birimi/conversation teyidi: iyzico'nun döndürdüğü ödeme, sunucuda
    // kaydedilen bekleyen satın alımla BİREBİR eşleşmeli. Eşleşmezse (kısmi ödeme,
    // init-fiyat kayması, yanlış callback) kredi VERME. undefined alan NaN/false →
    // güvenli tarafta 'failed' sayılır.
    const amountOk = Number(result.paidPrice) === Number(purchase.amount);
    const currencyOk = result.currency === purchase.currency;
    const convOk = result.conversationId === purchase.conversation_id;
    if (!amountOk || !currencyOk || !convOk) {
      console.error("checkout callback: tutar/para/conversation uyuşmazlığı", {
        token,
        expected: { amount: purchase.amount, currency: purchase.currency, conversationId: purchase.conversation_id },
        got: { paidPrice: result.paidPrice, currency: result.currency, conversationId: result.conversationId },
      });
      await admin.from("purchases").update({ status: "failed" }).eq("id", purchase.id);
      return resultRedirect(req, "failed");
    }

    // ATOMİK: yalnız 'pending' iken 'paid'e çevir → yarış/çift-callback'te tek satır etkilenir.
    const { data: flipped } = await admin
      .from("purchases")
      .update({ status: "paid", payment_id: result.paymentId })
      .eq("id", purchase.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    // Yalnız bu istek geçişi yaptıysa kredi ver (aksi halde başka istek zaten verdi).
    if (flipped) {
      await admin.rpc("grant_credits", {
        p_user: purchase.user_id,
        p_amount: purchase.credits,
        p_reason: "purchase",
      });
    }

    return resultRedirect(req, "success");
  } catch (err) {
    // Beklenmeyen (retrieve/DB) hata → kullanıcıyı nazikçe yönlendir, Sentry'ye logla.
    console.error("checkout callback hatası", { token, err });
    return resultRedirect(req, "failed");
  }
});
