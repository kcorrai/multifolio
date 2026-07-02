import { describe, it, expect } from "vitest";
import { extractBudgetFloor, matchesFeed, searchPool } from "./filter";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

function pool(partial: Partial<PoolJobRow>): PoolJobRow {
  return {
    id: "1", source: "sample", external_id: "e1", title: "React dev",
    description: "Build a dashboard", url: null, budget: "$1,500-3,000",
    skills: ["React", "TypeScript"], client_country: "US",
    posted_at: null, created_at: "2026-07-01T00:00:00Z", ...partial,
  };
}

describe("extractBudgetFloor", () => {
  it("ilk sayıyı (bin ayıracı dahil) çıkarır", () => {
    expect(extractBudgetFloor("$1,500-3,000")).toBe(1500);
    expect(extractBudgetFloor("Hourly $40-70")).toBe(40);
  });
  it("sayı yoksa null döner", () => {
    expect(extractBudgetFloor(null)).toBeNull();
    expect(extractBudgetFloor("Negotiable")).toBeNull();
  });
});

describe("matchesFeed", () => {
  it("keyword title/description/skills'te geçerse eşleşir (case-insensitive)", () => {
    expect(matchesFeed(pool({}), { keywords: ["react"], min_budget: null, platform: null })).toBe(true);
    expect(matchesFeed(pool({}), { keywords: ["vue"], min_budget: null, platform: null })).toBe(false);
  });
  it("keyword boşsa (kriter yok) eşleşir", () => {
    expect(matchesFeed(pool({}), { keywords: [], min_budget: null, platform: null })).toBe(true);
  });
  it("min_budget pool floor'undan büyükse elenir", () => {
    expect(matchesFeed(pool({ budget: "$300-600" }), { keywords: [], min_budget: 500, platform: null })).toBe(false);
    expect(matchesFeed(pool({ budget: "$300-600" }), { keywords: [], min_budget: 200, platform: null })).toBe(true);
  });
  it("platform eşleşmezse elenir (source ile karşılaştırır)", () => {
    expect(matchesFeed(pool({ source: "sample" }), { keywords: [], min_budget: null, platform: "upwork" })).toBe(false);
    expect(matchesFeed(pool({ source: "upwork" }), { keywords: [], min_budget: null, platform: "upwork" })).toBe(true);
  });
});

describe("searchPool", () => {
  const rows = [pool({ id: "a", title: "React dev" }), pool({ id: "b", title: "Vue dev", skills: ["Vue"] })];
  it("q title/skills'te ararsa filtreler", () => {
    expect(searchPool(rows, { q: "vue" }).map((r) => r.id)).toEqual(["b"]);
  });
  it("q boşsa hepsini döner", () => {
    expect(searchPool(rows, {}).length).toBe(2);
  });
});
