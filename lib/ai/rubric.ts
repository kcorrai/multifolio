// Saf rubrik yardımcıları: ağırlıklı toplam skor + karar eşikleri.
// Bilerek "server-only" DEĞİL — UI rubrik ağırlıklarını göstermek için de import eder.
import type { JobMatchRubric, MatchVerdict, RubricKey } from "@/lib/validation/schemas/job";
import { RUBRIC_KEYS } from "@/lib/validation/schemas/job";

// Toplam skor = ağırlıklı rubrik toplamı (şeffaflık: AI'nın "kafasına göre" tek
// sayı vermesi yerine boyut skorlarından deterministik hesaplanır).
export const RUBRIC_WEIGHTS: Record<RubricKey, number> = {
  skill_fit: 0.4,
  experience_fit: 0.3,
  budget_fit: 0.2,
  listing_quality: 0.1,
};

export function computeRubricScore(rubric: JobMatchRubric): number {
  const total = RUBRIC_KEYS.reduce((sum, key) => sum + rubric[key].score * RUBRIC_WEIGHTS[key], 0);
  return Math.min(100, Math.max(0, Math.round(total)));
}

// Eşikler UI'daki skor renkleriyle hizalı (≥70 yeşil, ≥40 amber, <40 kırmızı).
export function rubricVerdict(score: number): MatchVerdict {
  if (score >= 70) return "go";
  if (score >= 40) return "maybe";
  return "skip";
}
