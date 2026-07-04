// Saf profil analiz skoru: ağırlıklı boyut toplamı + karar eşikleri.
// lib/ai/rubric.ts deseni — o dosya İŞ-EŞLEŞTİRME rubriği, bu dosya kayıtsız
// PROFİL analizi; bilerek ayrı tutulur. Client da import edebilir (ağırlık gösterimi).

export type AnalysisDimensionKey =
  | "headline_impact"
  | "summary_quality"
  | "skills_coverage"
  | "trust_signals";

export const ANALYSIS_KEYS: AnalysisDimensionKey[] = [
  "headline_impact",
  "summary_quality",
  "skills_coverage",
  "trust_signals",
];

export const ANALYSIS_WEIGHTS: Record<AnalysisDimensionKey, number> = {
  headline_impact: 0.3,
  summary_quality: 0.3,
  skills_coverage: 0.25,
  trust_signals: 0.15,
};

export function computeAnalysisScore(dims: Record<AnalysisDimensionKey, { score: number }>): number {
  const total = ANALYSIS_KEYS.reduce((sum, key) => sum + dims[key].score * ANALYSIS_WEIGHTS[key], 0);
  return Math.min(100, Math.max(0, Math.round(total)));
}

export type AnalysisVerdict = "strong" | "average" | "weak";

export function analysisVerdict(score: number): AnalysisVerdict {
  if (score >= 75) return "strong";
  if (score >= 50) return "average";
  return "weak";
}
