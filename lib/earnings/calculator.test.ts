import { describe, it, expect } from "vitest";
import { computeNetEarnings, compareNetByPlatform, PLATFORM_FEE_DEFAULTS, TRANSFER_METHOD_DEFAULTS } from "./calculator";

describe("computeNetEarnings", () => {
  it("zinciri doğru hesaplar: komisyon → transfer → vergi → net", () => {
    // 1000 USD, Upwork %10 → 900; Payoneer %2 → 882; vergi %20 → 705.6
    const r = computeNetEarnings({
      gross: 1000,
      platformFeePct: PLATFORM_FEE_DEFAULTS.upwork,
      transferFeePct: TRANSFER_METHOD_DEFAULTS.payoneer.pct,
      transferFeeFixed: 0,
      taxPct: 20,
    });
    expect(r.platformFee).toBe(100);
    expect(r.afterPlatform).toBe(900);
    expect(r.transferFee).toBe(18);
    expect(r.afterTransfer).toBe(882);
    expect(r.tax).toBe(176.4);
    expect(r.net).toBe(705.6);
    expect(r.netPct).toBe(70.56);
    expect(r.netConverted).toBeNull();
  });

  it("sabit transfer ücretini ekler ve kur karşılığını hesaplar", () => {
    const r = computeNetEarnings({
      gross: 500,
      platformFeePct: 20,
      transferFeePct: 0,
      transferFeeFixed: 15,
      taxPct: 0,
      fxRate: 40,
    });
    expect(r.afterPlatform).toBe(400);
    expect(r.transferFee).toBe(15);
    expect(r.net).toBe(385);
    expect(r.netConverted).toBe(15400);
  });

  it("sıfır/negatif brüt ve taşkın yüzdelerde patlamaz", () => {
    const r = computeNetEarnings({ gross: -50, platformFeePct: 150, transferFeePct: -5, transferFeeFixed: -3, taxPct: 200 });
    expect(r.gross).toBe(0);
    expect(r.net).toBe(0);
    expect(r.netPct).toBe(0);
  });

  it("transfer kesintisi kalan tutarı aşamaz", () => {
    const r = computeNetEarnings({ gross: 10, platformFeePct: 0, transferFeePct: 0, transferFeeFixed: 50, taxPct: 0 });
    expect(r.transferFee).toBe(10);
    expect(r.net).toBe(0);
  });
});

describe("compareNetByPlatform", () => {
  const input = { gross: 1000, platformFeePct: 10, transferFeePct: 0, transferFeeFixed: 0, taxPct: 0 };

  it("komisyon alan platformları net'e göre azalan sıralar (custom hariç)", () => {
    const rows = compareNetByPlatform(input);
    expect(rows.map((r) => r.platform)).not.toContain("custom");
    // Upwork (%10) en düşük komisyon → en yüksek net → ilk sırada.
    expect(rows[0].platform).toBe("upwork");
    expect(rows[0].net).toBeGreaterThanOrEqual(rows[rows.length - 1].net);
  });

  it("her platform kendi VARSAYILAN komisyonunu kullanır (kullanıcı girdisini değil)", () => {
    const rows = compareNetByPlatform(input);
    const fiverr = rows.find((r) => r.platform === "fiverr")!;
    expect(fiverr.platformFeePct).toBe(PLATFORM_FEE_DEFAULTS.fiverr);
    expect(fiverr.net).toBe(1000 * (1 - PLATFORM_FEE_DEFAULTS.fiverr / 100));
  });
});
