import { describe, it, expect } from "vitest";
import { assessProposal } from "./quality";

// İyi bir standart teklif (uzunluk ok, CTA var, jenerik/placeholder yok).
const GOOD = `I saw you need a React dashboard for real-time analytics. I've shipped 5 similar
products with React Query and GraphQL, cutting reporting time by 40%. I'd start with a 2-week MVP,
then a week of polish and testing. My recent work: a $2M GMV e-commerce platform on Next.js.
Let's discuss your timeline — I'm available to hop on a call today.`;

describe("assessProposal", () => {
  it("boş metin → weak, skor 0", () => {
    const q = assessProposal("", "standard");
    expect(q.score).toBe(0);
    expect(q.band).toBe("weak");
    expect(q.wordCount).toBe(0);
  });

  it("iyi teklif → yüksek skor, sorun yok", () => {
    const q = assessProposal(GOOD, "concise");
    expect(q.issues).toHaveLength(0);
    expect(q.score).toBe(100);
    expect(q.band).toBe("excellent");
  });

  it("CTA yoksa noCta işaretler", () => {
    const noCta = "I have ten years of React experience and built many dashboards for analytics teams with strong measurable results across projects.";
    expect(assessProposal(noCta, "concise").issues).toContain("noCta");
  });

  it("jenerik açılışı yakalar", () => {
    const q = assessProposal("Dear Sir, I am an expert. Let's discuss when you are ready to start.", "concise");
    expect(q.issues).toContain("generic");
  });

  it("düzenlenmemiş placeholder'ı yakalar", () => {
    const q = assessProposal("Hi [client name], let's discuss your {project} when you're ready to start today.", "concise");
    expect(q.issues).toContain("placeholder");
  });

  it("çok kısa → wordCountLow", () => {
    expect(assessProposal("Let's discuss.", "standard").issues).toContain("wordCountLow");
  });

  it("çok uzun → wordCountHigh", () => {
    const long = Array(300).fill("word").join(" ") + " let's discuss when ready.";
    expect(assessProposal(long, "concise").issues).toContain("wordCountHigh");
  });

  it("her sorun 20 puan düşürür", () => {
    // Kısa + CTA yok + jenerik = 3 sorun → 100 - 60 = 40 (fair).
    const q = assessProposal("I am an expert.", "standard");
    expect(q.issues.length).toBe(3);
    expect(q.score).toBe(40);
    expect(q.band).toBe("fair");
  });

  it("TR CTA'yı tanır (noCta işaretlemez)", () => {
    const tr = "Merhaba, bu proje için benzer 5 iş teslim ettim ve süreçleri hızlandırdım; detayları görüşelim, hemen başlayabilirim.";
    expect(assessProposal(tr, "concise").issues).not.toContain("noCta");
  });

  it("ilandan somut detay yoksa notSpecific işaretler", () => {
    const jd = "We need a Senior React and TypeScript developer to build a Next.js dashboard with GraphQL.";
    // İlanla hiçbir terim paylaşmayan jenerik teklif.
    const generic = "I am a passionate professional who delivers high quality work and always meets deadlines with great communication skills. Let's discuss.";
    expect(assessProposal(generic, "concise", jd).issues).toContain("notSpecific");
  });

  it("ilandan terim geçiyorsa notSpecific işaretlemez", () => {
    const jd = "We need a Senior React and TypeScript developer to build a Next.js dashboard with GraphQL.";
    const specific = "For your React and Next.js dashboard, I've shipped similar GraphQL apps. Let's discuss the timeline.";
    expect(assessProposal(specific, "concise", jd).issues).not.toContain("notSpecific");
  });

  it("ilan zayıf sinyalliyse (az terim) özgüllük kontrolü atlanır", () => {
    const weakJd = "Need help with my thing soon please.";
    const generic = "I am a passionate professional. Let's discuss.";
    expect(assessProposal(generic, "concise", weakJd).issues).not.toContain("notSpecific");
  });
});
