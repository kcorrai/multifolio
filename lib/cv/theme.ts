// CV tema sistemi (SAF): şablon + vurgu rengi. PDF (lib/cv/pdf.tsx) ve panel canlı
// önizleme (components/dashboard/cv-preview.tsx) AYNI sabitleri kullanır (DRY).
// Görsel olarak zengin şablonlar (resume-builder tarzı): renkli kenar çubuğu / üst
// banner / monogram avatar / temiz tek sütun. "clean" en ATS-güvenli olandır.

export const CV_TEMPLATES = ["sidebar", "banner", "monogram", "clean"] as const;
export type CvTemplate = (typeof CV_TEMPLATES)[number];

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
