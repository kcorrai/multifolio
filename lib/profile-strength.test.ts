import { describe, it, expect } from "vitest";
import { computeProfileStrength, profileStrengthStage, type ProfileStrengthInput } from "./profile-strength";

// Tüm maddeleri geçen dolu girdi; testler tek alanı bozarak ilerler.
function full(over: Partial<ProfileStrengthInput> = {}): ProfileStrengthInput {
  return {
    headline: "Senior React & TypeScript Developer",
    summary: "8 years building dashboards and SaaS frontends with React, Next.js and TypeScript for global clients.",
    skills: ["React", "TypeScript", "Next.js", "Node.js", "Tailwind"],
    avatarUrl: "https://example.com/a.jpg",
    portfolioCount: 2,
    connectionsCount: 1,
    platformProfilesCount: 1,
    adaptationsCount: 1,
    ...over,
  };
}

describe("computeProfileStrength", () => {
  it("6 çekirdek madde tamamsa 100 döner (bonus %'yi etkilemez)", () => {
    const r = computeProfileStrength(full());
    expect(r.percent).toBe(100);
    expect(r.items).toHaveLength(6);
    expect(r.items.every((i) => i.done)).toBe(true);
    expect(r.bonus).toHaveLength(2);
    expect(r.bonus.every((b) => b.done)).toBe(true);
  });

  it("avatar/portfolyo eksik olsa da (bonus) %100 ULAŞILABİLİR — manuel kullanıcı tavanı yok", () => {
    const r = computeProfileStrength(full({ avatarUrl: null, portfolioCount: 0 }));
    expect(r.percent).toBe(100); // çekirdek 6/6, bonus %'ye girmez
    expect(r.bonus.find((b) => b.key === "avatar")?.done).toBe(false);
    expect(r.bonus.find((b) => b.key === "portfolio")?.done).toBe(false);
  });

  it("hepsi boş/null ise 0 döner", () => {
    const r = computeProfileStrength({
      headline: null, summary: null, skills: null, avatarUrl: null,
      portfolioCount: null, connectionsCount: null, platformProfilesCount: null, adaptationsCount: null,
    });
    expect(r.percent).toBe(0);
    expect(r.items.every((i) => !i.done)).toBe(true);
  });

  it("eşikler: kısa headline (<20) ve kısa summary (<80) geçmez → 4/6 = 67", () => {
    const r = computeProfileStrength(full({ headline: "React dev", summary: "Too short." }));
    expect(r.items.find((i) => i.key === "headline")?.done).toBe(false);
    expect(r.items.find((i) => i.key === "summary")?.done).toBe(false);
    expect(r.percent).toBe(67); // 4/6 = 66.7 → 67
  });

  it("skills eşiği 5'tir; 4 beceri geçmez", () => {
    const r = computeProfileStrength(full({ skills: ["a", "b", "c", "d"] }));
    expect(r.items.find((i) => i.key === "skills")?.done).toBe(false);
  });

  it("taze manuel kullanıcı (yalnız profil alanları) 3/6 = 50 (kırmızı değil)", () => {
    const r = computeProfileStrength(full({
      avatarUrl: null, portfolioCount: 0, connectionsCount: 0, platformProfilesCount: 0, adaptationsCount: 0,
    }));
    expect(r.percent).toBe(50); // 3/6
  });

  it("stage: 100 allstar, 67 strong, 50 shaping, 0 start", () => {
    expect(computeProfileStrength(full()).stage).toBe("allstar");
    expect(profileStrengthStage(100)).toBe("allstar");
    expect(profileStrengthStage(67)).toBe("strong");
    expect(profileStrengthStage(50)).toBe("shaping");
    expect(profileStrengthStage(33)).toBe("start");
    expect(profileStrengthStage(0)).toBe("start");
  });

  it("stepPercent = 6 çekirdek madde için 17", () => {
    expect(computeProfileStrength(full()).stepPercent).toBe(17);
  });

  it("href hedefleri: çekirdek profil/platform, bonus /import", () => {
    const r = computeProfileStrength(full());
    const coreHrefs = Object.fromEntries(r.items.map((i) => [i.key, i.href]));
    expect(coreHrefs).toEqual({
      headline: "/dashboard/profile",
      summary: "/dashboard/profile",
      skills: "/dashboard/profile",
      platformConnected: "/dashboard/platforms",
      platformDataFetched: "/dashboard/platforms",
      adapted: "/dashboard/platforms",
    });
    expect(r.bonus.map((b) => b.href)).toEqual(["/dashboard/import", "/dashboard/import"]);
  });
});
