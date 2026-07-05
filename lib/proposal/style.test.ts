import { describe, it, expect } from "vitest";
import { buildStyleDirective, PROPOSAL_TONES, PROPOSAL_LENGTHS } from "./style";

describe("buildStyleDirective", () => {
  it("ikisi de yoksa boş (eski davranış korunur)", () => {
    expect(buildStyleDirective()).toBe("");
    expect(buildStyleDirective(null, null)).toBe("");
  });

  it("ton verilince ton satırı ekler", () => {
    const d = buildStyleDirective("friendly");
    expect(d).toContain("Yazım tonu");
    expect(d).toContain("samimi");
    expect(d).not.toContain("uzunluğu");
  });

  it("uzunluk verilince uzunluk satırı ekler", () => {
    const d = buildStyleDirective(null, "concise");
    expect(d).toContain("Teklif uzunluğu");
    expect(d).toContain("80-120");
  });

  it("ikisi birlikte", () => {
    const d = buildStyleDirective("confident", "detailed");
    expect(d).toContain("kendinden emin");
    expect(d).toContain("250-350");
    expect(d.trim().split("\n")).toHaveLength(2);
  });

  it("tüm enum değerleri direktif üretir (eksik map yok)", () => {
    for (const t of PROPOSAL_TONES) expect(buildStyleDirective(t)).not.toBe("");
    for (const l of PROPOSAL_LENGTHS) expect(buildStyleDirective(null, l)).not.toBe("");
  });
});
