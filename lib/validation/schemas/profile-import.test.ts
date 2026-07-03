import { describe, it, expect } from "vitest";
import { importRequestSchema, profileDraftSchema } from "./profile-import";

describe("importRequestSchema", () => {
  it("url modunu doğrular, geçersiz protokolü reddeder", () => {
    expect(importRequestSchema.safeParse({ mode: "url", url: "https://www.upwork.com/freelancers/~01ab" }).success).toBe(true);
    expect(importRequestSchema.safeParse({ mode: "url", url: "ftp://x.com/a" }).success).toBe(false);
    expect(importRequestSchema.safeParse({ mode: "url", url: "not-a-url" }).success).toBe(false);
  });
  it("text modunu doğrular; boş/aşırı uzun metni reddeder", () => {
    expect(importRequestSchema.safeParse({ mode: "text", text: "Senior dev, 10 yıl React." }).success).toBe(true);
    expect(importRequestSchema.safeParse({ mode: "text", text: "  " }).success).toBe(false);
    expect(importRequestSchema.safeParse({ mode: "text", text: "x".repeat(50_001) }).success).toBe(false);
  });
  it("bilinmeyen modu reddeder", () => {
    expect(importRequestSchema.safeParse({ mode: "file" }).success).toBe(false);
  });
});

describe("importRequestSchema — extension modu", () => {
  const valid = {
    mode: "extension",
    platform: "upwork",
    sourceUrl: "https://www.upwork.com/freelancers/~01ab",
    text: "x".repeat(200),
  };
  it("geçerli eklenti yükünü kabul eder (medya opsiyonel)", () => {
    expect(importRequestSchema.safeParse(valid).success).toBe(true);
    expect(
      importRequestSchema.safeParse({
        ...valid,
        avatarUrl: "https://cdn.example.com/a.jpg",
        portfolioImages: ["https://cdn.example.com/p1.jpg"],
      }).success,
    ).toBe(true);
  });
  it("yalnız upwork/fiverr platformlarını kabul eder", () => {
    expect(importRequestSchema.safeParse({ ...valid, platform: "fiverr" }).success).toBe(true);
    expect(importRequestSchema.safeParse({ ...valid, platform: "linkedin" }).success).toBe(false);
  });
  it("80 karakterin altındaki metni reddeder (anlamlılık eşiği)", () => {
    expect(importRequestSchema.safeParse({ ...valid, text: "x".repeat(79) }).success).toBe(false);
    expect(importRequestSchema.safeParse({ ...valid, text: "x".repeat(50_001) }).success).toBe(false);
  });
  it("http sourceUrl'i reddeder (yalnız https)", () => {
    expect(importRequestSchema.safeParse({ ...valid, sourceUrl: "http://www.upwork.com/freelancers/~01ab" }).success).toBe(false);
  });
  it("http(s) olmayan medya URL'lerini reddeder", () => {
    expect(importRequestSchema.safeParse({ ...valid, avatarUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(importRequestSchema.safeParse({ ...valid, portfolioImages: ["data:image/png;base64,x"] }).success).toBe(false);
  });
  it("12'den fazla portfolyo görselini reddeder", () => {
    const urls = Array.from({ length: 13 }, (_, i) => `https://cdn.example.com/p${i}.jpg`);
    expect(importRequestSchema.safeParse({ ...valid, portfolioImages: urls }).success).toBe(false);
    expect(importRequestSchema.safeParse({ ...valid, portfolioImages: urls.slice(0, 12) }).success).toBe(true);
  });
});

describe("profileDraftSchema", () => {
  it("AI taslağını doğrular; sınır aşımını kırpmaz, reddeder", () => {
    expect(profileDraftSchema.safeParse({ headline: "Dev", summary: "Özet", skills: ["React"] }).success).toBe(true);
    // Boş taslak şemada geçerli — anlamlılık kontrolü motor/route katmanında.
    expect(profileDraftSchema.safeParse({ headline: "", summary: "", skills: [] }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ headline: "x".repeat(121), summary: "s", skills: [] }).success).toBe(false);
  });
});
