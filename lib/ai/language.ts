// Saf yardımcı — AI çıktı dilini locale'e göre yönlendiren prompt direktifi.
// server-only DEĞİL; test edilebilir.
import type { Locale } from "@/i18n/detect";

// Üretim prompt'una eklenir; modelin çıktıyı hangi dilde yazacağını belirler.
export function languageDirective(locale: Locale): string {
  return locale === "tr"
    ? "\nÖNEMLİ: Tüm çıktıyı (metin ve tüm alanlar) Türkçe yaz."
    : "\nIMPORTANT: Write all output (text and all fields) in English.";
}
