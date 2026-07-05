import { describe, it, expect } from "vitest";
import { isJunkTitle, stripBoilerplateTags, cleanScrapedRows } from "./quality";

describe("isJunkTitle", () => {
  it("spam kategorileri → junk", () => {
    expect(isJunkTitle("Online Casino Game Tester")).toBe(true);
    expect(isJunkTitle("Forex Trading Assistant")).toBe(true);
    expect(isJunkTitle("Administrative Data Entry File Clerk")).toBe(true);
  });

  it("jenerik/boş başlıklar → junk", () => {
    expect(isJunkTitle("All Positions")).toBe(true);
    expect(isJunkTitle("Jobs")).toBe(true);
    expect(isJunkTitle("")).toBe(true);
    expect(isJunkTitle("   ")).toBe(true);
  });

  it("meşru yazılım/tasarım ilanı → junk DEĞİL", () => {
    expect(isJunkTitle("Senior React Developer")).toBe(false);
    expect(isJunkTitle("Product Designer (Remote)")).toBe(false);
    expect(isJunkTitle("Data Engineer")).toBe(false); // 'data entry' değil
    expect(isJunkTitle("Backend Engineer, Payments")).toBe(false);
  });
});

describe("stripBoilerplateTags", () => {
  it("≥3 ilanın paylaştığı TAM etiket setini boşaltır (relevance başlığa düşer)", () => {
    const junkSet = ["design", "consulting", "exec", "customer support", "testing"];
    const rows = [
      { title: "Business Analyst", skills: [...junkSet] },
      { title: "HR Manager", skills: [...junkSet] },
      { title: "Casino Tester", skills: [...junkSet] },
      { title: "Senior React Dev", skills: ["react", "typescript", "next.js"] },
    ];
    const out = stripBoilerplateTags(rows);
    expect(out[0].skills).toEqual([]);
    expect(out[1].skills).toEqual([]);
    expect(out[2].skills).toEqual([]);
    // Benzersiz set korunur.
    expect(out[3].skills).toEqual(["react", "typescript", "next.js"]);
  });

  it("eşik altındaki (nadir) setleri KORUR", () => {
    const rows = [
      { title: "A", skills: ["react", "vue"] },
      { title: "B", skills: ["react", "vue"] }, // yalnız 2 → korunur
      { title: "C", skills: ["go"] },
    ];
    const out = stripBoilerplateTags(rows);
    expect(out[0].skills).toEqual(["react", "vue"]);
    expect(out[1].skills).toEqual(["react", "vue"]);
  });

  it("sıra/harf farkı önemsiz — normalize edilmiş imza", () => {
    const rows = [
      { title: "A", skills: ["React", "Node"] },
      { title: "B", skills: ["node", "react"] },
      { title: "C", skills: ["NODE", "React"] },
    ];
    const out = stripBoilerplateTags(rows);
    expect(out.every((r) => r.skills.length === 0)).toBe(true);
  });
});

describe("cleanScrapedRows", () => {
  it("çöp başlıkları eler + kalıp etiketleri temizler (frekans filtreden ÖNCE)", () => {
    const junkSet = ["design", "consulting", "exec"];
    const rows = [
      { title: "Online Casino Game Tester", skills: [...junkSet] },
      { title: "Data Entry Clerk", skills: [...junkSet] },
      { title: "Manager HR", skills: [...junkSet] },
      { title: "React Developer", skills: [...junkSet] }, // başlık ok ama etiket kalıp (4x ≥3)
      { title: "Vue Engineer", skills: ["vue", "vite"] },
    ];
    const out = cleanScrapedRows(rows);
    // casino + data entry elendi (başlık)
    expect(out.map((r) => r.title)).toEqual(["Manager HR", "React Developer", "Vue Engineer"]);
    // kalıp junkSet (4 ilanda) → başlık ok olanlarda da BOŞALTILDI
    expect(out.find((r) => r.title === "React Developer")!.skills).toEqual([]);
    expect(out.find((r) => r.title === "Manager HR")!.skills).toEqual([]);
    // benzersiz set korunur
    expect(out.find((r) => r.title === "Vue Engineer")!.skills).toEqual(["vue", "vite"]);
  });
});
