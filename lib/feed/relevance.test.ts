import { describe, it, expect } from "vitest";
import { jobRelevance, orderDefaultFeed, nearDuplicateKey, dedupeNearDuplicates } from "./relevance";
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

  it("çok-becerili profil, az sayıda güçlü eşleşmede elenmez (doygunluk telafisi)", () => {
    // 12 skill'li profil; ilan 3 çekirdek skill'i içeriyor. Ham oran 3/12=%25 olurdu
    // ama 3 güçlü eşleşme doygunluğu (3/SKILL_SATURATION=%75) yüksek skor sağlar.
    const broad = {
      headline: "Full-stack Developer",
      skills: ["React", "Next.js", "TypeScript", "Tailwind", "Node", "GraphQL", "Docker", "AWS", "Python", "Go", "Rust", "Kubernetes"],
    };
    const r = jobRelevance(broad, job())!; // job: React, Next.js, TypeScript (+desc)
    expect(r).toBeGreaterThanOrEqual(60);
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

describe("nearDuplicateKey", () => {
  it("aynı ilan farklı şehir/cinsiyet-işareti → aynı anahtar", () => {
    const a = nearDuplicateKey("Tax Advisor (m/w/d) in Waghäusel");
    const b = nearDuplicateKey("Tax Advisor (m/w/d) in Budenheim");
    const c = nearDuplicateKey("Tax Advisor (w/m/d) in Grafing");
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  it("farklı roller ayrı anahtar üretir", () => {
    expect(nearDuplicateKey("React Developer in Berlin"))
      .not.toBe(nearDuplicateKey("Backend Engineer in Berlin"));
  });

  it("konum soyma kalanı boşaltacaksa soymadan başlığı kullanır", () => {
    // "Work in Progress" → " in progress" soyulursa 'work' tek token kalır;
    // yine de deterministik, boş dönmez.
    expect(nearDuplicateKey("Work in Progress")).not.toBe("");
  });
});

describe("dedupeNearDuplicates", () => {
  it("aynı başlık farklı şehir → ilk kopya kalır", () => {
    const j1 = job({ id: "00000000-0000-0000-0000-00000000d001", title: "Tax Advisor (m/w/d) in Waghäusel" });
    const j2 = job({ id: "00000000-0000-0000-0000-00000000d002", title: "Tax Advisor (m/w/d) in Budenheim" });
    const j3 = job({ id: "00000000-0000-0000-0000-00000000d003", title: "Senior React Developer" });
    const out = dedupeNearDuplicates([j1, j2, j3]);
    expect(out.map((j) => j.id)).toEqual([j1.id, j3.id]);
  });

  it("title_en varsa onu kullanır (çevrilmiş başlıkta dedup)", () => {
    const j1 = job({ id: "00000000-0000-0000-0000-00000000d101", title: "Steuerberater in München", title_en: "Tax Advisor in Munich" });
    const j2 = job({ id: "00000000-0000-0000-0000-00000000d102", title: "Steuerberater in Köln", title_en: "Tax Advisor in Cologne" });
    expect(dedupeNearDuplicates([j1, j2])).toHaveLength(1);
  });
});
