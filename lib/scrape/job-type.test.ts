import { describe, it, expect } from "vitest";
import { normalizeJobType, inferJobTypeFromTags } from "./job-type";

describe("normalizeJobType", () => {
  it("kanonik değerleri aynen tanır", () => {
    expect(normalizeJobType("full_time")).toBe("full_time");
    expect(normalizeJobType("contract")).toBe("contract");
    expect(normalizeJobType("freelance")).toBe("freelance");
    expect(normalizeJobType("part_time")).toBe("part_time");
    expect(normalizeJobType("internship")).toBe("internship");
  });

  it("farklı yazımları (boşluk/tire/büyük harf) eşler", () => {
    expect(normalizeJobType("Full Time")).toBe("full_time");
    expect(normalizeJobType("full-time")).toBe("full_time");
    expect(normalizeJobType("FULLTIME")).toBe("full_time");
    expect(normalizeJobType("Part-Time")).toBe("part_time");
  });

  it("eş anlamlıları kanonik türe indirger", () => {
    expect(normalizeJobType("contractor")).toBe("contract");
    expect(normalizeJobType("temporary")).toBe("contract");
    expect(normalizeJobType("freelancer")).toBe("freelance");
    expect(normalizeJobType("intern")).toBe("internship");
    expect(normalizeJobType("permanent")).toBe("full_time");
  });

  it("tanınmayan/boş/null → null (lenient)", () => {
    expect(normalizeJobType("volunteer")).toBeNull();
    expect(normalizeJobType("")).toBeNull();
    expect(normalizeJobType(null)).toBeNull();
    expect(normalizeJobType(undefined)).toBeNull();
  });
});

describe("inferJobTypeFromTags", () => {
  it("tag listesindeki ilk tanınabilir türü döner", () => {
    expect(inferJobTypeFromTags(["react", "contract", "senior"])).toBe("contract");
    expect(inferJobTypeFromTags(["Freelance", "design"])).toBe("freelance");
  });

  it("ipucu yoksa null (varsayım yapmaz)", () => {
    expect(inferJobTypeFromTags(["react", "node", "aws"])).toBeNull();
    expect(inferJobTypeFromTags([])).toBeNull();
    expect(inferJobTypeFromTags(null)).toBeNull();
  });
});
