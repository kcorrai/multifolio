import { describe, it, expect } from "vitest";
import { extractKeywordsFromText, matchKeywords } from "./keywords";
import { cvContentSchema, type CvContent } from "@/lib/validation/schemas/cv";

function makeCv(over: Partial<CvContent> = {}): CvContent {
  return cvContentSchema.parse({ ...over });
}

describe("extractKeywordsFromText", () => {
  it("sözlük ifadelerini ve kısaltmaları çıkarır", () => {
    const kws = extractKeywordsFromText(
      "We need a React developer with strong TypeScript, SQL and AWS experience. Next.js a plus.",
    );
    expect(kws).toContain("react");
    expect(kws).toContain("typescript");
    expect(kws).toContain("sql");
    expect(kws).toContain("aws");
    expect(kws).toContain("next.js");
  });

  it("kelime sınırına saygı gösterir (kısmi eşleşme yok)", () => {
    // "go" kelimesi "google" içinde geçse de tek başına yoksa eklenmemeli.
    const kws = extractKeywordsFromText("Experience with Google Analytics required.");
    expect(kws).not.toContain("go");
    expect(kws).toContain("google analytics");
  });

  it("yaygın İngilizce ALLCAPS dolgu kelimelerini hariç tutar", () => {
    const kws = extractKeywordsFromText("YOU AND THE team WILL build things FOR US");
    expect(kws).not.toContain("you");
    expect(kws).not.toContain("and");
    expect(kws).not.toContain("the");
  });
});

describe("matchKeywords", () => {
  it("eşleşen ve eksik anahtar kelimeleri ayırır + kapsam yüzdesi", () => {
    const cv = makeCv({
      title: "Frontend Developer",
      skills: { hard: ["React", "TypeScript"], soft: [] },
      experience: [
        {
          company: "Acme", role: "Dev", location: "", startDate: "2020", endDate: "2022", current: false,
          bullets: ["Built dashboards with GraphQL"],
        },
      ],
    });
    const res = matchKeywords(cv, ["react", "typescript", "graphql", "kubernetes", "rust"]);
    expect(res.matched).toEqual(expect.arrayContaining(["react", "typescript", "graphql"]));
    expect(res.missing).toEqual(expect.arrayContaining(["kubernetes", "rust"]));
    expect(res.coveragePct).toBe(60);
  });

  it("boş anahtar kelime listesinde 0 döner", () => {
    const res = matchKeywords(makeCv(), []);
    expect(res.coveragePct).toBe(0);
    expect(res.matched).toEqual([]);
    expect(res.missing).toEqual([]);
  });

  it("kısmi kelime eşleşmesi saymaz", () => {
    const cv = makeCv({ skills: { hard: ["Google Analytics"], soft: [] } });
    const res = matchKeywords(cv, ["go"]);
    expect(res.matched).toEqual([]);
    expect(res.missing).toEqual(["go"]);
  });
});
