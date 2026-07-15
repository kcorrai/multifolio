import { describe, it, expect } from "vitest";
import { computeRoi, ROI_DEFAULTS } from "./calculator";

describe("computeRoi", () => {
  it("varsayılan girdilerde tutarlı ROI hesaplar", () => {
    const r = computeRoi({ ...ROI_DEFAULTS });
    // 20 teklif × 12 connect = 240 connect; × $0.15 = $36 maliyet
    expect(r.connectsSpent).toBe(240);
    expect(r.totalConnectCost).toBe(36);
    // 20 × %5 = 1 kazanç; × $500 = $500 gelir
    expect(r.wins).toBe(1);
    expect(r.revenue).toBe(500);
    expect(r.netGain).toBe(464);
    expect(r.roiMultiple).toBeCloseTo(13.89, 1);
    expect(r.connectsPerWin).toBe(240);
    expect(r.costPerWin).toBe(36);
    expect(r.feasible).toBe(true);
  });

  it("başabaş kazanma oranını doğru hesaplar", () => {
    // cost / (proposals·projectValue) = 36 / (20·500) = 0.36%
    const r = computeRoi({ ...ROI_DEFAULTS });
    expect(r.breakEvenWinRatePct).toBeCloseTo(0.36, 2);
  });

  it("zararda net negatiftir", () => {
    // pahalı connect, düşük kazanç: 100 teklif × 16 connect × $1 = $1600; kazanç 100×1%=1 × $200 = $200
    const r = computeRoi({
      proposalsSent: 100, connectsPerProposal: 16, costPerConnect: 1,
      winRatePct: 1, avgProjectValue: 200,
    });
    expect(r.revenue).toBe(200);
    expect(r.totalConnectCost).toBe(1600);
    expect(r.netGain).toBe(-1400);
    expect(r.roiMultiple).toBeLessThan(1);
  });

  it("geçersiz girdide feasible=false, sıfıra bölme yok", () => {
    expect(computeRoi({ ...ROI_DEFAULTS, proposalsSent: 0 }).feasible).toBe(false);
    expect(computeRoi({ ...ROI_DEFAULTS, avgProjectValue: 0 }).feasible).toBe(false);
    const zero = computeRoi({ ...ROI_DEFAULTS, connectsPerProposal: 0 });
    expect(zero.feasible).toBe(false);
    expect(Number.isNaN(zero.roiMultiple)).toBe(false);
  });

  it("kazanma oranı 0 iken kazanç başına metrikler patlamaz", () => {
    const r = computeRoi({ ...ROI_DEFAULTS, winRatePct: 0 });
    expect(r.wins).toBe(0);
    expect(r.connectsPerWin).toBe(0);
    expect(r.costPerWin).toBe(0);
    expect(r.feasible).toBe(true);
  });
});
