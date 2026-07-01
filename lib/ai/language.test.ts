import { describe, it, expect } from "vitest";
import { languageDirective } from "./language";

describe("languageDirective", () => {
  it("en için İngilizce direktif verir", () => {
    const d = languageDirective("en");
    expect(d).toContain("English");
    expect(d).not.toContain("Türkçe");
  });
  it("tr için Türkçe direktif verir", () => {
    const d = languageDirective("tr");
    expect(d).toContain("Türkçe");
    expect(d).not.toContain("English");
  });
});
