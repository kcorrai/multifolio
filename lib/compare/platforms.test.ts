import { describe, it, expect } from "vitest";
import { comparePlatforms, COMPARE_FEES } from "./platforms";

describe("comparePlatforms", () => {
  const base = { gross: 1000, transferFeePct: 0, transferFeeFixed: 0, taxPct: 0 };

  it("tüm platformları döner, net DESC sıralı", () => {
    const rows = comparePlatforms(base);
    expect(rows).toHaveLength(4);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].net).toBeGreaterThanOrEqual(rows[i].net);
    }
  });

  it("direct (komisyonsuz) en üstte, en yüksek net", () => {
    const rows = comparePlatforms(base);
    expect(rows[0].platform).toBe("direct");
    expect(rows[0].net).toBe(1000);
    expect(rows[0].netPct).toBe(100);
  });

  it("komisyon farkı nete yansır (upwork %10 > fiverr %20)", () => {
    const rows = comparePlatforms(base);
    const upwork = rows.find((r) => r.platform === "upwork")!;
    const fiverr = rows.find((r) => r.platform === "fiverr")!;
    expect(upwork.net).toBe(900);
    expect(fiverr.net).toBe(800);
    expect(upwork.net).toBeGreaterThan(fiverr.net);
  });

  it("transfer + vergi tüm platformlara eşit uygulanır", () => {
    const rows = comparePlatforms({ gross: 1000, transferFeePct: 0, transferFeeFixed: 0, taxPct: 20 });
    // direct: 1000 → vergi %20 → 800
    expect(rows.find((r) => r.platform === "direct")!.net).toBe(800);
    // upwork: 900 → vergi %20 → 720
    expect(rows.find((r) => r.platform === "upwork")!.net).toBe(720);
  });

  it("COMPARE_FEES sabitleri beklenen değerlerde", () => {
    expect(COMPARE_FEES).toEqual({ direct: 0, upwork: 10, fiverr: 20, bionluk: 20 });
  });
});
