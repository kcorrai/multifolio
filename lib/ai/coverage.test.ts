import { describe, it, expect } from "vitest";
import {
  pendingRequirements,
  coverageSummary,
  buildRequirementsBlock,
  buildFocusBlock,
} from "@/lib/ai/coverage";
import type { ProposalCoverageItem } from "@/lib/validation/schemas/proposal";

const cov: ProposalCoverageItem[] = [
  { requirement: "React", status: "met", note: "" },
  { requirement: "Node.js", status: "partial", note: "" },
  { requirement: "AWS", status: "missing", note: "" },
];

describe("pendingRequirements", () => {
  it("met olmayanları döndürür", () => {
    expect(pendingRequirements(cov)).toEqual(["Node.js", "AWS"]);
  });
  it("boş dizi için boş döner", () => {
    expect(pendingRequirements([])).toEqual([]);
  });
});

describe("coverageSummary", () => {
  it("karşılanan/toplam sayar", () => {
    expect(coverageSummary(cov)).toEqual({ met: 1, total: 3 });
  });
});

describe("buildRequirementsBlock", () => {
  it("gereksinimleri listeler", () => {
    expect(buildRequirementsBlock(["A", "B"])).toBe(
      "\nİlan Gereksinimleri (bunları karşıla ve her birini değerlendir):\n- A\n- B",
    );
  });
  it("boş/undefined için boş string", () => {
    expect(buildRequirementsBlock()).toBe("");
    expect(buildRequirementsBlock([])).toBe("");
  });
});

describe("buildFocusBlock", () => {
  it("odak listesini üretir", () => {
    expect(buildFocusBlock(["X"])).toBe(
      "\nÖZELLİKLE şu eksik/kısmi gereksinimleri bu sefer açıkça karşıla:\n- X",
    );
  });
  it("boş için boş string", () => {
    expect(buildFocusBlock()).toBe("");
  });
});
