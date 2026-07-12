import { describe, it, expect } from "vitest";
import {
  resolveMarket,
  marketPlatforms,
  marketDefaultLocale,
  marketAllowsLocale,
  marketCurrency,
  marketHasKvkk,
} from "./config";

describe("resolveMarket (saf-geo, override YOK)", () => {
  it("geo ülkeden çözer (TR → tr, diğerleri global)", () => {
    expect(resolveMarket("TR", null)).toBe("tr");
    expect(resolveMarket("tr", null)).toBe("tr"); // küçük harf toleransı
    expect(resolveMarket("DE", null)).toBe("global");
    expect(resolveMarket("US", null)).toBe("global");
  });

  it("geo yoksa Accept-Language'e düşer (tr* → tr)", () => {
    expect(resolveMarket(null, "tr-TR,tr;q=0.9")).toBe("tr");
    expect(resolveMarket(null, "en-US")).toBe("global");
  });

  it("geo, Accept-Language'i yener (konum belirleyici)", () => {
    expect(resolveMarket("US", "tr-TR")).toBe("global");
    expect(resolveMarket("TR", "en-US")).toBe("tr");
  });

  it("hiçbir sinyal yoksa varsayılan global", () => {
    expect(resolveMarket(null, null)).toBe("global");
    expect(resolveMarket("", "")).toBe("global");
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
