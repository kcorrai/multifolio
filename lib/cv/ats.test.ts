import { describe, it, expect } from "vitest";
import { scoreCv, atsVerdict } from "./ats";
import { cvContentSchema, type CvContent } from "@/lib/validation/schemas/cv";

// Varsayılanlarla başlayıp üstüne yazan yardımcı (depolama şeması default'ları doldurur).
function makeCv(over: Partial<CvContent> = {}): CvContent {
  return cvContentSchema.parse({ ...over });
}

const strongCv = (): CvContent =>
  makeCv({
    fullName: "Ada Lovelace",
    title: "Senior Frontend Developer",
    contact: { email: "ada@example.com", phone: "+90 555 000 0000", location: "İstanbul", linkedin: "", website: "" },
    summary: "Frontend developer with 6 years building React apps that scaled to millions of users worldwide.",
    skills: { hard: ["React", "TypeScript", "Next.js", "GraphQL", "Testing"], soft: ["Communication"] },
    experience: [
      {
        company: "Acme",
        role: "Senior Developer",
        location: "Remote",
        startDate: "Jan 2020",
        endDate: "Present",
        current: true,
        bullets: ["Improved load time by 40% across 3 core pages", "Led a team of 5 engineers"],
      },
      {
        company: "Beta",
        role: "Developer",
        location: "İstanbul",
        startDate: "Jan 2018",
        endDate: "Dec 2019",
        current: false,
        bullets: ["Shipped 12 features increasing retention 15%"],
      },
    ],
  });

describe("scoreCv", () => {
  it("boş CV düşük skor + eksik bölüm bulguları döner", () => {
    const res = scoreCv(makeCv());
    expect(res.score).toBeLessThan(30);
    const codes = res.issues.map((i) => i.code);
    expect(codes).toContain("noEmail");
    expect(codes).toContain("noSkills");
    expect(codes).toContain("noExperience");
    expect(res.keywordCoverage).toBeNull();
  });

  it("güçlü CV yüksek skor + az bulgu", () => {
    const res = scoreCv(strongCv());
    expect(res.score).toBeGreaterThanOrEqual(75);
    expect(atsVerdict(res.score)).toBe("strong");
    expect(res.issues.map((i) => i.code)).not.toContain("noEmail");
  });

  it("nicelenmemiş madde işaretleri fewQuantified bulgusu üretir", () => {
    const cv = makeCv({
      contact: { email: "a@b.com", phone: "", location: "", linkedin: "", website: "" },
      summary: "Experienced developer building products for teams.",
      skills: { hard: ["React", "Node", "SQL", "AWS", "Docker"], soft: [] },
      experience: [
        {
          company: "X", role: "Dev", location: "", startDate: "2020", endDate: "2022", current: false,
          bullets: ["Responsible for the frontend", "Helped the team ship things"],
        },
      ],
    });
    const codes = scoreCv(cv).issues.map((i) => i.code);
    expect(codes).toContain("fewQuantified");
    expect(codes).toContain("fillerPhrases");
  });

  it("anahtar kelime kapsamını hesaplar ve düşükse bulgu ekler", () => {
    const cv = strongCv();
    const low = scoreCv(cv, ["Rust", "Kubernetes", "Go", "Elixir"]);
    expect(low.keywordCoverage).toBe(0);
    expect(low.issues.map((i) => i.code)).toContain("lowKeywordCoverage");

    const high = scoreCv(cv, ["React", "TypeScript", "Next.js"]);
    expect(high.keywordCoverage).toBe(100);
    expect(high.issues.map((i) => i.code)).not.toContain("lowKeywordCoverage");
  });

  it("dil adları anahtar kelime kapsamına dahil edilir (keywords.ts ile tutarlı)", () => {
    const cv = makeCv({
      ...strongCv(),
      languages: [
        { name: "English", level: "Fluent" },
        { name: "Turkish", level: "Native" },
      ],
    });
    const res = scoreCv(cv, ["English", "Turkish"]);
    expect(res.keywordCoverage).toBe(100);
  });

  it("tutarsız tarih (yıl yok) inconsistentDates üretir", () => {
    const cv = makeCv({
      contact: { email: "a@b.com", phone: "1", location: "", linkedin: "", website: "" },
      summary: "A summary long enough to count as present in the document body.",
      skills: { hard: ["React", "Node", "SQL", "AWS", "Docker"], soft: [] },
      experience: [
        {
          company: "X", role: "Dev", location: "", startDate: "January", endDate: "March", current: false,
          bullets: ["Boosted sales by 20%"],
        },
      ],
    });
    expect(scoreCv(cv).issues.map((i) => i.code)).toContain("inconsistentDates");
  });
});
