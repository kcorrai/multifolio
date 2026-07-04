import { describe, it, expect } from "vitest";
import { computeProfileStrength, type ProfileStrengthInput } from "./profile-strength";

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
  it("tüm maddeler tamamsa 100 döner", () => {
    const r = computeProfileStrength(full());
    expect(r.percent).toBe(100);
    expect(r.items.every((i) => i.done)).toBe(true);
    expect(r.items).toHaveLength(8);
  });

  it("hepsi boş/null ise 0 döner (savunmacı normalize)", () => {
    const r = computeProfileStrength({
      headline: null, summary: null, skills: null, avatarUrl: null,
      portfolioCount: null, connectionsCount: null, platformProfilesCount: null, adaptationsCount: null,
    });
    expect(r.percent).toBe(0);
    expect(r.items.every((i) => !i.done)).toBe(true);
  });

  it("eşikler: kısa headline (<20) ve kısa summary (<80) geçmez", () => {
    const r = computeProfileStrength(full({ headline: "React dev", summary: "Too short." }));
    expect(r.items.find((i) => i.key === "headline")?.done).toBe(false);
    expect(r.items.find((i) => i.key === "summary")?.done).toBe(false);
    expect(r.percent).toBe(75); // 6/8
  });

  it("skills eşiği 5'tir; 4 beceri geçmez", () => {
    const r = computeProfileStrength(full({ skills: ["a", "b", "c", "d"] }));
    expect(r.items.find((i) => i.key === "skills")?.done).toBe(false);
  });

  it("kısmi tamamlama yüzdesi doğru yuvarlanır (3/8 → 38)", () => {
    const r = computeProfileStrength(full({
      avatarUrl: null, portfolioCount: 0, connectionsCount: 0, platformProfilesCount: 0, adaptationsCount: 0,
    }));
    expect(r.percent).toBe(38); // 3/8 = 37.5 → 38
  });

  it("href hedefleri sabittir (profil alanları /profile, medya /import, platform adımları /platforms)", () => {
    const hrefs = Object.fromEntries(computeProfileStrength(full()).items.map((i) => [i.key, i.href]));
    expect(hrefs).toEqual({
      headline: "/dashboard/profile",
      summary: "/dashboard/profile",
      skills: "/dashboard/profile",
      avatar: "/dashboard/import",
      portfolio: "/dashboard/import",
      platformConnected: "/dashboard/platforms",
      platformDataFetched: "/dashboard/platforms",
      adapted: "/dashboard/platforms",
    });
  });
});
