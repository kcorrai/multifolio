import { describe, it, expect } from "vitest";
import {
  proposalWithCoverageSchema,
  proposalCreateSchema,
  coverageStatusSchema,
} from "@/lib/validation/schemas/proposal";
import { jobMatchResultSchema } from "@/lib/validation/schemas/job";

const covItem = (i: number) => ({ requirement: `R${i}`, status: "met" as const, note: "" });

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

  it("coverage max 7: 7 kabul, 8 red", () => {
    const seven = Array.from({ length: 7 }, (_, i) => covItem(i));
    expect(
      proposalWithCoverageSchema.safeParse({ content: "x", coverage: seven }).success,
    ).toBe(true);
    expect(
      proposalWithCoverageSchema.safeParse({ content: "x", coverage: [...seven, covItem(7)] }).success,
    ).toBe(false);
  });

  it("note max 200: 200 kabul, 201 red", () => {
    const ok = { content: "x", coverage: [{ requirement: "R", status: "met" as const, note: "a".repeat(200) }] };
    const tooLong = { content: "x", coverage: [{ requirement: "R", status: "met" as const, note: "a".repeat(201) }] };
    expect(proposalWithCoverageSchema.safeParse(ok).success).toBe(true);
    expect(proposalWithCoverageSchema.safeParse(tooLong).success).toBe(false);
  });
});

describe("proposalCreateSchema", () => {
  const base = {
    job_id: "550e8400-e29b-41d4-a716-446655440000",
    platform: "upwork",
    job_description: "Bu bir iş ilanıdır.",
  };

  it("focus_requirements opsiyoneldir (yoksa da geçerli)", () => {
    expect(proposalCreateSchema.safeParse(base).success).toBe(true);
  });

  it("focus_requirements max 7: 7 kabul, 8 red", () => {
    const mk = (n: number) => ({ ...base, focus_requirements: Array.from({ length: n }, (_, i) => `R${i}`) });
    expect(proposalCreateSchema.safeParse(mk(7)).success).toBe(true);
    expect(proposalCreateSchema.safeParse(mk(8)).success).toBe(false);
  });
});

describe("coverageStatusSchema", () => {
  it("met/partial/missing kabul eder", () => {
    expect(coverageStatusSchema.safeParse("partial").success).toBe(true);
  });
});

describe("jobMatchResultSchema", () => {
  const base = { score: 80, strengths: ["React"], gaps: [], summary: "İyi uyum." };

  it("requirements alanını kabul eder", () => {
    const r = jobMatchResultSchema.safeParse({ ...base, requirements: ["React", "TypeScript"] });
    expect(r.success).toBe(true);
  });

  it("requirements max 7: 7 kabul, 8 red", () => {
    const mk = (n: number) => ({ ...base, requirements: Array.from({ length: n }, (_, i) => `R${i}`) });
    expect(jobMatchResultSchema.safeParse(mk(7)).success).toBe(true);
    expect(jobMatchResultSchema.safeParse(mk(8)).success).toBe(false);
  });
});
