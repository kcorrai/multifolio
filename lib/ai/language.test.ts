import { describe, it, expect } from "vitest";
import { languageDirective, proposalLanguageDirective } from "./language";

// Global-only: her şey İngilizce.
describe("languageDirective", () => {
  it("İngilizce direktif verir", () => {
    const d = languageDirective("en");
    expect(d).toContain("English");
    expect(d).not.toContain("Türkçe");
  });
});

describe("proposalLanguageDirective", () => {
  it("content + coverage notlarını İngilizce yönlendirir", () => {
    const d = proposalLanguageDirective("en", "en");
    expect(d).toContain("English");
  });
});
