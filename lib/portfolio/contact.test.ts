import { describe, it, expect } from "vitest";
import { validateContactEmail, validateContactUrl } from "./contact";

describe("validateContactEmail", () => {
  it("geçerli e-postayı trim'leyip döner", () => {
    expect(validateContactEmail("  ada@example.com ")).toBe("ada@example.com");
  });
  it("geçersiz/boş için null", () => {
    expect(validateContactEmail("not-an-email")).toBeNull();
    expect(validateContactEmail("")).toBeNull();
    expect(validateContactEmail(null)).toBeNull();
    expect(validateContactEmail(undefined)).toBeNull();
  });
});

describe("validateContactUrl", () => {
  it("http(s) URL'yi trim'leyip döner", () => {
    expect(validateContactUrl(" https://me.dev ")).toBe("https://me.dev");
    expect(validateContactUrl("http://me.dev")).toBe("http://me.dev");
  });
  it("http(s) olmayan/boş için null (javascript:, mailto:, çıplak alan)", () => {
    expect(validateContactUrl("javascript:alert(1)")).toBeNull();
    expect(validateContactUrl("me.dev")).toBeNull();
    expect(validateContactUrl("mailto:a@b.com")).toBeNull();
    expect(validateContactUrl("")).toBeNull();
    expect(validateContactUrl(null)).toBeNull();
  });
});
