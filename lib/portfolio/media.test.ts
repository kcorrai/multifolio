import { describe, it, expect } from "vitest";
import { buildGallery, buildProjectGroups } from "./media";
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
});
