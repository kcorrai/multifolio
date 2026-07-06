// Locale-farkında sayı ayrıştırma (SAF): kullanıcının girdiği para/yüzde metnini
// güvenle sayıya çevirir. TR'de "." binlik ayracı + "," ondalık; EN'de tersi.
// Örn TR "50.000" → 50000, "4,5" → 4.5; EN "50,000" → 50000, "4.5" → 4.5.
// Neden gerekli: naif replace(",",".") TR binliğini bozar ("50.000"→50); strip-all-dots
// ise EN ondalığını bozar ("10.5"→105). İkisi de yanlış — locale konvansiyonuna uy.
export function parseLocaleNumber(value: string, locale: string, fallback = 0): number {
  const s = (value ?? "").trim();
  if (!s) return fallback;
  const normalized = locale.startsWith("tr")
    ? s.replace(/[.\s]/g, "").replace(",", ".") // TR: binlik "." sil, ondalık "," → "."
    : s.replace(/[,\s]/g, ""); // EN: binlik "," sil, ondalık "." zaten doğru
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : fallback;
}
