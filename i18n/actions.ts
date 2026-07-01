"use server";
import { cookies } from "next/headers";
import type { Locale } from "./detect";
import { LOCALE_COOKIE } from "./locale";

// Dil seçimini cookie'ye yazar (1 yıl). Client'tan server action olarak çağrılır.
export async function setUserLocale(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
