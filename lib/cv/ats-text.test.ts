import { describe, it, expect } from "vitest";
import { scoreResumeText } from "./ats-text";

const STRONG_CV = `John Doe
john.doe@example.com | +1 415 555 0199 | San Francisco

Summary
Senior backend engineer with 8 years building scalable APIs.

Skills
Python, Go, PostgreSQL, Kubernetes, AWS

Experience
Staff Engineer — Acme (2019 - 2024)
- Cut API latency by 40% serving 2M daily requests
- Led migration reducing infra cost by $120k/year
- Mentored 5 engineers across 3 teams

Education
BSc Computer Science — MIT (2011 - 2015)`;

describe("scoreResumeText", () => {
  it("iyi yapılandırılmış CV yüksek skor + strong verdict alır", () => {
    const r = scoreResumeText(STRONG_CV);
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.verdict).toBe("strong");
    expect(r.checks.find((c) => c.id === "contact")?.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "quantified")?.passed).toBe(true);
    expect(r.totalBullets).toBe(3);
    expect(r.quantifiedBullets).toBe(3);
  });

  it("boş/zayıf metin düşük skor + weak verdict alır", () => {
    const r = scoreResumeText("just some text without structure");
    expect(r.score).toBeLessThan(50);
    expect(r.verdict).toBe("weak");
    expect(r.checks.find((c) => c.id === "contact")?.passed).toBe(false);
  });

  it("e-posta + telefon birlikte olmadan contact geçmez", () => {
    expect(scoreResumeText("a@b.com only email").checks.find((c) => c.id === "contact")?.passed).toBe(false);
    expect(scoreResumeText("a@b.com +1 415 555 0199").checks.find((c) => c.id === "contact")?.passed).toBe(true);
  });

  it("tarih aralığı ('2019 - 2024') telefon sayılmaz (yanlış-pozitif düzeltmesi)", () => {
    // Yalnız e-posta + tarih aralığı olan CV, telefonu yokken contact GEÇMEMELİ.
    const cv = "a@b.com\nExperience 2019 - 2024 at Acme\nEducation 2011 - 2015";
    expect(scoreResumeText(cv).checks.find((c) => c.id === "contact")?.passed).toBe(false);
    // Gerçek telefon biçimleri hâlâ yakalanır.
    expect(scoreResumeText("a@b.com (415) 555-0199").checks.find((c) => c.id === "contact")?.passed).toBe(true);
    expect(scoreResumeText("a@b.com 415 555 0199").checks.find((c) => c.id === "contact")?.passed).toBe(true);
  });

  it("dolgu ifadeler noFiller kontrolünü düşürür", () => {
    const cv = "Experience\n- Responsible for various tasks\n- Helped the team with stuff";
    expect(scoreResumeText(cv).checks.find((c) => c.id === "noFiller")?.passed).toBe(false);
  });

  it("ilan metni verilince anahtar kelime kapsamı + eksikler hesaplanır", () => {
    const r = scoreResumeText(STRONG_CV, "We need Python and Rust and Terraform experience");
    expect(r.keywordCoverage).not.toBeNull();
    expect(r.missingKeywords).toContain("rust");
    expect(r.missingKeywords).toContain("terraform");
    expect(r.checks.some((c) => c.id === "keywords")).toBe(true);
  });

  it("ilan yoksa keywordCoverage null + keywords check yok", () => {
    const r = scoreResumeText(STRONG_CV);
    expect(r.keywordCoverage).toBeNull();
    expect(r.checks.some((c) => c.id === "keywords")).toBe(false);
  });
});
