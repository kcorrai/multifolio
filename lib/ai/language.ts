// Saf yardımcı — AI çıktı dilini locale'e göre yönlendiren prompt direktifi.
// server-only DEĞİL; test edilebilir.
import type { Locale } from "@/i18n/detect";

// Üretim prompt'una eklenir; modelin çıktıyı hangi dilde yazacağını belirler.
export function languageDirective(locale: Locale): string {
  return locale === "tr"
    ? "\nÖNEMLİ: Tüm çıktıyı (metin ve tüm alanlar) Türkçe yaz."
    : "\nIMPORTANT: Write all output (text and all fields) in English.";
}

const LANG_NAME: Record<Locale, string> = { en: "İngilizce", tr: "Türkçe" };

// Teklif direktifi: müşteriye giden 'content' PLATFORM dilinde, kullanıcının
// okuduğu coverage notları UI dilinde (TR kullanıcı Upwork için EN teklif alır
// ama değerlendirmeyi kendi dilinde okur).
export function proposalLanguageDirective(contentLang: Locale, noteLocale: Locale): string {
  return (
    `\nÖNEMLİ: 'content' alanını ${LANG_NAME[contentLang]} yaz — teklifin gönderileceği platformun dili budur. ` +
    `'coverage' içindeki note alanlarını ${LANG_NAME[noteLocale]} yaz.`
  );
}
