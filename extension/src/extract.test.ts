import { describe, it, expect } from "vitest";
import { detectProfilePage, detectJobPage, extractJobBudget, clampText, pickImageUrls } from "./extract";

describe("detectJobPage", () => {
  it("Upwork iş ilanı detayı", () => {
    expect(detectJobPage("www.upwork.com", "/jobs/Senior-React-Developer_~021abc")).toBe("upwork");
    expect(detectJobPage("upwork.com", "/jobs/some-slug")).toBe("upwork");
  });
  it("LinkedIn tekil ilan", () => {
    expect(detectJobPage("www.linkedin.com", "/jobs/view/3812345678")).toBe("linkedin");
    expect(detectJobPage("tr.linkedin.com", "/jobs/view/999/")).toBe("linkedin");
  });
  it("ilan olmayan sayfalar null", () => {
    expect(detectJobPage("www.upwork.com", "/freelancers/~018f")).toBeNull(); // profil
    expect(detectJobPage("www.upwork.com", "/nx/search/jobs/")).toBeNull();   // arama
    expect(detectJobPage("www.linkedin.com", "/jobs/collections/recommended/")).toBeNull(); // feed
    expect(detectJobPage("www.linkedin.com", "/in/janedoe")).toBeNull();      // profil
    expect(detectJobPage("example.com", "/jobs/x")).toBeNull();
  });
});

describe("extractJobBudget", () => {
  it("para/aralık/saatlik desenleri", () => {
    expect(extractJobBudget("Budget: $1,500 fixed")).toBe("$1,500");
    expect(extractJobBudget("Rate $40-70 /hr for this")).toBe("$40-70 /hr");
    expect(extractJobBudget("Bütçe ₺5.000 civarı")).toBe("₺5.000");
  });
  it("para yoksa undefined", () => {
    expect(extractJobBudget("No compensation mentioned here")).toBeUndefined();
  });
});

describe("detectProfilePage", () => {
  it("Upwork profil biçimlerini tanır", () => {
    expect(detectProfilePage("www.upwork.com", "/freelancers/~018f2a4b6c")).toBe("upwork");
    expect(detectProfilePage("www.upwork.com", "/freelancers/~018f2a4b6c/portfolio")).toBe("upwork");
    expect(detectProfilePage("www.upwork.com", "/freelancers/jane-doe")).toBe("upwork");
    expect(detectProfilePage("www.upwork.com", "/fl/janedoe")).toBe("upwork");
    expect(detectProfilePage("upwork.com", "/freelancers/~0aabbcc123")).toBe("upwork");
  });
  it("Upwork profil-dışı sayfaları reddeder", () => {
    expect(detectProfilePage("www.upwork.com", "/")).toBeNull();
    expect(detectProfilePage("www.upwork.com", "/jobs/~021abc")).toBeNull();
    expect(detectProfilePage("www.upwork.com", "/nx/search/talent/")).toBeNull();
    expect(detectProfilePage("www.upwork.com", "/freelancers/")).toBeNull();
  });
  it("Fiverr kullanıcı yollarını tanır (kök + users/)", () => {
    expect(detectProfilePage("www.fiverr.com", "/janedoe")).toBe("fiverr");
    expect(detectProfilePage("www.fiverr.com", "/jane_doe99/")).toBe("fiverr");
    expect(detectProfilePage("www.fiverr.com", "/users/janedoe")).toBe("fiverr");
  });
  it("Fiverr rezerve yollarını ve derin yolları reddeder", () => {
    expect(detectProfilePage("www.fiverr.com", "/")).toBeNull();
    expect(detectProfilePage("www.fiverr.com", "/search/gigs?query=x")).toBeNull();
    expect(detectProfilePage("www.fiverr.com", "/categories/programming-tech")).toBeNull();
    expect(detectProfilePage("www.fiverr.com", "/login")).toBeNull();
    expect(detectProfilePage("www.fiverr.com", "/janedoe/portfolio")).toBeNull();
    expect(detectProfilePage("www.fiverr.com", "/logo-maker")).toBeNull();
  });
  it("LinkedIn /in/ profillerini tanır, diğer yolları reddeder", () => {
    expect(detectProfilePage("www.linkedin.com", "/in/jane-doe")).toBe("linkedin");
    expect(detectProfilePage("tr.linkedin.com", "/in/jane.doe")).toBe("linkedin");
    expect(detectProfilePage("www.linkedin.com", "/in/jane-doe/details/skills/")).toBe("linkedin");
    expect(detectProfilePage("www.linkedin.com", "/feed/")).toBeNull();
    expect(detectProfilePage("www.linkedin.com", "/jobs/view/123")).toBeNull();
    expect(detectProfilePage("www.linkedin.com", "/in/")).toBeNull();
  });
  it("başka hostları reddeder", () => {
    expect(detectProfilePage("www.evil.com", "/freelancers/~0abc123456")).toBeNull();
    expect(detectProfilePage("tr.fiverr.com", "/janedoe")).toBeNull();
    expect(detectProfilePage("evillinkedin.com", "/in/jane")).toBeNull();
  });
});

describe("clampText", () => {
  it("tavanı aşan metni kırpar, kısayı olduğu gibi bırakır", () => {
    expect(clampText("  abc  ")).toBe("abc");
    expect(clampText("x".repeat(60_000)).length).toBe(50_000);
    expect(clampText("x".repeat(100), 100).length).toBe(100);
  });
});

describe("pickImageUrls", () => {
  it("yalnız https, tekrarsız, en çok max döndürür", () => {
    const urls = pickImageUrls([
      "https://cdn.x.com/a.jpg",
      "https://cdn.x.com/a.jpg", // tekrar
      "http://cdn.x.com/b.jpg", // http
      "data:image/png;base64,x", // data
      "https://cdn.x.com/c.svg", // svg
      "https://cdn.x.com/logo.png", // logo
      "https://cdn.x.com/d.png",
    ]);
    expect(urls).toEqual(["https://cdn.x.com/a.jpg", "https://cdn.x.com/d.png"]);
  });
  it("max sınırını uygular", () => {
    const many = Array.from({ length: 20 }, (_, i) => `https://cdn.x.com/p${i}.jpg`);
    expect(pickImageUrls(many, 12)).toHaveLength(12);
  });
  it("1000 karakteri aşan URL'i eler (sunucu şeması tavanı)", () => {
    expect(pickImageUrls([`https://cdn.x.com/${"a".repeat(1000)}.jpg`])).toHaveLength(0);
  });
});
