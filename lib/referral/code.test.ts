import { describe, it, expect } from "vitest";
import { generateReferralCode, REFERRAL_CODE_LENGTH } from "./code";

describe("generateReferralCode", () => {
  it("8 karakter üretir", () => {
    expect(generateReferralCode()).toHaveLength(REFERRAL_CODE_LENGTH);
  });
  it("yalnız karışmayan alfabeyi kullanır (0/O/1/I/L yok)", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateReferralCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });
  it("ardışık çağrılar (pratikte) farklı kod üretir", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
