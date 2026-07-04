import { describe, it, expect } from "vitest";
import { ANALYSIS_WEIGHTS, ANALYSIS_KEYS, computeAnalysisScore, analysisVerdict } from "./score";

function dims(scores: [number, number, number, number]) {
  return {
    headline_impact: { score: scores[0] },
    summary_quality: { score: scores[1] },
    skills_coverage: { score: scores[2] },
    trust_signals: { score: scores[3] },
  };
}

describe("ANALYSIS_WEIGHTS", () => {
  it("ağırlıkların toplamı 1'dir", () => {
    const total = ANALYSIS_KEYS.reduce((s, k) => s + ANALYSIS_WEIGHTS[k], 0);
    expect(total).toBeCloseTo(1);
  });
});

describe("computeAnalysisScore", () => {
  it("ağırlıklı toplamı yuvarlayarak döndürür", () => {
    // 80*.3 + 70*.3 + 60*.25 + 40*.15 = 24+21+15+6 = 66
    expect(computeAnalysisScore(dims([80, 70, 60, 40]))).toBe(66);
  });
  it("uç değerler: hepsi 0 → 0, hepsi 100 → 100", () => {
    expect(computeAnalysisScore(dims([0, 0, 0, 0]))).toBe(0);
    expect(computeAnalysisScore(dims([100, 100, 100, 100]))).toBe(100);
  });
});

describe("analysisVerdict", () => {
  it("eşikler: ≥75 strong, ≥50 average, <50 weak", () => {
    expect(analysisVerdict(75)).toBe("strong");
    expect(analysisVerdict(74)).toBe("average");
    expect(analysisVerdict(50)).toBe("average");
    expect(analysisVerdict(49)).toBe("weak");
  });
});
