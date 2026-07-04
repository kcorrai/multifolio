import { describe, it, expect } from "vitest";
import { jobRelevance } from "./relevance";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

function job(over: Partial<PoolJobRow> = {}): PoolJobRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    source: "remotive",
    external_id: "x1",
    title: "Senior React Developer",
    description: "Build dashboards with React, Next.js and TypeScript.",
    url: null,
    budget: null,
    skills: ["React", "Next.js", "TypeScript"],
    client_country: null,
    client_spent: null,
    posted_at: null,
    created_at: "2026-07-04T00:00:00Z",
    lang: "en",
    title_en: null,
    title_tr: null,
    ...over,
  };
}

const reactProfile = { headline: "Senior Frontend Developer", skills: ["React", "Next.js", "TypeScript", "Tailwind"] };

describe("jobRelevance", () => {
  it("profilde skill yoksa null döner (sinyal yetersiz)", () => {
    expect(jobRelevance({ headline: "x", skills: [] }, job())).toBeNull();
    expect(jobRelevance({ headline: "x", skills: null }, job())).toBeNull();
  });

  it("uyumlu ilan yüksek, alakasız ilan düşük skor alır", () => {
    const high = jobRelevance(reactProfile, job())!;
    const low = jobRelevance(
      reactProfile,
      job({ title: "Produktionsleiter (m/w/d)", description: "Fertigung und Montage in der Produktion.", skills: ["produktion", "montage"] }),
    )!;
    expect(high).toBeGreaterThan(60);
    expect(low).toBeLessThan(20);
    expect(high).toBeGreaterThan(low);
  });

  it("skill kesişimi metinde (skills alanı boş olsa da) yakalanır", () => {
    const r = jobRelevance(reactProfile, job({ skills: [], description: "We need React and Next.js expertise." }))!;
    expect(r).toBeGreaterThan(30);
  });

  it("skor 0-100 aralığında ve tamsayı", () => {
    const r = jobRelevance(reactProfile, job())!;
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
    expect(Number.isInteger(r)).toBe(true);
  });

  it("tamamen alakasız ilan 0'a yakın", () => {
    const r = jobRelevance(
      { headline: "Frozen Food Sales Director", skills: ["sales", "logistics", "retail"] },
      job(),
    )!;
    expect(r).toBeLessThan(15);
  });
});
