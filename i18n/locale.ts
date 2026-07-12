import { cookies, headers } from "next/headers";
import { type Locale } from "./detect";
import { resolveMarket, marketDefaultLocale, marketAllowsLocale } from "@/lib/markets/config";
import { MARKET_COOKIE, MARKET_GEO_HEADER } from "@/lib/markets/server";

const COOKIE = "NEXT_LOCALE";

// Sunucu tarafı UI locale'i PAZARDAN türer: önce pazar çözülür (cookie/geo/Accept-Language),
// sonra pazarın izin verdiği bir NEXT_LOCALE cookie'si varsa o, yoksa pazarın varsayılan dili.
// Böylece global pazar → en, TR pazar → tr; bayat/uyumsuz locale cookie'si pazara göre elenir.
export async function getUserLocale(): Promise<Locale> {
  const [store, hdrs] = await Promise.all([cookies(), headers()]);
  const marketId = resolveMarket(
    store.get(MARKET_COOKIE)?.value,
    hdrs.get(MARKET_GEO_HEADER),
    hdrs.get("accept-language"),
  );
  const raw = store.get(COOKIE)?.value;
  const localeCookie: Locale | undefined = raw === "en" || raw === "tr" ? raw : undefined;
  if (localeCookie && marketAllowsLocale(marketId, localeCookie)) return localeCookie;
  return marketDefaultLocale(marketId);
}

export const LOCALE_COOKIE = COOKIE;
