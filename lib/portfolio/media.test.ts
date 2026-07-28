import { describe, it, expect } from "vitest";
import {
  buildGallery, buildProjectGroups, carryGalleryHidden, carryProjectGroupHidden,
  visibleGallery, visibleProjectGroups,
} from "./media";
import type { PortfolioItem, ProfileProject } from "@/lib/validation/schemas/profile";

const item = (over: Partial<PortfolioItem>): PortfolioItem => ({
  title: "T", description: "", imageUrl: null, category: null, ...over,
});
const project = (over: Partial<ProfileProject>): ProfileProject => ({
  title: "P", description: "", role: "", skills: [], images: [], ...over,
});

describe("buildGallery", () => {
  it("url'siz öğeleri atlar, url'ye göre dedup eder, caption'ı 120'ye kırpar", () => {
    const g = buildGallery([
      item({ imageUrl: "https://x/a.png", title: "A" }),
      item({ imageUrl: null }),
      item({ imageUrl: "https://x/a.png", title: "dup" }),
      item({ imageUrl: "https://x/b.png", title: "y".repeat(200) }),
    ]);
    expect(g.map((i) => i.url)).toEqual(["https://x/a.png", "https://x/b.png"]);
    expect(g[1].caption.length).toBe(120);
  });

  it("24 ile sınırlar", () => {
    const many = Array.from({ length: 30 }, (_, i) => item({ imageUrl: `https://x/${i}.png` }));
    expect(buildGallery(many)).toHaveLength(24);
  });
});

describe("buildProjectGroups", () => {
  it("görselsiz projeyi atlar", () => {
    const groups = buildProjectGroups([
      project({ title: "Has img", images: [{ url: "https://x/1.png", caption: "" }] }),
      project({ title: "No img", images: [] }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe("Has img");
  });

  it("rol/açıklama/beceriyi taşır (modal için)", () => {
    const groups = buildProjectGroups([
      project({
        title: "Weather App", role: "Python Developer", description: "Sends reports.",
        skills: ["Python", "SMTP"], images: [{ url: "https://x/1.png", caption: "shot" }],
      }),
    ]);
    expect(groups[0]).toMatchObject({
      title: "Weather App", role: "Python Developer", description: "Sends reports.", skills: ["Python", "SMTP"],
    });
    expect(groups[0].images[0].url).toBe("https://x/1.png");
  });

  it("caption boşsa proje başlığına düşer", () => {
    const groups = buildProjectGroups([
      project({ title: "Proj", images: [{ url: "https://x/1.png", caption: "" }] }),
    ]);
    expect(groups[0].images[0].caption).toBe("Proj");
  });

  it("12 grupla sınırlar", () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      project({ title: `P${i}`, images: [{ url: `https://x/${i}.png`, caption: "" }] }),
    );
    expect(buildProjectGroups(many)).toHaveLength(12);
  });

  it("null/undefined güvenli", () => {
    expect(buildProjectGroups(null)).toEqual([]);
    expect(buildProjectGroups(undefined)).toEqual([]);
  });

  it("yeni gruplar varsayılan olarak görünür", () => {
    const groups = buildProjectGroups([
      project({ title: "P", images: [{ url: "https://x/1.png", caption: "" }] }),
    ]);
    expect(groups[0].hidden).toBe(false);
  });
});

describe("carryGalleryHidden", () => {
  const next = buildGallery([
    item({ imageUrl: "https://x/a.png" }),
    item({ imageUrl: "https://x/b.png" }),
  ]);

  it("eski gizleme seçimini url eşleşmesiyle taşır", () => {
    const carried = carryGalleryHidden(next, [
      { url: "https://x/a.png", hidden: true },
      { url: "https://x/b.png", hidden: false },
    ]);
    expect(carried.map((g) => g.hidden)).toEqual([true, false]);
  });

  it("eski listede olmayan yeni görsel görünür kalır", () => {
    const carried = carryGalleryHidden(next, [{ url: "https://x/zzz.png", hidden: true }]);
    expect(carried.every((g) => !g.hidden)).toBe(true);
  });

  it("bozuk/eksik önceki veriye dayanıklı (jsonb şekli garanti değil)", () => {
    expect(carryGalleryHidden(next, null)).toEqual(next);
    expect(carryGalleryHidden(next, "nope")).toEqual(next);
    expect(carryGalleryHidden(next, [null, 3, { hidden: true }])).toEqual(next);
  });
});

describe("carryProjectGroupHidden", () => {
  const next = buildProjectGroups([
    project({ title: "Weather App", images: [{ url: "https://x/1.png", caption: "" }] }),
    project({ title: "Shop", images: [{ url: "https://x/2.png", caption: "" }, { url: "https://x/3.png", caption: "" }] }),
  ]);

  it("grup gizlemesini başlıkla taşır (büyük/küçük harf + boşluk duyarsız)", () => {
    const carried = carryProjectGroupHidden(next, [
      { title: "  weather app ", hidden: true, images: [{ url: "https://x/1.png" }] },
    ]);
    expect(carried[0].hidden).toBe(true);
    expect(carried[1].hidden).toBe(false);
  });

  it("grup içi görsel gizlemesini url ile taşır", () => {
    const carried = carryProjectGroupHidden(next, [
      { title: "Shop", images: [{ url: "https://x/3.png", hidden: true }] },
    ]);
    expect(carried[1].images.map((im) => im.hidden)).toEqual([false, true]);
  });

  it("başlıksız grupta ilk görselin url'ini anahtar sayar", () => {
    const untitled = buildProjectGroups([
      project({ title: "", images: [{ url: "https://x/9.png", caption: "" }] }),
    ]);
    const carried = carryProjectGroupHidden(untitled, [
      { title: "", hidden: true, images: [{ url: "https://x/9.png" }] },
    ]);
    expect(carried[0].hidden).toBe(true);
  });

  it("bozuk/eksik önceki veriye dayanıklı", () => {
    expect(carryProjectGroupHidden(next, undefined)).toEqual(next);
    expect(carryProjectGroupHidden(next, [{ images: "x" }])).toEqual(next);
  });
});

describe("visibleGallery / visibleProjectGroups", () => {
  it("gizli galeri öğelerini eler", () => {
    expect(visibleGallery([
      { url: "https://x/a.png", caption: "", hidden: true },
      { url: "https://x/b.png", caption: "", hidden: false },
    ])).toHaveLength(1);
  });

  it("gizli grubu, gizli görseli ve tamamen boşalan grubu eler", () => {
    const groups = visibleProjectGroups([
      { title: "Hidden", role: "", description: "", skills: [], hidden: true,
        images: [{ url: "https://x/1.png", caption: "", hidden: false }] },
      { title: "Partly", role: "", description: "", skills: [], hidden: false,
        images: [
          { url: "https://x/2.png", caption: "", hidden: true },
          { url: "https://x/3.png", caption: "", hidden: false },
        ] },
      { title: "Emptied", role: "", description: "", skills: [], hidden: false,
        images: [{ url: "https://x/4.png", caption: "", hidden: true }] },
    ]);
    expect(groups.map((g) => g.title)).toEqual(["Partly"]);
    expect(groups[0].images.map((im) => im.url)).toEqual(["https://x/3.png"]);
  });
});
