// Sunucu tarafı pazar çözümü: market cookie (override) → Vercel geo header
// (x-vercel-ip-country) → Accept-Language → varsayılan global. i18n/locale.ts deseni.
import { cookies, headers } from "next/headers";
import { resolveMarket, getMarket, MARKET_COOKIE, MARKET_GEO_HEADER, type Market, type MarketId } from "./config";

export async function getUserMarketId(): Promise<MarketId> {
  const [store, hdrs] = await Promise.all([cookies(), headers()]);
  return resolveMarket(
    store.get(MARKET_COOKIE)?.value,
    hdrs.get(MARKET_GEO_HEADER),
    hdrs.get("accept-language"),
  );
}

export async function getUserMarket(): Promise<Market> {
  return getMarket(await getUserMarketId());
}

export { MARKET_COOKIE, MARKET_GEO_HEADER } from "./config";
