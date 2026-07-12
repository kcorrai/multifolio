// Sunucu tarafı pazar çözümü: TAMAMEN Vercel geo header (x-vercel-ip-country) +
// Accept-Language'den. Manuel seçim/cookie YOK — kullanıcı nereden bağlanıyorsa o.
import { headers } from "next/headers";
import { resolveMarket, getMarket, MARKET_GEO_HEADER, type Market, type MarketId } from "./config";

export async function getUserMarketId(): Promise<MarketId> {
  const hdrs = await headers();
  return resolveMarket(hdrs.get(MARKET_GEO_HEADER), hdrs.get("accept-language"));
}

export async function getUserMarket(): Promise<Market> {
  return getMarket(await getUserMarketId());
}

export { MARKET_GEO_HEADER } from "./config";
