import { describe, it, expect } from "vitest";
import { parseGuruSlug, normalizeGuruProfile, guruHeadlineFromOg, isGuruBoilerplate } from "./guru";

// Fixture, 2026-07-20'de guru.com/freelancers/brandon-washington-1'den ÖLÇÜLEN yapı:
// ProfilePage → mainEntity(Person); description İÇİNDE <br /> var; başlık yalnız
// og:description'da ve bio'ya AYRAÇSIZ yapışık geliyor.
const HTML = `<!doctype html><html><head>
<meta property="og:description" content="Brandon Washington 1 - Reliable Web and SaaS Systems That Scale Without ChaosIf you are unsure where to start, I offer two low-risk entry - Find and hire freelancers on Guru" />
<meta property="og:image" content="https://res.cloudinary.com/gurucom/image/upload/v1/x.jpg" />
<script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfilePage",
"mainEntity":{"@type":"Person","name":"Brandon Washington 1","identifier":"5067108",
"description":"If you are unsure where to start, I offer two low-risk entry points:<br /><br />• SaaS Audit ($500 minimum).",
"image":"https://res.cloudinary.com/gurucom/image/upload/f_auto/v1/x.jpg"}}</script>
</head><body></body></html>`;

describe("parseGuruSlug", () => {
  it("guru.com/freelancers/{slug} slug'ı çıkarır", () => {
    expect(parseGuruSlug("https://www.guru.com/freelancers/brandon-washington-1")).toBe("brandon-washington-1");
  });

  it("dizin sayfasını (/d/freelancers/) ve yabancı host'u reddeder", () => {
    expect(parseGuruSlug("https://www.guru.com/d/freelancers/")).toBeNull();
    expect(parseGuruSlug("https://www.guru.com/freelancers")).toBeNull();
    expect(parseGuruSlug("https://example.com/freelancers/x")).toBeNull();
  });
});

describe("guruHeadlineFromOg", () => {
  // Kritik: başlık ile bio arasında ayraç YOK; bio bilinerek çıkarılır.
  it("isim önekini, pazarlama ekini ve yapışık bio'yu ayıklar", () => {
    const og = "Brandon Washington 1 - Reliable Web and SaaS Systems That Scale Without ChaosIf you are unsure where to start - Find and hire freelancers on Guru";
    expect(guruHeadlineFromOg(og, "Brandon Washington 1", "If you are unsure where to start"))
      .toBe("Reliable Web and SaaS Systems That Scale Without Chaos");
  });

  it("bio verilmezse en azından isim/pazarlama ekini temizler", () => {
    const og = "Jane Doe - Senior Designer - Find and hire freelancers on Guru";
    expect(guruHeadlineFromOg(og, "Jane Doe")).toBe("Senior Designer");
  });

  it("boş og'da boş döner", () => {
    expect(guruHeadlineFromOg("", "Jane")).toBe("");
  });
});

describe("isGuruBoilerplate", () => {
  it("bio yazmamış profillerin kalıp metnini tanır", () => {
    expect(isGuruBoilerplate("Review the skills and services offered by YanBin Pang on Guru.")).toBe(true);
    expect(isGuruBoilerplate("I build reliable SaaS systems.")).toBe(false);
  });
});

describe("normalizeGuruProfile", () => {
  it("başlığı og'dan, özeti ld+json'dan çıkarır ve <br /> temizler", () => {
    const p = normalizeGuruProfile(HTML, "brandon-washington-1");
    expect(p).not.toBeNull();
    expect(p!.draft.headline).toBe("Reliable Web and SaaS Systems That Scale Without Chaos");
    expect(p!.draft.summary).toContain("low-risk entry points:");
    expect(p!.draft.summary).not.toContain("<br");
    expect(p!.avatarUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
  });

  // Canlı örnek: guru.com/freelancers/yanbin-pang — kullanıcı bio yazmamış, Guru
  // kalıp metni basıyor ve og'da başlık yerine yalnız isim var. İçe aktarılacak
  // anlamlı hiçbir alan yok → null (aksi halde profile isim başlık diye yazılırdı).
  it("yalnız kalıp metin varsa (gerçek bio yok) null döner — çöp içe aktarılmaz", () => {
    const html = `<!doctype html><html><head>
      <meta property="og:description" content="YanBin Pang - Find and hire freelancers on Guru" />
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfilePage",
      "mainEntity":{"@type":"Person","name":"YanBin Pang",
      "description":"Review the skills and services offered by YanBin Pang on Guru.",
      "image":"https://res.cloudinary.com/gurucom/image/upload/v1/y.jpg"}}</script>
      </head><body></body></html>`;
    expect(normalizeGuruProfile(html, "yanbin-pang")).toBeNull();
  });

  it("ld+json yoksa null döner", () => {
    expect(normalizeGuruProfile("<html><body>x</body></html>", "s")).toBeNull();
  });
});
