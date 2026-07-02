import { describe, it, expect } from "vitest";
import { htmlToText, clampImportText, detectPlatformFromUrl, isSafeExternalUrl } from "./text";

describe("htmlToText", () => {
  it("script/style söker, tag'leri boşluğa çevirir, whitespace toplar", () => {
    const html = "<html><head><style>.a{color:red}</style><script>alert(1)</script></head><body><h1>Ali Veli</h1><p>Senior   React dev</p></body></html>";
    expect(htmlToText(html)).toBe("Ali Veli Senior React dev");
  });
  it("HTML entity'leri çözer (temel küme)", () => {
    expect(htmlToText("<p>React &amp; Node &#39;uzmanı&#39;</p>")).toBe("React & Node 'uzmanı'");
  });
});

describe("clampImportText", () => {
  it("20k üstünü kırpar", () => {
    expect(clampImportText("x".repeat(30_000)).length).toBe(20_000);
    expect(clampImportText("kısa")).toBe("kısa");
  });
});

describe("detectPlatformFromUrl", () => {
  it("bilinen platform host'larını tanır (www/subdomain dahil)", () => {
    expect(detectPlatformFromUrl("https://www.upwork.com/freelancers/~01ab")).toBe("upwork");
    expect(detectPlatformFromUrl("https://tr.fiverr.com/kaan")).toBe("fiverr");
    expect(detectPlatformFromUrl("https://bionluk.com/kaan")).toBe("bionluk");
    expect(detectPlatformFromUrl("https://armut.com/hizmet/kaan")).toBe("armut");
    expect(detectPlatformFromUrl("https://www.linkedin.com/in/kaan")).toBe("linkedin");
    expect(detectPlatformFromUrl("https://evil-upwork.com/x")).toBeNull();
    expect(detectPlatformFromUrl("https://ornek.com/cv")).toBeNull();
  });
});

describe("isSafeExternalUrl", () => {
  it("http(s) dışını, localhost'u ve özel IP'leri reddeder", () => {
    expect(isSafeExternalUrl("https://www.upwork.com/x")).toBe(true);
    expect(isSafeExternalUrl("http://ornek.com")).toBe(true);
    expect(isSafeExternalUrl("ftp://x.com")).toBe(false);
    expect(isSafeExternalUrl("http://localhost:3000/admin")).toBe(false);
    expect(isSafeExternalUrl("http://127.0.0.1/x")).toBe(false);
    expect(isSafeExternalUrl("http://192.168.1.8/x")).toBe(false);
    expect(isSafeExternalUrl("http://10.0.0.5/x")).toBe(false);
    expect(isSafeExternalUrl("http://169.254.169.254/meta")).toBe(false);
  });
});
