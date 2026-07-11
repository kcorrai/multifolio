import { describe, it, expect } from "vitest";
import { projectCashflow, STAGE_WEIGHTS } from "./cashflow";

describe("projectCashflow", () => {
  it("ağırlıklı beklenen = floor × aşama ağırlığı; potential = toplam face-value", () => {
    const r = projectCashflow([
      { status: "offer", budget: "$1,000" },      // 1000 × 0.8 = 800
      { status: "interview", budget: "500 USD" }, // 500 × 0.4 = 200
    ]);
    expect(r.potential).toBe(1500);
    expect(r.weighted).toBe(1000);
    expect(r.countedCount).toBe(2);
    expect(r.byStage.map((s) => s.status)).toEqual(["interview", "offer"]); // pipeline sırası
  });

  it("saved/rejected projeksiyon dışı", () => {
    const r = projectCashflow([
      { status: "saved", budget: "$5,000" },
      { status: "rejected", budget: "$5,000" },
    ]);
    expect(r.weighted).toBe(0);
    expect(r.potential).toBe(0);
    expect(r.countedCount).toBe(0);
  });

  it("saatlik bütçe toplama katılmaz, ayrı sayılır", () => {
    const r = projectCashflow([
      { status: "offer", budget: "Hourly $50/hr" },
      { status: "offer", budget: "$2000" },
    ]);
    expect(r.hourlyCount).toBe(1);
    expect(r.countedCount).toBe(1);
    expect(r.weighted).toBe(1600); // yalnız 2000 × 0.8
  });

  it("tutarı okunamayan/0 atlanır", () => {
    const r = projectCashflow([
      { status: "offer", budget: null },
      { status: "offer", budget: "TBD" },
      { status: "offer", budget: "$0" },
    ]);
    expect(r.countedCount).toBe(0);
    expect(r.weighted).toBe(0);
  });

  it("ağırlıklar beklenen sırada", () => {
    expect(STAGE_WEIGHTS.offer).toBeGreaterThan(STAGE_WEIGHTS.interview);
    expect(STAGE_WEIGHTS.interview).toBeGreaterThan(STAGE_WEIGHTS.awaiting_reply);
    expect(STAGE_WEIGHTS.saved).toBe(0);
  });
});
