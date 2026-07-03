import { describe, it, expect } from "vitest";
import { buildPlatformProfileBlock } from "./platform-context";

describe("buildPlatformProfileBlock", () => {
  it("null/boş veri için boş string döner", () => {
    expect(buildPlatformProfileBlock(null)).toBe("");
    expect(buildPlatformProfileBlock(undefined)).toBe("");
    expect(buildPlatformProfileBlock({ headline: " ", summary: "", skills: [] })).toBe("");
  });

  it("dolu alanları satır satır ekler", () => {
    const block = buildPlatformProfileBlock({
      headline: "İç Mimar",
      summary: "10 yıllık deneyim.",
      skills: ["Autocad", "SketchUp"],
    });
    expect(block).toContain("Mevcut başlık: İç Mimar");
    expect(block).toContain("Mevcut özet: 10 yıllık deneyim.");
    expect(block).toContain("Autocad, SketchUp");
  });

  it("yalnız dolu alanları ekler (kısmi veri)", () => {
    const block = buildPlatformProfileBlock({ headline: "Dev", summary: "", skills: [] });
    expect(block).toContain("Mevcut başlık: Dev");
    expect(block).not.toContain("Mevcut özet");
    expect(block).not.toContain("beceriler");
  });

  it("uzun özeti kırpar", () => {
    const block = buildPlatformProfileBlock({ headline: "", summary: "a".repeat(1000), skills: [] });
    expect(block).toContain("…");
    expect(block.length).toBeLessThan(1000);
  });
});
