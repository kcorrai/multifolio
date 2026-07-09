// SAF profil merge yardımcıları (platform bazlı birikim) — vitest'li.
// İçe aktarma save'inde profiles.portfolio / profiles.projects'i EZMEK yerine platform
// bazında birleştirir: Upwork + Fiverr projeleri BİRLİKTE kalır; aynı platform tekrar
// aktarılınca yalnız o platformun öğeleri yenilenir.

// Bir öğenin kaynak platformu (yoksa null). jsonb'den okunan öğe gevşek tiplenir.
export function itemPlatform(x: unknown): string | null {
  return x && typeof x === "object" && "platform" in x
    ? (((x as { platform?: unknown }).platform as string | null) ?? null)
    : null;
}

// MEVCUT öğelerden `src` platformuna ait olanları çıkar, gelen (yeni) öğeleri `src` ile
// etiketleyip BAŞA ekle (yeni içe aktarma önce görünür), `cap` ile sınırla.
export function mergeByPlatform<T extends object>(
  existing: unknown,
  incoming: T[],
  src: string | null,
  cap: number,
): (T & { platform: string | null })[] {
  const others = (Array.isArray(existing) ? existing : []).filter(
    (x) => itemPlatform(x) !== src,
  ) as (T & { platform: string | null })[];
  const tagged = incoming.map((x) => ({ ...x, platform: src }));
  return [...tagged, ...others].slice(0, cap);
}
