import type { Locale } from "./detect";
import { marketDefaultLocale } from "@/lib/markets/config";
import { getUserMarketId } from "@/lib/markets/server";

// UI dili TAMAMEN konumdan (pazardan) türer — manuel dil seçimi/override YOK.
// TR'den bağlanan → tr, başka her yer → en (pazarın varsayılan dili).
export async function getUserLocale(): Promise<Locale> {
  return marketDefaultLocale(await getUserMarketId());
}
