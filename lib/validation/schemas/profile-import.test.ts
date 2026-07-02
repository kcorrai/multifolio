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

describe("profileDraftSchema", () => {
  it("AI taslağını doğrular; sınır aşımını kırpmaz, reddeder", () => {
    expect(profileDraftSchema.safeParse({ headline: "Dev", summary: "Özet", skills: ["React"] }).success).toBe(true);
    // Boş taslak şemada geçerli — anlamlılık kontrolü motor/route katmanında.
    expect(profileDraftSchema.safeParse({ headline: "", summary: "", skills: [] }).success).toBe(true);
    expect(profileDraftSchema.safeParse({ headline: "x".repeat(121), summary: "s", skills: [] }).success).toBe(false);
  });
});
