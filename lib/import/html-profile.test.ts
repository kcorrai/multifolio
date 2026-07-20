import { describe, it, expect } from "vitest";
import {
  parseFreelancerUsername,
  parsePeopleperhourPath,
  isGenericShareImage,
  normalizeHtmlProfile,
  sliceContentRegion,
} from "./html-profile";

describe("parseFreelancerUsername", () => {
  it("freelancer.com/u/{username} ve bölgesel alan adlarını çözer", () => {
    expect(parseFreelancerUsername("https://www.freelancer.com/u/subhraniljana")).toBe("subhraniljana");
    expect(parseFreelancerUsername("https://www.freelancer.com.tr/u/ahmet_y")).toBe("ahmet_y");
    expect(parseFreelancerUsername("https://www.freelancer.com/u/jane.html")).toBe("jane"); // .html eki
  });

  it("proje/dizin yollarını ve yabancı host'u reddeder", () => {
    expect(parseFreelancerUsername("https://www.freelancer.com/projects/php/x")).toBeNull();
    expect(parseFreelancerUsername("https://www.freelancer.com/u/a/b")).toBeNull();
    expect(parseFreelancerUsername("https://example.com/u/x")).toBeNull();
  });
});

describe("parsePeopleperhourPath", () => {
  it("/freelancer/{kategori}/{slug} yolunu döner", () => {
    expect(
      parsePeopleperhourPath("https://www.peopleperhour.com/freelancer/technology-programming/abeselom-zxz"),
    ).toBe("/freelancer/technology-programming/abeselom-zxz");
  });

  it("kategori sayfasını (slug'sız) ve yabancı host'u reddeder", () => {
    expect(parsePeopleperhourPath("https://www.peopleperhour.com/freelancer/design")).toBeNull();
    expect(parsePeopleperhourPath("https://example.com/freelancer/a/b")).toBeNull();
  });
});

describe("isGenericShareImage", () => {
  // Freelancer.com her profilde AYNI paylaşım görselini og:image olarak veriyor —
  // avatar sanıp kaydedilirse bütün kullanıcılar aynı fotoğrafı alır.
  it("Freelancer'ın jenerik paylaşım görselini tanır", () => {
    expect(isGenericShareImage("https://www.f-cdn.com/assets/main/en/assets/app-icons/share-make-it-real-thumbnail-1200x630.jpg")).toBe(true);
    expect(isGenericShareImage("https://cdn.example.com/uploads/real-avatar.jpg")).toBe(false);
  });
});

describe("sliceContentRegion", () => {
  // Freelancer.com'da navigasyon devasa bir kategori listesi taşıyor; tüm gövde AI'a
  // verilirse model menüden başlık üretebiliyor. Bölge daraltması bunu kaynağında keser.
  it("kapsayıcı etiketin içini keser, navigasyonu dışarıda bırakır", () => {
    const html = `<body><nav>Shopify Web Designers WordPress Web Designers</nav>
      <app-user-profile class="x"><h1>Jane</h1><p>Gerçek bio</p></app-user-profile>
      <footer>alt bilgi</footer></body>`;
    const r = sliceContentRegion(html, ["app-user-profile", "main"]);
    expect(r).toContain("Gerçek bio");
    expect(r).not.toContain("Shopify Web Designers");
    expect(r).not.toContain("alt bilgi");
  });

  it("ÖNEK paylaşan iç bileşenler kapanışı yanlış eşleştirmez", () => {
    const html = `<app-user-profile><app-user-profile-header>Baslik</app-user-profile-header><p>Govde</p></app-user-profile>`;
    const r = sliceContentRegion(html, ["app-user-profile"]);
    expect(r).toContain("Baslik");
    expect(r).toContain("Govde");
  });

  it("etiketlerden hiçbiri yoksa tüm gövdeye düşer", () => {
    const html = "<body><p>sadece bu</p></body>";
    expect(sliceContentRegion(html, ["main"])).toBe(html);
  });

  it("sıradaki ilk bulunan etiket kazanır", () => {
    const html = "<main><p>ana</p></main>";
    expect(sliceContentRegion(html, ["app-user-profile", "main"])).toContain("ana");
  });
});

describe("normalizeHtmlProfile", () => {
  const HTML = `<!doctype html><html><head>
    <meta property="og:description" content="AI Full Stack, web developer, designer" />
    <meta property="og:image" content="https://cdn.example.com/uploads/photo.jpg" />
    </head><body><main><h1>Abeselom S.</h1><p>Ten years of Node and React work.</p></main></body></html>`;

  it("og'dan başlık ipucu + gerçek avatarı, gövdeden metni çıkarır", () => {
    const r = normalizeHtmlProfile(HTML);
    expect(r.headlineHint).toBe("AI Full Stack, web developer, designer");
    expect(r.avatarUrl).toBe("https://cdn.example.com/uploads/photo.jpg");
    expect(r.text).toContain("Ten years of Node and React work.");
  });

  it("jenerik paylaşım görselini avatar olarak KABUL ETMEZ", () => {
    const html = HTML.replace(
      "https://cdn.example.com/uploads/photo.jpg",
      "https://www.f-cdn.com/assets/share-make-it-real-thumbnail-1200x630.jpg",
    );
    expect(normalizeHtmlProfile(html).avatarUrl).toBeNull();
  });

  it("script/style gürültüsü metne sızmaz", () => {
    const html = `<html><body><script>var secret=1</script><style>.a{color:red}</style><main>Gerçek içerik</main></body></html>`;
    const r = normalizeHtmlProfile(html);
    expect(r.text).toContain("Gerçek içerik");
    expect(r.text).not.toContain("secret");
    expect(r.text).not.toContain("color:red");
  });
});
