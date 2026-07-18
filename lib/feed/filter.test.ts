import { describe, it, expect } from "vitest";
import { extractBudgetFloor, isHourlyBudget, matchesFeed, poolJobTitle, searchPool } from "./filter";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

function pool(partial: Partial<PoolJobRow>): PoolJobRow {
  return {
    id: "1", source: "sample", external_id: "e1", title: "React dev",
    description: "Build a dashboard", url: null, budget: "$1,500-3,000",
    skills: ["React", "TypeScript"], client_country: "US", client_spent: null,
    posted_at: null, created_at: "2026-07-01T00:00:00Z",
    lang: null, title_en: null, title_tr: null, job_type: null, ...partial,
  };
}

// Yalnız keywords zorunlu; diğer kriterler opsiyonel kalsın diye yardımcı.
function crit(partial: Partial<Parameters<typeof matchesFeed>[1]>) {
  return { keywords: [], min_budget: null, platform: null, ...partial };
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

  it("exclude_countries ülkeyi (case-insensitive) eler; ülke bilinmiyorsa elemez", () => {
    expect(matchesFeed(pool({ client_country: "Pakistan" }), crit({ exclude_countries: ["pakistan"] }))).toBe(false);
    expect(matchesFeed(pool({ client_country: "Germany" }), crit({ exclude_countries: ["Pakistan"] }))).toBe(true);
    expect(matchesFeed(pool({ client_country: null }), crit({ exclude_countries: ["Pakistan"] }))).toBe(true);
  });

  it("exclude_keywords title/description/skills'te geçerse eler (case-insensitive)", () => {
    expect(matchesFeed(pool({}), crit({ exclude_keywords: ["REACT"] }))).toBe(false);
    expect(matchesFeed(pool({ description: "WordPress theme work" }), crit({ exclude_keywords: ["wordpress"] }))).toBe(false);
    expect(matchesFeed(pool({}), crit({ exclude_keywords: ["wordpress"] }))).toBe(true);
  });
  it("exclude_keywords çevrilmiş başlıkta da arar; pozitif keyword'den önce uygulanır", () => {
    expect(matchesFeed(pool({ title_en: "Senior WordPress developer" }), crit({ exclude_keywords: ["wordpress"] }))).toBe(false);
    // Pozitif keyword eşleşse bile exclude öncelikli eler.
    expect(matchesFeed(pool({}), crit({ keywords: ["react"], exclude_keywords: ["dashboard"] }))).toBe(false);
  });
  it("exclude_keywords boşsa hiçbir şeyi elemez", () => {
    expect(matchesFeed(pool({}), crit({ exclude_keywords: [] }))).toBe(true);
  });

  it("min_hourly_rate yalnız saatlik ilanlara uygulanır", () => {
    expect(matchesFeed(pool({ budget: "Hourly $40-70" }), crit({ min_hourly_rate: 50 }))).toBe(false);
    expect(matchesFeed(pool({ budget: "Hourly $40-70" }), crit({ min_hourly_rate: 30 }))).toBe(true);
    expect(matchesFeed(pool({ budget: "$300-600" }), crit({ min_hourly_rate: 50 }))).toBe(true); // sabit fiyat etkilenmez
  });

  it("min_fixed_price yalnız sabit fiyatlı ilanlara uygulanır", () => {
    expect(matchesFeed(pool({ budget: "$300-600" }), crit({ min_fixed_price: 500 }))).toBe(false);
    expect(matchesFeed(pool({ budget: "$800-1,500" }), crit({ min_fixed_price: 500 }))).toBe(true);
    expect(matchesFeed(pool({ budget: "Hourly $40-70" }), crit({ min_fixed_price: 500 }))).toBe(true); // saatlik etkilenmez
    expect(matchesFeed(pool({ budget: null }), crit({ min_fixed_price: 500 }))).toBe(true); // bütçesiz elenmez
  });

  it("min_client_spent harcaması bilinen ve altında kalanı eler", () => {
    expect(matchesFeed(pool({ client_spent: 100 }), crit({ min_client_spent: 500 }))).toBe(false);
    expect(matchesFeed(pool({ client_spent: 900 }), crit({ min_client_spent: 500 }))).toBe(true);
    expect(matchesFeed(pool({ client_spent: null }), crit({ min_client_spent: 500 }))).toBe(true); // veri yoksa elenmez
  });

  it("job_types seçiliyken yalnız eşleşen türü geçirir; null job_type lenient (elenmez)", () => {
    expect(matchesFeed(pool({ job_type: "contract" }), crit({ job_types: ["contract", "freelance"] }))).toBe(true);
    expect(matchesFeed(pool({ job_type: "full_time" }), crit({ job_types: ["contract", "freelance"] }))).toBe(false);
    expect(matchesFeed(pool({ job_type: null }), crit({ job_types: ["contract"] }))).toBe(true); // veri yoksa elenmez
    expect(matchesFeed(pool({ job_type: "full_time" }), crit({ job_types: [] }))).toBe(true); // seçim yoksa hepsi geçer
  });

  it("keyword çevrilmiş başlıkta da arar (Almanca ilan + İngilizce keyword)", () => {
    const de = pool({ title: "Vertriebsmitarbeiter (m/w/d)", lang: "de", title_en: "Sales Representative (m/f/d)", title_tr: "Satış Temsilcisi (m/w/d)" });
    expect(matchesFeed(de, crit({ keywords: ["sales"] }))).toBe(true);
    expect(matchesFeed(de, crit({ keywords: ["satış"] }))).toBe(true);
    expect(matchesFeed(de, crit({ keywords: ["muhasebe"] }))).toBe(false);
  });

  it("keyword kelime sınırıyla eşleşir (java ≠ javascript)", () => {
    const js = pool({ title: "JavaScript expert", description: "Node backend", skills: ["JavaScript"] });
    expect(matchesFeed(js, crit({ keywords: ["java"] }))).toBe(false);
    expect(matchesFeed(js, crit({ keywords: ["javascript"] }))).toBe(true);
    // Özel karakterli terimler korunur (c++, c#, next.js).
    expect(matchesFeed(pool({ description: "Strong C++ and C# skills" }), crit({ keywords: ["c++"] }))).toBe(true);
    // exclude da kelime sınırı kullanır.
    expect(matchesFeed(js, crit({ keywords: ["javascript"], exclude_keywords: ["java"] }))).toBe(true);
  });

  it("min_score yalnız CACHE'Lİ skoru olan ilanları eler; skorsuz geçer", () => {
    expect(matchesFeed(pool({}), crit({ min_score: 70 }), 60)).toBe(false);
    expect(matchesFeed(pool({}), crit({ min_score: 70 }), 90)).toBe(true);
    expect(matchesFeed(pool({}), crit({ min_score: 70 }), null)).toBe(true);
    expect(matchesFeed(pool({}), crit({ min_score: 0 }), 10)).toBe(true); // 0 = kapalı
  });
});

describe("isHourlyBudget", () => {
  it("saatlik ipuçlarını tanır", () => {
    expect(isHourlyBudget("Hourly $40-70")).toBe(true);
    expect(isHourlyBudget("$25/hr")).toBe(true);
    expect(isHourlyBudget("$50 per hour")).toBe(true);
    expect(isHourlyBudget("$1,500-3,000")).toBe(false);
    expect(isHourlyBudget(null)).toBe(false);
  });
});

describe("poolJobTitle", () => {
  const de = pool({ title: "Vertriebsmitarbeiter", lang: "de", title_en: "Sales Rep", title_tr: "Satış Temsilcisi" });
  it("locale'e göre çevrilmiş başlığı seçer", () => {
    expect(poolJobTitle(de, "en")).toBe("Sales Rep");
    expect(poolJobTitle(de, "tr")).toBe("Satış Temsilcisi");
  });
  it("ilan zaten locale dilindeyse orijinali döner", () => {
    expect(poolJobTitle(pool({ lang: "en", title_en: "React dev (copy)" }), "en")).toBe("React dev");
  });
  it("çeviri yoksa (lang null / boş çeviri) orijinale düşer", () => {
    expect(poolJobTitle(pool({}), "tr")).toBe("React dev");
    expect(poolJobTitle(pool({ lang: "de", title_tr: "  " }), "tr")).toBe("React dev");
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
