// Saf yardımcı — AI çıktı dili direktifi. Global-only: her şey İngilizce.
// (İmzalar korunur; çağıranlar Locale geçmeye devam eder ama tek değer "en".)
import type { Locale } from "@/i18n/detect";

export function languageDirective(_locale: Locale): string {
  return "\nIMPORTANT: Write all output (text and all fields) in English.";
}

// Teklif: müşteriye giden 'content' ve okuyucunun coverage notları — hepsi İngilizce.
export function proposalLanguageDirective(_contentLang: Locale, _noteLocale: Locale): string {
  return "\nIMPORTANT: Write the 'content' field and all 'coverage' notes in English.";
}
