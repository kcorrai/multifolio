// Kredi paketleri — SUNUCU tek doğru kaynağı. İstemciden gelen fiyat/kredi ASLA
// güvenilmez; checkout route paketi buradan çözer. Fiyatlar pricing-section ile
// birebir (starter/pro/scale). TRY = TL tutarı, USD = dolar tutarı (locale seçer).
export type PackageId = "starter" | "pro" | "scale";
export type PayCurrency = "TRY" | "USD";

export interface CreditPackage {
  id: PackageId;
  credits: number;
  priceTry: number; // iyzico'ya gönderilen TL tutarı (tam sayı TL)
  priceUsd: number; // iyzico'ya gönderilen USD tutarı
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  { id: "starter", credits: 100, priceTry: 349, priceUsd: 9 },
  { id: "pro", credits: 500, priceTry: 1149, priceUsd: 29 },
  { id: "scale", credits: 1500, priceTry: 2749, priceUsd: 69 },
] as const;

export function getPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

// iyzico decimal alanları string ister (ör. "349.0"). Kuruş yok — tam TL/USD.
export function packagePrice(pkg: CreditPackage, currency: PayCurrency): number {
  return currency === "TRY" ? pkg.priceTry : pkg.priceUsd;
}

// UI locale → ödeme para birimi (TR kullanıcı TL, diğerleri USD).
export function currencyForLocale(locale: string): PayCurrency {
  return locale === "tr" ? "TRY" : "USD";
}
