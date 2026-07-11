import { describe, it, expect } from "vitest";
import { computeSuggestedRate, RATE_PLATFORM_DEFAULTS } from "./calculator";

describe("computeSuggestedRate", () => {
  it("net hedeften geriye doğru gereken brüt/saatlik ücreti hesaplar", () => {
    // net 3000 + gider 300 = 3300; komisyon %10 & vergi %20 → brüt = 3300/(0.9·0.8)=4583.33
    const r = computeSuggestedRate({
      targetNetMonthly: 3000,
      monthlyExpenses: 300,
      billableHoursPerWeek: 25,
      weeksOffPerYear: 6,
      taxPct: 20,
      platformFeePct: RATE_PLATFORM_DEFAULTS.upwork,
    });
    expect(r.feasible).toBe(true);
    expect(r.workingWeeks).toBe(46);
    expect(r.annualBillableHours).toBe(1150);
    expect(r.monthlyBillableHours).toBeCloseTo(95.83, 2);
    expect(r.requiredMonthlyGross).toBeCloseTo(4583.33, 1);
    // brüt·(1−fee)·(1−tax) − gider ≈ net
    expect(r.requiredMonthlyGross * 0.9 * 0.8 - r.expenses).toBeCloseTo(3000, 0);
    expect(r.requiredHourlyRate).toBeCloseTo(47.83, 1);
    expect(r.requiredDayRate).toBeCloseTo(r.requiredHourlyRate * 8, 2);
  });

  it("komisyon yoksa (doğrudan müşteri) brüt yalnız vergi+gideri telafi eder", () => {
    const r = computeSuggestedRate({
      targetNetMonthly: 2000,
      monthlyExpenses: 0,
      billableHoursPerWeek: 20,
      weeksOffPerYear: 0,
      taxPct: 0,
      platformFeePct: RATE_PLATFORM_DEFAULTS.direct,
    });
    expect(r.platformFee).toBe(0);
    expect(r.tax).toBe(0);
    expect(r.requiredMonthlyGross).toBe(2000);
  });

  it("saat 0 veya komisyon/vergi %100 ise feasible=false, patlamaz", () => {
    const noHours = computeSuggestedRate({
      targetNetMonthly: 3000, monthlyExpenses: 0, billableHoursPerWeek: 0,
      weeksOffPerYear: 0, taxPct: 20, platformFeePct: 10,
    });
    expect(noHours.feasible).toBe(false);
    expect(noHours.requiredHourlyRate).toBe(0);

    const fullFee = computeSuggestedRate({
      targetNetMonthly: 3000, monthlyExpenses: 0, billableHoursPerWeek: 25,
      weeksOffPerYear: 0, taxPct: 0, platformFeePct: 100,
    });
    expect(fullFee.feasible).toBe(false);
  });

  it("negatif/taşkın girdilerde güvenli sınırlanır", () => {
    const r = computeSuggestedRate({
      targetNetMonthly: -100, monthlyExpenses: -50, billableHoursPerWeek: -5,
      weeksOffPerYear: 99, taxPct: -10, platformFeePct: 200,
    });
    expect(r.workingWeeks).toBe(1); // weeksOff 51 cap
    expect(r.feasible).toBe(false);
  });
});
