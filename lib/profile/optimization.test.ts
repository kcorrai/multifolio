import { describe, it, expect } from "vitest";
import { assessProfileStrength } from "./optimization";

const STRONG = {
  headline: "Senior React & Next.js Developer — SaaS dashboards",
  summary:
    "I help SaaS teams ship faster. Over 6 years I've built React and GraphQL products, cutting load time 40% and growing signups 3x. I focus on clean, maintainable frontends and reliable delivery.",
  skills: ["React", "Next.js", "TypeScript", "GraphQL", "Node.js"],
};

describe("assessProfileStrength", () => {
  it("güçlü profil → yüksek skor, tüm kritik kontroller geçer", () => {
    const r = assessProfileStrength(STRONG);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.band).toBe("strong");
    expect(r.checks.find((c) => c.id === "headlineKeyword")?.passed).toBe(true);
    expect(r.checks.find((c) => c.id === "summaryQuantified")?.passed).toBe(true);
  });

  it("boş profil → weak, içerik kontrolleri başarısız", () => {
    const r = assessProfileStrength({ headline: "", summary: "", skills: [] });
    expect(r.score).toBeLessThan(40);
    expect(r.band).toBe("weak");
    // İçerik gerektiren tüm kontroller başarısız (noCliche boş metinde trivial geçer).
    expect(r.checks.find((c) => c.id === "headlinePresent")?.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "summaryLength")?.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "skillsCount")?.passed).toBe(false);
  });

  it("rakamsız/klişe özet → summaryQuantified + noCliche başarısız", () => {
    const r = assessProfileStrength({
      headline: "React Developer",
      summary: "I am a hard-working team player and detail-oriented professional who delivers best quality work for every client without exception.",
      skills: ["React"],
    });
    expect(r.checks.find((c) => c.id === "summaryQuantified")?.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "noCliche")?.passed).toBe(false);
    expect(r.checks.find((c) => c.id === "skillsCount")?.passed).toBe(false);
  });

  it("başlıkta anahtar kelime yoksa headlineKeyword başarısız", () => {
    const r = assessProfileStrength({ headline: "Hello there friend", summary: "x".repeat(130), skills: ["a", "b", "c", "d", "e"] });
    expect(r.checks.find((c) => c.id === "headlineKeyword")?.passed).toBe(false);
  });
});
