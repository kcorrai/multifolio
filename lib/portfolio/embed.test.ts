import { describe, it, expect } from "vitest";
import { getSafeEmbed } from "./embed";

describe("getSafeEmbed", () => {
  it("YouTube watch + youtu.be → embed src", () => {
    expect(getSafeEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.src).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(getSafeEmbed("https://youtu.be/dQw4w9WgXcQ")?.src).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("Vimeo → player src", () => {
    expect(getSafeEmbed("https://vimeo.com/123456789")?.src).toBe("https://player.vimeo.com/video/123456789");
  });

  it("Loom share → embed src", () => {
    const r = getSafeEmbed("https://www.loom.com/share/0123456789abcdef0123456789abcdef");
    expect(r?.provider).toBe("loom");
    expect(r?.src).toContain("/embed/");
  });

  it("Figma → embed with encoded url, sabit figma domaini", () => {
    const r = getSafeEmbed("https://www.figma.com/design/abc123/My-File");
    expect(r?.provider).toBe("figma");
    expect(r?.src.startsWith("https://www.figma.com/embed?")).toBe(true);
    expect(r?.src).toContain(encodeURIComponent("https://www.figma.com/design/abc123/My-File"));
  });

  it("izinsiz host / http / geçersiz → null (güvenlik)", () => {
    expect(getSafeEmbed("https://evil.com/embed")).toBeNull();
    expect(getSafeEmbed("http://youtube.com/watch?v=abcdef")).toBeNull(); // https değil
    expect(getSafeEmbed("javascript:alert(1)")).toBeNull();
    expect(getSafeEmbed("https://youtube.com/watch?v=<script>")).toBeNull(); // geçersiz id
    expect(getSafeEmbed("")).toBeNull();
    expect(getSafeEmbed(null)).toBeNull();
  });
});
