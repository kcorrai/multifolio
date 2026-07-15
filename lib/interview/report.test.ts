import { describe, it, expect } from "vitest";
import { buildSessionReport, overallScore } from "./report";
import type { InterviewQuestionRecord } from "@/lib/validation/schemas/mock-interview";

function q(partial: Partial<InterviewQuestionRecord>): InterviewQuestionRecord {
  return {
    category: "behavioral",
    question: "Q",
    strongAnswerHint: "hint",
    answer: null,
    score: null,
    strengths: [],
    improvements: [],
    modelAnswer: null,
    ...partial,
  };
}

describe("overallScore", () => {
  it("hiç yanıt yoksa null", () => {
    expect(overallScore([q({}), q({})])).toBeNull();
  });

  it("yalnız yanıtlananların ortalaması (yuvarlanmış)", () => {
    const questions = [
      q({ answer: "a", score: 80 }),
      q({ answer: "b", score: 70 }),
      q({}), // yanıtsız → dahil edilmez
    ];
    expect(overallScore(questions)).toBe(75);
  });
});

describe("buildSessionReport", () => {
  it("sayımları ve temaları çıkarır", () => {
    const questions = [
      q({ answer: "a", score: 60, strengths: ["Clear structure"], improvements: ["Add metrics", "Be specific"] }),
      q({ answer: "b", score: 90, strengths: ["clear structure"], improvements: ["add metrics"] }),
      q({}),
    ];
    const r = buildSessionReport(questions);
    expect(r.answeredCount).toBe(2);
    expect(r.totalCount).toBe(3);
    expect(r.overallScore).toBe(75);
    // En sık tekrar eden tema (normalize edilmiş) başta, orijinal yazım korunur.
    expect(r.topStrengths[0]).toBe("Clear structure");
    expect(r.topImprovements[0]).toBe("Add metrics");
  });

  it("boş/whitespace temaları atlar ve limiti uygular", () => {
    const questions = [
      q({ answer: "a", score: 50, improvements: ["  ", "One", "Two", "Three", "Four", "Five"] }),
    ];
    const r = buildSessionReport(questions, 3);
    expect(r.topImprovements).toHaveLength(3);
    expect(r.topImprovements).not.toContain("");
  });
});
