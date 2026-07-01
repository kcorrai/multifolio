import { cookies, headers } from "next/headers";
import { resolveLocale, type Locale } from "./detect";

const COOKIE = "NEXT_LOCALE";

// Sunucu tarafı locale: cookie öncelikli, yoksa Accept-Language'den algılanır.
export async function getUserLocale(): Promise<Locale> {
  const [store, hdrs] = await Promise.all([cookies(), headers()]);
  return resolveLocale(store.get(COOKIE)?.value, hdrs.get("accept-language"));
}

export const LOCALE_COOKIE = COOKIE;
