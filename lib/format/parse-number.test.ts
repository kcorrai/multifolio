import { describe, it, expect } from "vitest";
import { parseLocaleNumber } from "./parse-number";

describe("parseLocaleNumber", () => {
  it("TR binlik ayracını ('.') siler", () => {
    expect(parseLocaleNumber("50.000", "tr")).toBe(50000);
    expect(parseLocaleNumber("1.000.000", "tr")).toBe(1000000);
  });

  it("TR ondalığını (',') doğru okur", () => {
    expect(parseLocaleNumber("4,5", "tr")).toBe(4.5);
    expect(parseLocaleNumber("1.000,50", "tr")).toBe(1000.5);
  });

  it("EN binlik ayracını (',') siler", () => {
    expect(parseLocaleNumber("50,000", "en")).toBe(50000);
    expect(parseLocaleNumber("1,000,000", "en")).toBe(1000000);
  });

  it("EN ondalığını ('.') korur", () => {
    expect(parseLocaleNumber("10.5", "en")).toBe(10.5);
    expect(parseLocaleNumber("1,000.50", "en")).toBe(1000.5);
  });

  it("düz tamsayı her iki locale'de aynı", () => {
    expect(parseLocaleNumber("190", "tr")).toBe(190);
    expect(parseLocaleNumber("190", "en")).toBe(190);
  });

  it("boş/geçersiz girdide fallback döner", () => {
    expect(parseLocaleNumber("", "tr")).toBe(0);
    expect(parseLocaleNumber("   ", "en")).toBe(0);
    expect(parseLocaleNumber("abc", "tr", -1)).toBe(-1);
  });

  it("locale prefix'i toleranslı ('tr-TR' / 'en-US')", () => {
    expect(parseLocaleNumber("50.000", "tr-TR")).toBe(50000);
    expect(parseLocaleNumber("50,000", "en-US")).toBe(50000);
  });
});
