import { describe, it, expect } from "vitest";
import {
  resolveMarket,
  marketPlatforms,
  marketDefaultLocale,
  marketAllowsLocale,
  marketCurrency,
  marketHasKvkk,
} from "./config";

describe("resolveMarket", () => {
  it("geçerli cookie override her şeyi yener", () => {
    expect(resolveMarket("tr", "US", "en-US")).toBe("tr");
    expect(resolveMarket("global", "TR", "tr-TR")).toBe("global");
  });

  it("cookie yoksa geo ülkeden çözer (TR → tr, diğerleri global)", () => {
    expect(resolveMarket(undefined, "TR", null)).toBe("tr");
    expect(resolveMarket(undefined, "tr", null)).toBe("tr"); // küçük harf toleransı
    expect(resolveMarket(undefined, "DE", null)).toBe("global");
    expect(resolveMarket(undefined, "US", null)).toBe("global");
  });

  it("geo yoksa Accept-Language'e düşer (tr* → tr)", () => {
    expect(resolveMarket(undefined, null, "tr-TR,tr;q=0.9")).toBe("tr");
    expect(resolveMarket(undefined, null, "en-US")).toBe("global");
  });

  it("hiçbir sinyal yoksa varsayılan global", () => {
    expect(resolveMarket(undefined, null, null)).toBe("global");
    expect(resolveMarket("", "", "")).toBe("global");
  });

  it("geçersiz cookie yok sayılır, geo devam eder", () => {
    expect(resolveMarket("xx", "TR", null)).toBe("tr");
  });
});

describe("market yardımcıları", () => {
  it("global 3 platform, TR 5 platform sunar", () => {
    expect(marketPlatforms("global")).toHaveLength(3);
    expect(marketPlatforms("global")).not.toContain("bionluk");
    expect(marketPlatforms("global")).not.toContain("armut");
    expect(marketPlatforms("tr")).toHaveLength(5);
    expect(marketPlatforms("tr")).toContain("bionluk");
    expect(marketPlatforms("tr")).toContain("armut");
  });

  it("varsayılan locale ve para birimi pazara göre", () => {
    expect(marketDefaultLocale("global")).toBe("en");
    expect(marketDefaultLocale("tr")).toBe("tr");
    expect(marketCurrency("global")).toBe("USD");
    expect(marketCurrency("tr")).toBe("TRY");
  });

  it("global tek-locale (en), TR çift-locale (tr+en)", () => {
    expect(marketAllowsLocale("global", "en")).toBe(true);
    expect(marketAllowsLocale("global", "tr")).toBe(false);
    expect(marketAllowsLocale("tr", "en")).toBe(true);
    expect(marketAllowsLocale("tr", "tr")).toBe(true);
  });

  it("KVKK yalnız TR pazarında", () => {
    expect(marketHasKvkk("global")).toBe(false);
    expect(marketHasKvkk("tr")).toBe(true);
  });
});
