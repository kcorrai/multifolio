import { describe, it, expect } from "vitest";
import { portfolioTheme, ACCENT_HEX, PORTFOLIO_PRESETS, PORTFOLIO_ACCENTS } from "./theme";

describe("portfolioTheme", () => {
  it("her preset+accent kombinasyonu için tam CSS değişken seti döner", () => {
    for (const preset of PORTFOLIO_PRESETS) {
      for (const accent of PORTFOLIO_ACCENTS) {
        const { vars } = portfolioTheme(preset, accent);
        const v = vars as Record<string, string>;
        expect(v["--pf-bg"]).toBeTruthy();
        expect(v["--pf-text"]).toBeTruthy();
        expect(v["--pf-accent"]).toBe(ACCENT_HEX[accent]);
      }
    }
  });

  it("noir koyu, studio/atelier açık", () => {
    expect(portfolioTheme("noir", "blue").dark).toBe(true);
    expect(portfolioTheme("studio", "blue").dark).toBe(false);
    expect(portfolioTheme("atelier", "blue").dark).toBe(false);
  });

  it("atelier serif başlık fontu, studio/noir sans kullanır", () => {
    const heading = (p: Parameters<typeof portfolioTheme>[0]) =>
      (portfolioTheme(p, "blue").vars as Record<string, string>)["--pf-heading-font"];
    expect(heading("atelier")).toContain("fraunces");
    expect(heading("studio")).toContain("archivo");
    expect(heading("noir")).toContain("archivo");
  });

  it("geçersiz preset/accent güvenli varsayılana düşer (studio/blue)", () => {
    // @ts-expect-error kasıtlı geçersiz girdi
    const { vars, dark } = portfolioTheme("bogus", "bogus");
    const v = vars as Record<string, string>;
    expect(dark).toBe(false);
    expect(v["--pf-accent"]).toBe(ACCENT_HEX.blue);
  });
});
