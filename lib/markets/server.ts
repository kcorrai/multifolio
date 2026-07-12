// Sunucu tarafı pazar — GLOBAL-ONLY (tek pazar). Geo/cookie yok.
import { resolveMarket, getMarket, type Market, type MarketId } from "./config";

export async function getUserMarketId(): Promise<MarketId> {
  return resolveMarket();
}

export async function getUserMarket(): Promise<Market> {
  return getMarket(await getUserMarketId());
}
