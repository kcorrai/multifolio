import { describe, it, expect } from "vitest";
import { scoreLead } from "./lead-score";
import type { LeadRow } from "@/lib/validation/schemas/lead";

function lead(over: Partial<LeadRow> = {}): LeadRow {
  return {
    id: "1", name: "Acme", email: "a@b.com", budget: null, project_type: null,
    timeline: null, message: "Hi", status: "new", created_at: "2026-07-01T00:00:00Z", ...over,
  };
}

describe("scoreLead", () => {
  it("zengin sinyalli lead hot olur", () => {
    const s = scoreLead(lead({
      budget: "$2,000-5,000",
      project_type: "Web app",
      timeline: "1 month",
      message: "x".repeat(320),
    }));
    expect(s.tier).toBe("hot");
    expect(s.reasons).toContain("solidBudget");
    expect(s.reasons).toContain("detailedMessage");
  });

  it("sinyalsiz kısa lead cold olur", () => {
    expect(scoreLead(lead({ message: "call me" })).tier).toBe("cold");
  });

  it("orta sinyal good olur", () => {
    const s = scoreLead(lead({ budget: "$300", message: "x".repeat(130) }));
    expect(s.tier).toBe("good");
    expect(s.reasons).toContain("hasBudget");
  });

  it("yüksek bütçe eşiği (>=500) solidBudget verir", () => {
    expect(scoreLead(lead({ budget: "800 USD" })).reasons).toContain("solidBudget");
    expect(scoreLead(lead({ budget: "200 USD" })).reasons).toContain("hasBudget");
  });
});
