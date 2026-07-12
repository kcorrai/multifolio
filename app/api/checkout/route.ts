// POST /api/checkout → seçilen kredi paketi için iyzico Checkout Form başlatır.
// Akış: paketi SUNUCUDA çöz (istemci fiyatına güvenme) → 'pending' purchase satırı aç
// → iyzico initialize → dönen token'ı satıra yaz → paymentPageUrl'i istemciye ver.
// Kullanıcı bu URL'de öder; iyzico callback route'una token POST'lar.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { AppError, AuthError, ValidationError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { checkoutCreateSchema } from "@/lib/validation/schemas/checkout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPackage, packagePrice } from "@/lib/payments/packages";
import { getUserMarketId } from "@/lib/markets/server";
import { marketCurrency } from "@/lib/markets/config";
import { initializeCheckoutForm, isIyzicoConfigured } from "@/lib/payments/iyzico";
import { appBaseUrl } from "@/lib/payments/app-url";

export const POST = withErrorHandler(async (req) => {
  if (!isIyzicoConfigured()) {
    // Ops sorunu; mesaj kullanıcıya gösterilir (buton normalde gizli).
    throw new AppError("INTERNAL_ERROR", 503, "Ödeme sistemi şu an kullanılamıyor.", true);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { packageId } = await parseJson(req, checkoutCreateSchema);
  const pkg = getPackage(packageId);
  if (!pkg) throw new ValidationError("Geçersiz paket.");

  // Para birimi PAZARDAN (global → USD, TR → TRY); dilden bağımsız.
  const currency = marketCurrency(await getUserMarketId());
  const amount = packagePrice(pkg, currency);
  const priceStr = amount.toFixed(2); // iyzico decimal string ister; basketItems toplamı = price

  const conversationId = randomUUID();

  // Callback ve dönüş için mutlak taban URL (iyzico geçerli HTTPS ister).
  // Prod'da NEXT_PUBLIC_APP_URL kesin; yoksa proxy header'larından türet.
  const callbackUrl = `${appBaseUrl(req)}/api/checkout/callback`;

  // 'pending' satırı ÖNCE aç (service-role; RLS istemci yazımını bloke eder).
  const admin = createSupabaseAdminClient();
  const { data: purchase, error: insertError } = await admin
    .from("purchases")
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      credits: pkg.credits,
      amount,
      currency,
      status: "pending",
      conversation_id: conversationId,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  // Alıcı bilgisi: e-posta zorunlu; ad/soyad yoksa e-postadan türet, TCKN yer tutucu
  // (iyzico bireysel checkout'ta identityNumber ister; sandbox yer tutucu kabul eder).
  const emailLocal = (user.email ?? "musteri").split("@")[0];
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "85.34.78.112";

  const init = await initializeCheckoutForm({
    locale: "en", // global-only: iyzico form dili İngilizce
    conversationId,
    price: priceStr,
    paidPrice: priceStr,
    currency,
    basketId: conversationId,
    paymentGroup: "PRODUCT",
    callbackUrl,
    buyer: {
      id: user.id,
      name: emailLocal,
      surname: "-",
      email: user.email ?? `${emailLocal}@example.com`,
      identityNumber: "11111111111",
      registrationAddress: "Multifolio",
      ip,
      city: "Istanbul",
      country: "Turkey",
    },
    shippingAddress: {
      contactName: emailLocal,
      city: "Istanbul",
      country: "Turkey",
      address: "Multifolio",
    },
    billingAddress: {
      contactName: emailLocal,
      city: "Istanbul",
      country: "Turkey",
      address: "Multifolio",
    },
    basketItems: [
      {
        id: pkg.id,
        name: `${pkg.credits} kredi`,
        category1: "Credits",
        itemType: "VIRTUAL",
        price: priceStr,
      },
    ],
  });

  if (init.status !== "success" || !init.token || !init.paymentPageUrl) {
    // Başlatma başarısız → satırı 'failed' işaretle (kredi verilmez).
    await admin.from("purchases").update({ status: "failed" }).eq("id", purchase.id);
    console.error("iyzico checkout başlatılamadı", {
      userId: user.id,
      errorCode: init.errorCode,
      errorMessage: init.errorMessage,
    });
    throw new AppError("INTERNAL_ERROR", 502, "Ödeme başlatılamadı. Lütfen tekrar deneyin.", true);
  }

  // Token'ı satıra yaz (callback bununla eşleştirip idempotent kredi verir).
  await admin.from("purchases").update({ token: init.token }).eq("id", purchase.id);

  return NextResponse.json({ paymentPageUrl: init.paymentPageUrl, token: init.token });
});
