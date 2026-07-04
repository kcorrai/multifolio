import { describe, it, expect } from "vitest";
import { jobRelevance, orderDefaultFeed } from "./relevance";
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

describe("orderDefaultFeed", () => {
  const german = job({
    id: "00000000-0000-0000-0000-0000000000de",
    title: "Produktionsleiter (m/w/d)",
    description: "Fertigung und Montage in der Produktion.",
    skills: ["produktion", "montage"],
  });
  const reactJob = job();

  it("yeterli sinyalde (≥3 skill) alakalı üste gelir, alakasız Alman ilan elenir", () => {
    const out = orderDefaultFeed([german, reactJob], reactProfile);
    expect(out[0].id).toBe(reactJob.id);
    expect(out.some((j) => j.id === german.id)).toBe(false); // düşük alaka gizlendi
  });

  it("profil sinyali zayıfsa (skill yok) gelen sıra korunur (kronolojik)", () => {
    const out = orderDefaultFeed([german, reactJob], { headline: "x", skills: [] });
    expect(out.map((j) => j.id)).toEqual([german.id, reactJob.id]);
  });

  it("hepsi düşük alakalıysa boşaltmaz — en iyileri (sıralı) döndürür", () => {
    const out = orderDefaultFeed([german], reactProfile);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(german.id);
  });
});
