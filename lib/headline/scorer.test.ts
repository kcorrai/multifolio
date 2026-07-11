import { describe, it, expect } from "vitest";
import { scoreHeadline } from "./scorer";

describe("scoreHeadline", () => {
  it("güçlü başlık: spesifik rol + sonuç + iyi uzunluk + klişesiz → yüksek", () => {
    const r = scoreHeadline("React developer helping SaaS teams ship faster");
    expect(r.checks.find((c) => c.id === "role")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "outcome")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "length")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "noBuzzwords")!.passed).toBe(true);
    expect(r.score).toBe(100);
    expect(r.verdict).toBe("strong");
  });

  it("klişe + rol yok → düşük skor", () => {
    const r = scoreHeadline("Passionate freelancer and creative ninja");
    expect(r.buzzwordsFound.length).toBeGreaterThan(0);
    expect(r.checks.find((c) => c.id === "noBuzzwords")!.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "role")!.passed).toBe(false);
    expect(r.verdict).toBe("weak");
  });

  it("TR: rol + sonuç tanınır, klişe yakalanır", () => {
    const strong = scoreHeadline("SaaS ekiplerinin daha hızlı yayına almasına yardım eden React geliştirici");
    expect(strong.checks.find((c) => c.id === "role")!.passed).toBe(true);
    expect(strong.checks.find((c) => c.id === "outcome")!.passed).toBe(true);

    const weak = scoreHeadline("Tutkulu ve çalışkan freelancer");
    expect(weak.buzzwordsFound.length).toBeGreaterThan(0);
  });

  it("boş/çok kısa metin skor düşük, patlamaz", () => {
    expect(scoreHeadline("").score).toBe(0);
    expect(scoreHeadline("hi").charCount).toBe(2);
  });
});
