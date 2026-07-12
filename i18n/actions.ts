"use server";
import { cookies } from "next/headers";
import type { Locale } from "./detect";
import { LOCALE_COOKIE } from "./locale";
import { MARKET_COOKIE } from "@/lib/markets/server";
import { marketDefaultLocale, type MarketId } from "@/lib/markets/config";

const YEAR = 60 * 60 * 24 * 365;

// Dil seçimini cookie'ye yazar (1 yıl). Client'tan server action olarak çağrılır.
export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: YEAR });
}

// Bölge (pazar) seçimini cookie'ye yazar + UI dilini pazarın varsayılanına sabitler.
// Kullanıcı dil seçmez; bölge seçer, dil ondan türer (global → en, TR → tr).
export async function setUserMarket(marketId: MarketId): Promise<void> {
  const store = await cookies();
  store.set(MARKET_COOKIE, marketId, { path: "/", maxAge: YEAR });
  store.set(LOCALE_COOKIE, marketDefaultLocale(marketId), { path: "/", maxAge: YEAR });
}
