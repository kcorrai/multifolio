import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { iyziSignature, iyziAuthorizationHeader, makeRandomKey } from "./iyzico-sign";

describe("iyziSignature", () => {
  it("payload'ı randomKey + uriPath + requestBody sırasıyla HMAC-SHA256 hex(küçük) imzalar", () => {
    const secret = "sandbox-secret";
    const randomKey = "1722246017090123456789";
    const uriPath = "/payment/bin/check";
    const body = '{"binNumber":"589004"}';

    const expected = createHmac("sha256", secret)
      .update(randomKey + uriPath + body, "utf8")
      .digest("hex");

    const sig = iyziSignature(secret, randomKey, uriPath, body);
    expect(sig).toBe(expected);
    expect(sig).toMatch(/^[0-9a-f]{64}$/); // hex, küçük harf, 32 byte
  });

  it("gövde farkı imzayı değiştirir (bütünlük)", () => {
    const a = iyziSignature("s", "r", "/u", '{"x":1}');
    const b = iyziSignature("s", "r", "/u", '{"x":2}');
    expect(a).not.toBe(b);
  });
});

describe("iyziAuthorizationHeader", () => {
  it("IYZWSv2 + base64(apiKey&randomKey&signature) üretir ve geri çözülebilir", () => {
    const apiKey = "sandbox-apikey";
    const secretKey = "sandbox-secret";
    const randomKey = "1700000000000000000001";
    const uriPath = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
    const requestBody = '{"price":"349.0"}';

    const header = iyziAuthorizationHeader({ apiKey, secretKey, randomKey, uriPath, requestBody });
    expect(header.startsWith("IYZWSv2 ")).toBe(true);

    const decoded = Buffer.from(header.slice("IYZWSv2 ".length), "base64").toString("utf8");
    const sig = iyziSignature(secretKey, randomKey, uriPath, requestBody);
    expect(decoded).toBe(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${sig}`);
  });
});

describe("makeRandomKey", () => {
  it("zaman damgası + 9 haneli sıfır-dolgulu son ek", () => {
    expect(makeRandomKey(1700000000000, 0)).toBe("1700000000000000000000");
    expect(makeRandomKey(1700000000000, 0.123456789)).toBe("1700000000000123456789");
  });
});
