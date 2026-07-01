import { describe, it, expect } from "vitest";
import {
  proposalWithCoverageSchema,
  coverageStatusSchema,
} from "@/lib/validation/schemas/proposal";
import { jobMatchResultSchema } from "@/lib/validation/schemas/job";

describe("proposalWithCoverageSchema", () => {
  it("geçerli çıktıyı kabul eder", () => {
    const r = proposalWithCoverageSchema.safeParse({
      content: "Merhaba, projeniz için…",
      coverage: [{ requirement: "React", status: "met", note: "5 yıl deneyim" }],
    });
    expect(r.success).toBe(true);
  });

  it("geçersiz status'u reddeder", () => {
    const r = proposalWithCoverageSchema.safeParse({
      content: "x",
      coverage: [{ requirement: "React", status: "unknown", note: "" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("coverageStatusSchema", () => {
  it("met/partial/missing kabul eder", () => {
    expect(coverageStatusSchema.safeParse("partial").success).toBe(true);
  });
});

describe("jobMatchResultSchema", () => {
  it("requirements alanını kabul eder", () => {
    const r = jobMatchResultSchema.safeParse({
      score: 80,
      strengths: ["React"],
      gaps: [],
      requirements: ["React", "TypeScript"],
      summary: "İyi uyum.",
    });
    expect(r.success).toBe(true);
  });
});
