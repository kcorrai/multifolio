import { describe, it, expect } from "vitest";
import { CREDIT_COSTS } from "./costs";

describe("CREDIT_COSTS", () => {
  it("her aksiyon türü için pozitif tamsayı kredi tanımlar", () => {
    expect(CREDIT_COSTS.adaptation).toBe(2);
    expect(CREDIT_COSTS.job_match).toBe(2);
    expect(CREDIT_COSTS.proposal).toBe(3);
    expect(CREDIT_COSTS.profile_suggest).toBe(3);
    expect(CREDIT_COSTS.portfolio_generation).toBe(5);
    expect(CREDIT_COSTS.followup).toBe(2);
    expect(CREDIT_COSTS.cv_generation).toBe(5);
    expect(CREDIT_COSTS.cv_tailor).toBe(3);
    expect(CREDIT_COSTS.cv_bullets).toBe(3);
    expect(CREDIT_COSTS.cv_summary).toBe(2);
  });

  it("usage_events.kind ile birebir anahtar kullanır", () => {
    expect(Object.keys(CREDIT_COSTS).sort()).toEqual(
      ["adaptation", "cv_bullets", "cv_generation", "cv_summary", "cv_tailor", "followup", "job_match", "portfolio_generation", "profile_suggest", "proposal"],
    );
  });
});
