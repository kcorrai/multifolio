import { describe, it, expect } from "vitest";
import { buildVoiceBlock } from "./voice";

describe("buildVoiceBlock", () => {
  it("örnek yoksa boş", () => {
    expect(buildVoiceBlock([])).toBe("");
    expect(buildVoiceBlock([null, undefined, "  "])).toBe("");
  });

  it("örnek varsa üslup direktifi + örnekleri içerir", () => {
    const d = buildVoiceBlock(["Merhaba, projenizi inceledim..."]);
    expect(d).toContain("YAZIM ÜSLUBUNU");
    expect(d).toContain("KOPYALAMA");
    expect(d).toContain("Merhaba, projenizi inceledim");
  });

  it("en fazla 3 örnek alır", () => {
    const d = buildVoiceBlock(["a", "b", "c", "d", "e"]);
    expect(d).toContain("Örnek 3");
    expect(d).not.toContain("Örnek 4");
  });

  it("boş/whitespace örnekleri eler", () => {
    const d = buildVoiceBlock(["gerçek teklif", "", "  ", "ikinci teklif"]);
    expect(d).toContain("Örnek 1");
    expect(d).toContain("Örnek 2");
    expect(d).not.toContain("Örnek 3");
  });

  it("uzun örneği kırpar", () => {
    const long = "x".repeat(2000);
    const d = buildVoiceBlock([long]);
    expect(d).toContain("…");
    expect(d.length).toBeLessThan(1000);
  });
});
