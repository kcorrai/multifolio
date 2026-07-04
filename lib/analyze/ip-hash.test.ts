import { describe, it, expect } from "vitest";
import { hashIp } from "./ip-hash";

describe("hashIp", () => {
  it("deterministiktir ve 64 karakter hex döner", () => {
    const a = hashIp("1.2.3.4", "salt");
    expect(a).toBe(hashIp("1.2.3.4", "salt"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
  it("farklı salt farklı hash üretir (ham IP geri türetilemez)", () => {
    expect(hashIp("1.2.3.4", "salt-a")).not.toBe(hashIp("1.2.3.4", "salt-b"));
  });
  it("farklı IP farklı hash üretir", () => {
    expect(hashIp("1.2.3.4", "s")).not.toBe(hashIp("1.2.3.5", "s"));
  });
});
