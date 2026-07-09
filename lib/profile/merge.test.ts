import { describe, it, expect } from "vitest";
import { itemPlatform, mergeByPlatform } from "./merge";

describe("itemPlatform", () => {
  it("öğenin platform alanını okur (yoksa null)", () => {
    expect(itemPlatform({ platform: "upwork" })).toBe("upwork");
    expect(itemPlatform({ platform: null })).toBeNull();
    expect(itemPlatform({ title: "x" })).toBeNull();
    expect(itemPlatform(null)).toBeNull();
    expect(itemPlatform("x")).toBeNull();
  });
});

describe("mergeByPlatform", () => {
  const up = (t: string) => ({ title: t, platform: "upwork" });
  const fi = (t: string) => ({ title: t, platform: "fiverr" });

  it("farklı platform aktarınca ikisi de kalır (birikim)", () => {
    const existing = [up("U1"), up("U2")];
    const merged = mergeByPlatform(existing, [{ title: "F1" }], "fiverr", 60);
    expect(merged.map((m) => m.title)).toEqual(["F1", "U1", "U2"]);
    expect(merged.find((m) => m.title === "F1")!.platform).toBe("fiverr"); // gelen etiketlendi
    expect(merged.filter((m) => m.platform === "upwork")).toHaveLength(2); // korundu
  });

  it("aynı platform tekrar aktarınca yalnız o platform yenilenir", () => {
    const existing = [up("U-eski-1"), up("U-eski-2"), fi("F1")];
    const merged = mergeByPlatform(existing, [{ title: "U-yeni" }], "upwork", 60);
    expect(merged.map((m) => m.title)).toEqual(["U-yeni", "F1"]); // eski Upwork çıktı, Fiverr kaldı
  });

  it("null (manuel) kaynak diğer platformları EZMEZ", () => {
    const existing = [up("U1"), fi("F1")];
    const merged = mergeByPlatform(existing, [{ title: "M1" }], null, 60);
    expect(merged.map((m) => m.title).sort()).toEqual(["F1", "M1", "U1"]);
  });

  it("cap uygulanır (yeni öğeler önce)", () => {
    const existing = [up("U1"), up("U2"), up("U3")];
    const merged = mergeByPlatform(existing, [{ title: "F1" }, { title: "F2" }], "fiverr", 3);
    expect(merged.map((m) => m.title)).toEqual(["F1", "F2", "U1"]);
  });

  it("mevcut boş/geçersizse yalnız geleni döner", () => {
    expect(mergeByPlatform(null, [{ title: "A" }], "upwork", 60).map((m) => m.title)).toEqual(["A"]);
    expect(mergeByPlatform(undefined, [{ title: "A" }], "upwork", 60)).toHaveLength(1);
  });
});
