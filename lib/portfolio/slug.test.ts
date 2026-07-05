import { describe, it, expect } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("temel: küçük harf + tire", () => {
    expect(slugify("Senior React Developer")).toBe("senior-react-developer");
  });

  it("TR harfleri ASCII'ye çevrilir", () => {
    expect(slugify("Üründür Şahin Çeğıöş")).toBe("urundur-sahin-cegios");
    expect(slugify("İç Mimar")).toBe("ic-mimar");
  });

  it("aksanlı Latin harfleri sadeleşir", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });

  it("özel karakter/çoklu boşluk tek tireye iner, baş/son tire kırpılır", () => {
    expect(slugify("  Full-Stack  &  UI/UX!! ")).toBe("full-stack-ui-ux");
  });

  it("boş/anlamsız girdi → boş string (route hex'e düşer)", () => {
    expect(slugify("")).toBe("");
    expect(slugify("!!!___")).toBe("");
    expect(slugify(null as unknown as string)).toBe("");
  });

  it("40 karakterle sınırlar, sondaki tireyi kırpar", () => {
    const s = slugify("a".repeat(30) + " " + "b".repeat(30));
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s.endsWith("-")).toBe(false);
  });
});
