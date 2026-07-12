// Pazarın sunduğu platformların locale'e uygun metin listesi ("A, B and C" / "A, B ve C").
// Landing/araç kopyalarında hardcoded "Bionluk and Armut" yerine market'ten doldurulur.
import { PLATFORMS } from "@/lib/ai/platforms";
import { marketPlatforms, type MarketId } from "./config";

// locale: BCP-47 dil etiketi (next-intl `getLocale()` string döner) — Intl.ListFormat kabul eder.
export function platformListText(marketId: MarketId, locale: string): string {
  const labels = marketPlatforms(marketId).map((id) => PLATFORMS[id].label);
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(labels);
}
