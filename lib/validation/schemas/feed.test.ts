import { describe, it, expect } from "vitest";
import { feedCreateSchema, feedSearchQuerySchema, starToggleSchema } from "./feed";

describe("feedCreateSchema", () => {
  it("geçerli feed'i kabul eder", () => {
    const r = feedCreateSchema.safeParse({ name: "React işleri", keywords: ["react", "next"], minBudget: 500, platform: "upwork" });
    expect(r.success).toBe(true);
  });
  it("boş isim reddeder", () => {
    expect(feedCreateSchema.safeParse({ name: "", keywords: [] }).success).toBe(false);
  });
  it("en çok 10 keyword'e izin verir", () => {
    const keywords = Array.from({ length: 11 }, (_, i) => `k${i}`);
    expect(feedCreateSchema.safeParse({ name: "x", keywords }).success).toBe(false);
  });
});

describe("feedSearchQuerySchema", () => {
  it("query string'ten sayısal minBudget'e coerce eder", () => {
    const r = feedSearchQuerySchema.safeParse({ q: "react", minBudget: "500" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.minBudget).toBe(500);
  });
});

describe("starToggleSchema", () => {
  it("uuid olmayan jobPoolId reddeder", () => {
    expect(starToggleSchema.safeParse({ jobPoolId: "abc" }).success).toBe(false);
  });
});
