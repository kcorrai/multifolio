// Pazar (market) konfigürasyonu — SAF, test edilebilir, next/headers'a bağımlı DEĞİL.
// Birim = pazar; dil pazarın bir alanıdır. Varsayılan = global (İngilizce, USD, global
// platformlar, KVKK yok). TR = üzerine eklenen konfigürasyon (tr+en, TRY, tüm platformlar,
// KVKK, Iyzico). Yeni ülke eklemek = buraya bir MARKETS girişi eklemek.
import type { Locale } from "@/i18n/detect";
import { defaultLocale } from "@/i18n/detect";
import type { PlatformId } from "@/lib/ai/platforms";

export type MarketId = "global" | "tr";
export type MarketCurrency = "USD" | "TRY";
export type MarketPayment = "none" | "iyzico";

export interface Market {
  id: MarketId;
  label: string;
  locales: readonly Locale[]; // pazarda izinli diller (ilki = varsayılan)
  currency: MarketCurrency;
  platforms: readonly PlatformId[]; // kullanıcıya SUNULAN platformlar (kayıt defteri ayrı)
  hasKvkk: boolean; // TR KVKK yasal metni/onayı gerekli mi
  payment: MarketPayment;
}

// Global platformlar her pazarda geçerli; Bionluk/Armut yalnız TR.
const GLOBAL_PLATFORMS: readonly PlatformId[] = ["linkedin", "upwork", "fiverr"] as const;
const TR_PLATFORMS: readonly PlatformId[] = ["linkedin", "upwork", "fiverr", "bionluk", "armut"] as const;

export const MARKETS: Record<MarketId, Market> = {
  global: {
    id: "global",
    label: "Global",
    locales: ["en"],
    currency: "USD",
    platforms: GLOBAL_PLATFORMS,
    hasKvkk: false,
    payment: "none",
  },
  tr: {
    id: "tr",
    label: "Türkiye",
    locales: ["tr", "en"],
    currency: "TRY",
    platforms: TR_PLATFORMS,
    hasKvkk: true,
    payment: "iyzico",
  },
};

export const MARKET_IDS = Object.keys(MARKETS) as MarketId[];
export const defaultMarket: MarketId = "global";

// Vercel geo header adı — SAF sabit (middleware/server ortak).
export const MARKET_GEO_HEADER = "x-vercel-ip-country";

// Ülke kodu (ISO-3166 alpha-2) → pazar. Şimdilik yalnız TR ayrı; gerisi global.
function marketForCountry(country: string | null | undefined): MarketId | null {
  if (!country) return null;
  return country.toUpperCase() === "TR" ? "tr" : "global";
}

// Pazar TAMAMEN konumdan çözülür (manuel seçim/override YOK): geo ülke →
// Accept-Language (tr* → tr) → varsayılan global. TR'den bağlanan tr, gerisi global.
export function resolveMarket(
  country: string | null | undefined,
  acceptLanguage: string | null,
): MarketId {
  const byGeo = marketForCountry(country);
  if (byGeo) return byGeo;
  if ((acceptLanguage ?? "").toLowerCase().startsWith("tr")) return "tr";
  return defaultMarket;
}

export function getMarket(id: MarketId): Market {
  return MARKETS[id];
}

// ── Pazar yardımcıları (UI/route'lar bunları okur) ──────────────────────
export function marketPlatforms(id: MarketId): readonly PlatformId[] {
  return MARKETS[id].platforms;
}

export function marketHasPlatform(id: MarketId, platform: PlatformId): boolean {
  return MARKETS[id].platforms.includes(platform);
}

export function marketCurrency(id: MarketId): MarketCurrency {
  return MARKETS[id].currency;
}

export function marketLocales(id: MarketId): readonly Locale[] {
  return MARKETS[id].locales;
}

// Pazarın varsayılan dili (locales'in ilki). Global → en.
export function marketDefaultLocale(id: MarketId): Locale {
  return MARKETS[id].locales[0] ?? defaultLocale;
}

export function marketAllowsLocale(id: MarketId, locale: Locale): boolean {
  return MARKETS[id].locales.includes(locale);
}

export function marketHasKvkk(id: MarketId): boolean {
  return MARKETS[id].hasKvkk;
}
