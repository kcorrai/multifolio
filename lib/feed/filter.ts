// Saf feed filtre/arama yardımcıları (sunucu+istemci ortak, test edilebilir).
// job_pool.budget serbest metin ("$1,500-3,000") olduğundan bütçe filtresi
// best-effort: metindeki ilk sayıyı floor kabul eder.
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

export interface FeedCriteria {
  keywords: string[];
  min_budget: number | null;
  platform: string | null;
}

/** Serbest bütçe metninden ilk sayıyı (bin ayıracı dahil) çıkarır; yoksa null. */
export function extractBudgetFloor(text: string | null): number | null {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** Pool ilanı verilen feed kriterine uyuyor mu? Boş kriter = eşleşir. */
export function matchesFeed(pool: PoolJobRow, c: FeedCriteria): boolean {
  if (c.platform && pool.source !== c.platform) return false;

  if (c.min_budget != null) {
    const floor = extractBudgetFloor(pool.budget);
    if (floor != null && floor < c.min_budget) return false;
  }

  if (c.keywords.length > 0) {
    const hay = `${pool.title} ${pool.description} ${pool.skills.join(" ")}`.toLowerCase();
    const hit = c.keywords.some((k) => hay.includes(k.toLowerCase()));
    if (!hit) return false;
  }
  return true;
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
