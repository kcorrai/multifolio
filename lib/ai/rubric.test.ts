import { describe, expect, it } from "vitest";
import { RUBRIC_WEIGHTS, computeRubricScore, rubricVerdict } from "./rubric";
import { RUBRIC_KEYS, jobMatchAiSchema, jobMatchResultSchema } from "@/lib/validation/schemas/job";
import type { JobMatchRubric } from "@/lib/validation/schemas/job";

function mkRubric(scores: [number, number, number, number]): JobMatchRubric {
  const [skill, exp, budget, quality] = scores;
  return {
    skill_fit: { score: skill, reason: "r" },
    experience_fit: { score: exp, reason: "r" },
    budget_fit: { score: budget, reason: "r" },
    listing_quality: { score: quality, reason: "r" },
  };
}

describe("RUBRIC_WEIGHTS", () => {
  it("ağırlıklar toplamı 1'dir ve tüm boyutları kapsar", () => {
    const total = RUBRIC_KEYS.reduce((sum, k) => sum + RUBRIC_WEIGHTS[k], 0);
    expect(total).toBeCloseTo(1);
  });
});

describe("computeRubricScore", () => {
  it("ağırlıklı toplamı hesaplar (40/30/20/10)", () => {
    // 80*0.4 + 60*0.3 + 40*0.2 + 20*0.1 = 32+18+8+2 = 60
    expect(computeRubricScore(mkRubric([80, 60, 40, 20]))).toBe(60);
  });

  it("uç değerler: hepsi 0 → 0, hepsi 100 → 100", () => {
    expect(computeRubricScore(mkRubric([0, 0, 0, 0]))).toBe(0);
    expect(computeRubricScore(mkRubric([100, 100, 100, 100]))).toBe(100);
  });

  it("küsuratı yuvarlar", () => {
    // 51*0.4 + 50*0.3 + 50*0.2 + 50*0.1 = 50.4 → 50
    expect(computeRubricScore(mkRubric([51, 50, 50, 50]))).toBe(50);
    // 52*0.4 + 51*0.3 + 50*0.2 + 51*0.1 = 51.2 → 51; yarım-yukarı için 50.5:
    // 55*0.4 + 45*0.3 + 50*0.2 + 50*0.1 = 22+13.5+10+5 = 50.5 → 51
    expect(computeRubricScore(mkRubric([55, 45, 50, 50]))).toBe(51);
  });
});

describe("rubricVerdict", () => {
  it("eşikler skor renkleriyle hizalı: ≥70 go, ≥40 maybe, <40 skip", () => {
    expect(rubricVerdict(70)).toBe("go");
    expect(rubricVerdict(100)).toBe("go");
    expect(rubricVerdict(69)).toBe("maybe");
    expect(rubricVerdict(40)).toBe("maybe");
    expect(rubricVerdict(39)).toBe("skip");
    expect(rubricVerdict(0)).toBe("skip");
  });
});

describe("şema geriye uyumu", () => {
  const base = {
    score: 75,
    strengths: ["a"],
    gaps: [],
    requirements: ["React"],
    summary: "s",
  };

  it("jobMatchResultSchema rubriksiz ESKİ satırı kabul eder", () => {
    expect(jobMatchResultSchema.safeParse(base).success).toBe(true);
  });

  it("jobMatchResultSchema rubrik + verdict'li YENİ satırı kabul eder", () => {
    const parsed = jobMatchResultSchema.safeParse({
      ...base,
      rubric: mkRubric([80, 70, 60, 50]),
      verdict: "go",
    });
    expect(parsed.success).toBe(true);
  });

  it("jobMatchAiSchema rubriksiz üretimi REDDEDER (AI çıktısında zorunlu)", () => {
    expect(jobMatchAiSchema.safeParse(base).success).toBe(false);
  });
});
