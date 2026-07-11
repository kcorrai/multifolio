import { describe, it, expect } from "vitest";
import { feedStrength } from "./strength";
import type { PoolJob } from "@/lib/validation/schemas/feed";

function pj(over: Partial<PoolJob> = {}): PoolJob {
  return {
    id: "1", source: "remotive", external_id: "e", title: "React dev",
    description: "d", url: null, budget: null, skills: [], client_country: null,
    client_spent: null, posted_at: null, created_at: "2026-07-01T00:00:00Z",
    lang: "en", title_en: null, title_tr: null,
    isStarred: false, score: null, scoreResult: null,
    relevance: null, skillGap: null, ...over,
  };
}

describe("feedStrength", () => {
  it("boş listede sayaç 0, oranlar null", () => {
    const s = feedStrength([], ["react"]);
    expect(s).toEqual({ matchedCount: 0, avgRelevance: null, precisionPct: null, suggestAdd: [] });
  });

  it("ortalama alaka + precision (eşik üstü oranı) hesaplar", () => {
    const jobs = [pj({ relevance: 80 }), pj({ id: "2", relevance: 60 }), pj({ id: "3", relevance: 4 })];
    const s = feedStrength(jobs, []);
    expect(s.matchedCount).toBe(3);
    expect(s.avgRelevance).toBe(48); // (80+60+4)/3
    expect(s.precisionPct).toBe(67); // 2/3 eşik (8) üstü
  });

  it("relevance'ı null olan ilanları oran hesabına katmaz", () => {
    const s = feedStrength([pj({ relevance: null }), pj({ id: "2", relevance: 90 })], []);
    expect(s.avgRelevance).toBe(90);
    expect(s.precisionPct).toBe(100);
  });

  it("sık geçen + karşılanan becerileri önerir; mevcut keyword'leri hariç tutar", () => {
    const jobs = [
      pj({ id: "1", skillGap: { matched: ["React", "TypeScript"], missing: [] } }),
      pj({ id: "2", skillGap: { matched: ["React", "Next.js"], missing: [] } }),
    ];
    const s = feedStrength(jobs, ["react"]); // react zaten keyword
    expect(s.suggestAdd).not.toContain("React");
    expect(s.suggestAdd).toContain("TypeScript");
    expect(s.suggestAdd).toContain("Next.js");
  });
});
