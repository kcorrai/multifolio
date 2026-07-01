import { describe, it, expect } from "vitest";
import en from "./en.json";
import tr from "./tr.json";

// Tüm iç içe anahtarları "a.b.c" düz yollarına açar.
function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, path)
      : [path];
  });
}

describe("mesaj katalogları", () => {
  it("en.json ve tr.json aynı anahtar setine sahip", () => {
    const enKeys = flatten(en).sort();
    const trKeys = flatten(tr).sort();
    const missingInTr = enKeys.filter((k) => !trKeys.includes(k));
    const missingInEn = trKeys.filter((k) => !enKeys.includes(k));
    expect(missingInTr, `tr.json'da eksik: ${missingInTr.join(", ")}`).toEqual([]);
    expect(missingInEn, `en.json'da eksik: ${missingInEn.join(", ")}`).toEqual([]);
  });
});
