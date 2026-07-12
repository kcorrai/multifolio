// Pazar (market) konfigürasyonu — GLOBAL-ONLY. Deep global-only geçişinde TR pazarı
// kaldırıldı; tek pazar var. Katman ince kaldı (çağıranlar kırılmasın diye API korundu).
import type { Locale } from "@/i18n/detect";
import { defaultLocale } from "@/i18n/detect";
import type { PlatformId } from "@/lib/ai/platforms";
import { PLATFORM_IDS } from "@/lib/ai/platforms";

export type MarketId = "global";
export type MarketCurrency = "USD";
export type MarketPayment = "none" | "iyzico";

export interface Market {
  id: MarketId;
  label: string;
  locales: readonly Locale[];
  currency: MarketCurrency;
  platforms: readonly PlatformId[];
  hasKvkk: boolean;
  payment: MarketPayment;
}

export const MARKETS: Record<MarketId, Market> = {
  global: {
    id: "global",
    label: "Global",
    locales: ["en"],
    currency: "USD",
    platforms: PLATFORM_IDS,
    hasKvkk: false,
    payment: "none",
  },
};

export const MARKET_IDS = Object.keys(MARKETS) as MarketId[];
export const defaultMarket: MarketId = "global";

// Tek pazar → her zaman global.
export function resolveMarket(): MarketId {
  return "global";
}

export function getMarket(id: MarketId): Market {
  return MARKETS[id];
}

export function marketPlatforms(id: MarketId): readonly PlatformId[] {
  return MARKETS[id].platforms;
}

export function marketHasPlatform(id: MarketId, platform: PlatformId): boolean {
  return MARKETS[id].platforms.includes(platform);
}

export function marketCurrency(id: MarketId): MarketCurrency {
  return MARKETS[id].currency;
}

export function marketDefaultLocale(id: MarketId): Locale {
  return MARKETS[id].locales[0] ?? defaultLocale;
}

export function marketHasKvkk(id: MarketId): boolean {
  return MARKETS[id].hasKvkk;
}
