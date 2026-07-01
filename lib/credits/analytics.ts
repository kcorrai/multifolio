// Kredi tüketimini usage_events satırlarından toplayan saf fonksiyon.
// Hem analitik sayfası hem (kullanılırsa) /api/analytics tek kaynak kullanır.
export interface UsageRow {
  kind: string;
  credits_spent: number | null;
  created_at: string;
}

export interface CreditAnalytics {
  totalCredits: number;
  totalCount: number;
  byKind: Record<string, { count: number; credits: number }>;
  dailySeries: { date: string; credits: number }[];
}

export function aggregateCreditUsage(rows: UsageRow[], now: number): CreditAnalytics {
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  const byKind: Record<string, { count: number; credits: number }> = {};
  const daily: Record<string, number> = {};
  let totalCredits = 0;

  for (const r of rows) {
    const credits = Number(r.credits_spent ?? 0);
    totalCredits += credits;

    byKind[r.kind] ??= { count: 0, credits: 0 };
    byKind[r.kind].count += 1;
    byKind[r.kind].credits += credits;

    if (new Date(r.created_at).getTime() >= cutoff) {
      const day = r.created_at.slice(0, 10);
      daily[day] = (daily[day] ?? 0) + credits;
    }
  }

  const dailySeries = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, credits]) => ({ date, credits }));

  return { totalCredits, totalCount: rows.length, byKind, dailySeries };
}
