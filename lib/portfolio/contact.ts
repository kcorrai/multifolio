// SAF portfolyo iletişim doğrulama (AI/I/O yok, test'li). Public portfolyo sayfası
// (app/p/[slug]) ve PDF (lib/portfolio/pdf.tsx) İLETİŞİM CTA'sının href'ini tek yerden
// doğrular — önceden iki dosyada aynı regex vardı ama biri null biri "" döndürüp
// tutarsızdı. Editörde serbest yazılan değer render'da yalnız geçerli e-posta / http(s)
// href'e dönüşür (aksi halde CTA gizlenir).

/** Geçerli e-posta ise trim'lenmiş adresi, değilse null döner. */
export function validateContactEmail(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

/** Geçerli http(s) URL ise trim'lenmiş adresi, değilse null döner. */
export function validateContactUrl(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  return /^https?:\/\//i.test(s) ? s : null;
}
