import { describe, it, expect } from "vitest";
import { languageDirective, proposalLanguageDirective } from "./language";

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

describe("proposalLanguageDirective", () => {
  it("content dili ile note dilini ayrı yönlendirir (TR kullanıcı × EN platform)", () => {
    const d = proposalLanguageDirective("en", "tr");
    expect(d).toContain("'content' alanını İngilizce");
    expect(d).toContain("note alanlarını Türkçe");
  });
  it("iki dil aynıysa da tutarlı direktif üretir", () => {
    const d = proposalLanguageDirective("tr", "tr");
    expect(d).toContain("'content' alanını Türkçe");
    expect(d).toContain("note alanlarını Türkçe");
  });
});
