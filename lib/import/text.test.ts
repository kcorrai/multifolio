import { describe, it, expect } from "vitest";
import { htmlToText, clampImportText, detectPlatformFromUrl, isSafeExternalUrl, isPrivateIp } from "./text";

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

describe("isPrivateIp (DNS-rebinding koruması)", () => {
  it("özel/loopback/link-local IPv4'ü reddeder, public'i geçirir", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true); // cloud metadata
    expect(isPrivateIp("0.0.0.0")).toBe(true);
    expect(isPrivateIp("224.0.0.1")).toBe(true); // multicast
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("172.32.0.1")).toBe(false); // 172.16-31 dışı
    expect(isPrivateIp("1.2.3.4")).toBe(false);
  });
  it("IPv6 loopback/unique-local/link-local ve IPv4-mapped'i reddeder", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fd12:3456::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false); // public (Cloudflare)
  });
});
