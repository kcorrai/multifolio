import type { Locale } from "./detect";

// Global-only: UI dili her zaman İngilizce.
export async function getUserLocale(): Promise<Locale> {
  return "en";
}
