import { describe, it, expect } from "vitest";
import { computeArmutRoi } from "./roi";

describe("computeArmutRoi", () => {
  it("kârlı senaryo: yüksek olasılık + değerli proje", () => {
    const r = computeArmutRoi({ leadFee: 190, projectValue: 3000, winProbPct: 30 });
    expect(r.expectedValue).toBe(710); // 0.3*3000 - 190
    expect(r.worthBidding).toBe(true);
    expect(r.breakEvenProbPct).toBe(6); // 190/3000 = 6.3 → 6
  });

  it("zararlı senaryo: düşük olasılık + küçük proje", () => {
    const r = computeArmutRoi({ leadFee: 190, projectValue: 500, winProbPct: 20 });
    expect(r.expectedValue).toBe(-90); // 0.2*500 - 190 = 100 - 190
    expect(r.worthBidding).toBe(false);
    expect(r.breakEvenProbPct).toBe(38); // 190/500
  });

  it("break-even eşiği tam sınırda: worthBidding = false (EV=0 kâr değil)", () => {
    // p = break-even → EV ≈ 0
    const r = computeArmutRoi({ leadFee: 100, projectValue: 1000, winProbPct: 10 });
    expect(r.expectedValue).toBe(0); // 0.1*1000 - 100
    expect(r.worthBidding).toBe(false);
    expect(r.breakEvenProbPct).toBe(10);
  });

  it("proje değeri 0 → asla kârlı, eşik %100", () => {
    const r = computeArmutRoi({ leadFee: 190, projectValue: 0, winProbPct: 50 });
    expect(r.worthBidding).toBe(false);
    expect(r.breakEvenProbPct).toBe(100);
    expect(r.expectedValue).toBe(-190);
  });

  it("negatif/taşan girdiler kırpılır", () => {
    const r = computeArmutRoi({ leadFee: -50, projectValue: 1000, winProbPct: 150 });
    expect(r.expectedValue).toBe(1000); // leadFee 0, p 100% → 1000
  });
});
