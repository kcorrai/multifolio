// SAF feed gücü metriği (AI/kredi YOK, test'li). Kullanıcının seçili feed'inin
// gösterdiği ilanların profiline ne kadar uyduğunu ölçer + keyword önerir. Girdi
// zaten sunucuda zenginleştirilmiş PoolJob[] (relevance + skillGap dolu) → yeniden
// hesap yok, ek fetch yok. UI: components/dashboard/feed-settings-panel.tsx.
import type { PoolJob } from "@/lib/validation/schemas/feed";
import { RELEVANCE_HIDE_BELOW } from "./relevance";

export interface FeedStrength {
  matchedCount: number;
  // Gösterilen ilanların ortalama alaka skoru (0-100); profil sinyali yoksa null.
  avgRelevance: number | null;
  // Alaka eşiğini geçen ilanların oranı (feed "precision"); sinyal yoksa null.
  precisionPct: number | null;
  // Öneri: matched ilanlarda sık geçen + profilin KARŞILADIĞI beceriler, henüz feed
  // keyword'ü değil → keyword eklersen feed'i güçlü yönüne daraltırsın (en çok 5).
  suggestAdd: string[];
}

export function feedStrength(jobs: PoolJob[], keywords: string[]): FeedStrength {
  const matchedCount = jobs.length;
  const rel = jobs.map((j) => j.relevance).filter((r): r is number => r !== null);
  const avgRelevance = rel.length ? Math.round(rel.reduce((a, b) => a + b, 0) / rel.length) : null;
  const precisionPct = rel.length
    ? Math.round((rel.filter((r) => r >= RELEVANCE_HIDE_BELOW).length / rel.length) * 100)
    : null;

  const kwLower = new Set(keywords.map((k) => k.trim().toLowerCase()));
  const freq = new Map<string, number>();
  for (const j of jobs) {
    for (const s of j.skillGap?.matched ?? []) {
      const key = s.trim();
      if (!key || kwLower.has(key.toLowerCase())) continue;
      freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  const suggestAdd = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s]) => s);

  return { matchedCount, avgRelevance, precisionPct, suggestAdd };
}
