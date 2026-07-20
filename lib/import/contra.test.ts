import { describe, it, expect } from "vitest";
import { parseContraUsername, normalizeContraProfile } from "./contra";

// Fixture, 2026-07-20'de contra.com/andreadinardo'dan ÖLÇÜLEN gerçek ld+json yapısı
// (@graph içinde Person; jobTitle = değer önerisi cümlesi, description = bio).
const HTML = `<!doctype html><html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
{"@context":"https://schema.org","@id":"https://contra.com/andreadinardo","@type":"Person",
"address":"San Francisco",
"description":"I'm Andrea—brand strategist and copywriter. I help brands escape generic copy.",
"image":"https://media.contra.com/image/upload/c_fill,h_1000,w_1000/abc.avif",
"jobTitle":"Helping growth-stage brands tell their story.",
"name":"Andrea DiNardo",
"sameAs":["https://www.linkedin.com/in/andreadinardo/"],
"url":"https://contra.com/andreadinardo"},
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}]}</script>
</head><body></body></html>`;

describe("parseContraUsername", () => {
  it("contra.com/{username} kullanıcı adını çıkarır", () => {
    expect(parseContraUsername("https://contra.com/andreadinardo")).toBe("andreadinardo");
    expect(parseContraUsername("https://www.contra.com/tiago-rosado")).toBe("tiago-rosado");
  });

  it("profil OLMAYAN kök yolları eler", () => {
    expect(parseContraUsername("https://contra.com/discover")).toBeNull();
    expect(parseContraUsername("https://contra.com/jobs")).toBeNull();
    expect(parseContraUsername("https://contra.com/login")).toBeNull();
  });

  it("alt sayfaları, yabancı host'u ve bozuk girdiyi reddeder", () => {
    expect(parseContraUsername("https://contra.com/user/projects")).toBeNull();
    expect(parseContraUsername("https://example.com/andrea")).toBeNull();
    expect(parseContraUsername("not-a-url")).toBeNull();
  });
});

describe("normalizeContraProfile", () => {
  it("ld+json Person'dan başlık/özet/avatar çıkarır", () => {
    const p = normalizeContraProfile(HTML, "andreadinardo");
    expect(p).not.toBeNull();
    expect(p!.draft.headline).toBe("Helping growth-stage brands tell their story.");
    expect(p!.draft.summary).toContain("brand strategist");
    expect(p!.draft.summary).toContain("San Francisco"); // konum özete eklenir
    expect(p!.avatarUrl).toMatch(/^https:\/\/media\.contra\.com\//);
    expect(p!.draft.skills).toEqual([]); // public ld+json beceri taşımaz
  });

  it("jobTitle yoksa başlık bio'nun ilk cümlesine düşer", () => {
    const html = HTML.replace('"jobTitle":"Helping growth-stage brands tell their story.",', "");
    const p = normalizeContraProfile(html, "andreadinardo");
    expect(p!.draft.headline).toBe("I'm Andrea—brand strategist and copywriter.");
  });

  it("ld+json/Person yoksa null döner", () => {
    expect(normalizeContraProfile("<html><body>hi</body></html>", "x")).toBeNull();
    expect(normalizeContraProfile('<script type="application/ld+json">{bozuk</script>', "x")).toBeNull();
  });
});
