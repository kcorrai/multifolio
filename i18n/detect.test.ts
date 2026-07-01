import { describe, it, expect } from "vitest";
import { resolveLocale, defaultLocale } from "./detect";

describe("resolveLocale", () => {
  it("geçerli cookie'yi kullanır", () => {
    expect(resolveLocale("tr", "en-US")).toBe("tr");
    expect(resolveLocale("en", "tr-TR")).toBe("en");
  });
  it("cookie yoksa Accept-Language'den algılar", () => {
    expect(resolveLocale(undefined, "tr-TR,tr;q=0.9")).toBe("tr");
    expect(resolveLocale(undefined, "en-US,en;q=0.9")).toBe("en");
  });
  it("geçersiz cookie'yi yok sayar, algılamaya düşer", () => {
    expect(resolveLocale("de", "tr")).toBe("tr");
  });
  it("hiçbiri yoksa varsayılana düşer", () => {
    expect(resolveLocale(undefined, null)).toBe(defaultLocale);
    expect(resolveLocale(undefined, "fr-FR")).toBe("en");
  });
});
