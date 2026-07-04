// Saf feed filtre/arama yardımcıları (sunucu+istemci ortak, test edilebilir).
// job_pool.budget serbest metin ("$1,500-3,000", "Hourly $40-70") olduğundan
// bütçe filtreleri best-effort çalışır: metindeki ilk sayı floor kabul edilir,
// "hourly" ipucu varsa saatlik sayılır. Veri yoksa (null) filtre ilanı ELEMEZ.
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

export interface FeedCriteria {
  keywords: string[];
  exclude_keywords?: string[];
  min_budget: number | null;
  platform: string | null;
  exclude_countries?: string[];
  min_hourly_rate?: number | null;
  min_fixed_price?: number | null;
  min_client_spent?: number | null;
  min_score?: number | null;
}

/** DB feed satırını matchesFeed kriterine çevirir. */
export function feedCriteria(f: JobFeedRow): FeedCriteria {
  return {
    keywords: f.keywords,
    exclude_keywords: f.exclude_keywords ?? [],
    min_budget: f.min_budget,
    platform: f.platform,
    exclude_countries: f.exclude_countries ?? [],
    min_hourly_rate: f.min_hourly_rate,
    min_fixed_price: f.min_fixed_price,
    min_client_spent: f.min_client_spent,
    min_score: f.min_score,
  };
}

/** Serbest bütçe metninden ilk sayıyı (bin ayıracı dahil) çıkarır; yoksa null. */
export function extractBudgetFloor(text: string | null): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** Bütçe metni saatlik mi? ("Hourly", "/hr", "per hour" ipuçları) */
export function isHourlyBudget(text: string | null): boolean {
  if (!text) return false;
  return /hourly|\/\s*hr\b|per\s+hour|saatlik/i.test(text);
}

/** Pool ilanı verilen feed kriterine uyuyor mu? Boş kriter = eşleşir.
 *  score: kullanıcının bu ilan için CACHE'Lİ AI skoru (yoksa null — elenmez;
 *  otomatik skorlama yapılmaz, kredi ekonomisi korunur). */
export function matchesFeed(pool: PoolJobRow, c: FeedCriteria, score: number | null = null): boolean {
  if (c.platform && pool.source !== c.platform) return false;

  if (c.exclude_countries && c.exclude_countries.length > 0 && pool.client_country) {
    const country = pool.client_country.toLowerCase();
    if (c.exclude_countries.some((x) => x.toLowerCase() === country)) return false;
  }

  const floor = extractBudgetFloor(pool.budget);
  const hourly = isHourlyBudget(pool.budget);

  if (c.min_budget != null && floor != null && floor < c.min_budget) return false;
  if (c.min_hourly_rate != null && hourly && floor != null && floor < c.min_hourly_rate) return false;
  if (c.min_fixed_price != null && !hourly && floor != null && floor < c.min_fixed_price) return false;

  if (c.min_client_spent != null && pool.client_spent != null && pool.client_spent < c.min_client_spent) return false;

  if (c.min_score != null && c.min_score > 0 && score != null && score < c.min_score) return false;

  if (c.keywords.length > 0 || (c.exclude_keywords && c.exclude_keywords.length > 0)) {
    // Çevrilmiş başlıklar da aranır: İngilizce keyword Almanca ilanı yakalasın.
    const hay = `${pool.title} ${pool.title_en ?? ""} ${pool.title_tr ?? ""} ${pool.description} ${pool.skills.join(" ")}`.toLowerCase();
    if (c.exclude_keywords && c.exclude_keywords.some((k) => hay.includes(k.toLowerCase()))) return false;
    if (c.keywords.length > 0 && !c.keywords.some((k) => hay.includes(k.toLowerCase()))) return false;
  }
  return true;
}

/** UI locale'ine göre gösterilecek başlık; çeviri yoksa orijinale düşer. */
export function poolJobTitle(
  pool: Pick<PoolJobRow, "title" | "title_en" | "title_tr" | "lang">,
  locale: string,
): string {
  if (pool.lang === locale) return pool.title;
  const translated = locale === "tr" ? pool.title_tr : pool.title_en;
  return translated && translated.trim() ? translated : pool.title;
}

export interface SearchQuery {
  q?: string;
  platform?: string;
  minBudget?: number;
}

/** Pool listesini anlık arama kriterine göre filtreler (saf). */
export function searchPool(rows: PoolJobRow[], query: SearchQuery): PoolJobRow[] {
  return rows.filter((row) =>
    matchesFeed(row, {
      keywords: query.q ? [query.q] : [],
      min_budget: query.minBudget ?? null,
      platform: query.platform ?? null,
    }),
  );
}
