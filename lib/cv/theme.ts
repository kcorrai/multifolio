// CV tema sistemi (SAF): şablon + vurgu rengi. PDF (lib/cv/pdf.tsx) ve panel canlı
// önizleme (components/dashboard/cv-preview.tsx) AYNI sabitleri kullanır (DRY).
// Görsel olarak zengin şablonlar (resume-builder tarzı): renkli kenar çubuğu / üst
// banner / monogram avatar / temiz tek sütun. "clean" en ATS-güvenli olandır.

// Tek-sütun ATS-güvenli şablonlar (önce) + görsel çok-sütun şablonlar (sonra).
// Tek sütunlular ATS ayrıştırıcı-dostu (standart başlık, seçilebilir metin, tablo/
// grafik yok); yalnız tipografi/hizalama/başlık-stili/vurgu ile ayrışır.
export const CV_TEMPLATES = [
  "clean", "classic", "minimal", "modern", "compact",
  "sidebar", "banner", "monogram",
] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];

// Tek-sütun ATS şablonlarının stil parametreleri (PDF + HTML önizleme AYNI config'i
// okur → tek render yolu, birçok ATS varyantı). Görsel şablonlar bu haritada YOK.
export type CvHeadingDecoration = "underline" | "leftbar" | "plain";
export interface CvSingleColumnStyle {
  headerAlign: "left" | "center"; // ad/iletişim bloğu hizası
  accentHeadings: boolean;        // bölüm başlığı vurgu renginde mi (yoksa siyah)
  headingDecoration: CvHeadingDecoration;
  nameAccent: boolean;            // ad vurgu renginde mi (yoksa siyah)
  namePt: number;                 // PDF ad punto boyutu
  padV: number;                   // PDF sayfa dikey iç boşluk
  padH: number;                   // PDF sayfa yatay iç boşluk
}

export const CV_SINGLE_COLUMN: Record<string, CvSingleColumnStyle> = {
  clean:   { headerAlign: "center", accentHeadings: true,  headingDecoration: "underline", nameAccent: true,  namePt: 21, padV: 42, padH: 48 },
  classic: { headerAlign: "center", accentHeadings: false, headingDecoration: "underline", nameAccent: false, namePt: 22, padV: 42, padH: 48 },
  minimal: { headerAlign: "left",   accentHeadings: false, headingDecoration: "plain",     nameAccent: false, namePt: 20, padV: 44, padH: 50 },
  modern:  { headerAlign: "left",   accentHeadings: true,  headingDecoration: "leftbar",   nameAccent: true,  namePt: 21, padV: 40, padH: 46 },
  compact: { headerAlign: "left",   accentHeadings: true,  headingDecoration: "leftbar",   nameAccent: false, namePt: 18, padV: 30, padH: 40 },
};

export function isSingleColumn(tpl: string): boolean {
  return tpl in CV_SINGLE_COLUMN;
}

// ATS-güvenli = tek-sütun set (standart başlık, tek sütun, seçilebilir metin).
export function isAtsSafe(tpl: string): boolean {
  return isSingleColumn(tpl);
}

export const CV_ACCENTS = ["navy", "blue", "violet", "emerald", "rose", "amber"] as const;
export type CvAccent = (typeof CV_ACCENTS)[number];

// Ana vurgu HEX'i (kenar çubuğu/banner arka planı + başlıklar). Beyaz metinle AA kontrast.
export const CV_ACCENT_HEX: Record<CvAccent, string> = {
  navy: "#1E293B",
  blue: "#2563EB",
  violet: "#7C3AED",
  emerald: "#059669",
  rose: "#E11D48",
  amber: "#B45309",
};

// Açık ton (monogram kenar çubuğu / avatar zemini gibi hafif alanlar için).
export const CV_ACCENT_TINT: Record<CvAccent, string> = {
  navy: "#EEF2F7",
  blue: "#EFF6FF",
  violet: "#F5F3FF",
  emerald: "#ECFDF5",
  rose: "#FFF1F2",
  amber: "#FFFBEB",
};

// Ad soyaddan monogram baş harfleri (en çok 2).
export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
