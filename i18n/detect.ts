// Saf locale çözümü — test edilebilir, next/headers'a bağımlı DEĞİL.
export type Locale = "en" | "tr";
export const locales: readonly Locale[] = ["en", "tr"] as const;
export const defaultLocale: Locale = "en";

function isLocale(v: string | undefined): v is Locale {
  return v === "en" || v === "tr";
}

// Öncelik: geçerli cookie → Accept-Language (tr* ise tr) → varsayılan.
export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  if ((acceptLanguage ?? "").toLowerCase().startsWith("tr")) return "tr";
  return defaultLocale;
}
