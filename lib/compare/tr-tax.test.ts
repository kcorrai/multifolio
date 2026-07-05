import { describe, it, expect } from "vitest";
import { assessTrTax, estimateTrTaxBase, TR_TAX_RATES } from "./tr-tax";

const YES = { foreignClients: true, professionInScope: true, invoicesFromTurkey: true, youngFirstTime: true };

describe("assessTrTax — uygunluk", () => {
  it("üç şart tam → hizmet ihracı likely", () => {
    expect(assessTrTax(YES).hizmetIhraci).toBe("likely");
  });
  it("bir şart eksik → hizmet ihracı no", () => {
    expect(assessTrTax({ ...YES, invoicesFromTurkey: false }).hizmetIhraci).toBe("no");
  });
  it("yaş+ilk kez → genç girişimci likely; değilse no", () => {
    expect(assessTrTax(YES).gencGirisimci).toBe("likely");
    expect(assessTrTax({ ...YES, youngFirstTime: false }).gencGirisimci).toBe("no");
  });
});

describe("estimateTrTaxBase — kaba matrah indirimi", () => {
  const res = assessTrTax(YES);

  it("2026: genç girişimci (₺400k) SONRA %100 → kalan matrah 0", () => {
    const e = estimateTrTaxBase(1_000_000, TR_TAX_RATES[2026], res);
    expect(e.gencGirisimciExempt).toBe(400_000);
    expect(e.afterGenc).toBe(600_000);
    expect(e.hizmetIhraciDeduction).toBe(600_000); // %100
    expect(e.remainingBase).toBe(0);
    expect(e.shieldedPct).toBe(100);
  });

  it("2025: genç girişimci (₺330k) SONRA %80 indirim", () => {
    const e = estimateTrTaxBase(1_000_000, TR_TAX_RATES[2025], res);
    expect(e.gencGirisimciExempt).toBe(330_000);
    expect(e.afterGenc).toBe(670_000);
    expect(e.hizmetIhraciDeduction).toBe(536_000); // 670k * %80
    expect(e.remainingBase).toBe(134_000);
  });

  it("hiçbir avantaj yoksa matrah = gelir", () => {
    const none = assessTrTax({ foreignClients: false, professionInScope: false, invoicesFromTurkey: false, youngFirstTime: false });
    const e = estimateTrTaxBase(500_000, TR_TAX_RATES[2026], none);
    expect(e.remainingBase).toBe(500_000);
    expect(e.shieldedPct).toBe(0);
  });

  it("gelir tavanın altındaysa genç girişimci istisnası = gelir", () => {
    const e = estimateTrTaxBase(200_000, TR_TAX_RATES[2026], res);
    expect(e.gencGirisimciExempt).toBe(200_000);
    expect(e.remainingBase).toBe(0);
  });
});
