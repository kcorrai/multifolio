import { describe, it, expect } from "vitest";
import { parseAdminEmails, isAdminEmail } from "./admin";

describe("parseAdminEmails", () => {
  it("virgülle böler, trim + lowercase, boşları atar", () => {
    expect(parseAdminEmails(" A@x.com , b@Y.com ,, ")).toEqual(["a@x.com", "b@y.com"]);
  });
  it("boş/undefined → []", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails(null)).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  const csv = "owner@x.com, admin@y.com";
  it("listedeki e-posta (case-insensitive) → true", () => {
    expect(isAdminEmail("owner@x.com", csv)).toBe(true);
    expect(isAdminEmail("OWNER@X.com", csv)).toBe(true);
  });
  it("listede olmayan / boş → false", () => {
    expect(isAdminEmail("nope@z.com", csv)).toBe(false);
    expect(isAdminEmail(null, csv)).toBe(false);
    expect(isAdminEmail("owner@x.com", "")).toBe(false);
  });
  it("kodda gömülü sahip e-postası env boş olsa da → true (sıfır kurulum)", () => {
    expect(isAdminEmail("yanlizcakaan@gmail.com", "")).toBe(true);
    expect(isAdminEmail("YanlizcaKaan@Gmail.com", undefined)).toBe(true);
  });
});
