import { describe, it, expect } from "vitest";
import { checkProposal } from "./checker";

describe("checkProposal", () => {
  it("güçlü teklif: kısa, soru, sayı, müşteri-odaklı, klişesiz → yüksek skor", () => {
    const text =
      "I saw your React dashboard project and your goal to cut load time. " +
      "On a similar app I reduced render time by 40% and shipped in 2 weeks. " +
      "I can do the same for you — what is your ideal launch date?";
    const r = checkProposal(text);
    expect(r.checks.find((c) => c.id === "question")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "numbers")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "clientFocus")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "noFiller")!.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "length")!.passed).toBe(true);
    expect(r.score).toBe(100);
    expect(r.verdict).toBe("strong");
  });

  it("klişe + ben-odaklı + soru yok + sayı yok → düşük skor", () => {
    const text =
      "Dear Sir, I am writing to apply. I am the best. I am a hard-working team player " +
      "and I am confident that I can help. I have attached my resume.";
    const r = checkProposal(text);
    expect(r.fillerFound.length).toBeGreaterThan(0);
    expect(r.checks.find((c) => c.id === "noFiller")!.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "question")!.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "clientFocus")!.passed).toBe(false);
    expect(r.verdict).toBe("weak");
  });

  it("TR klişe ve müşteri zamiri tanınır", () => {
    const strong = checkProposal("Projenizde size %30 daha hızlı sonuç sundum, sizin için tekrarlayabilirim. Başlangıç tarihiniz nedir?");
    expect(strong.checks.find((c) => c.id === "clientFocus")!.passed).toBe(true);
    expect(strong.checks.find((c) => c.id === "numbers")!.passed).toBe(true);

    const weak = checkProposal("Sayın yetkili, ben bu işte en iyisiyim, çalışkan biriyim.");
    expect(weak.fillerFound.length).toBeGreaterThan(0);
  });

  it("boş/çok kısa metin skor 0, patlamaz", () => {
    expect(checkProposal("").score).toBe(0);
    expect(checkProposal("hi").score).toBe(0);
    expect(checkProposal("   ").wordCount).toBe(0);
  });
});
