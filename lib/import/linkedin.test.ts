import { describe, it, expect } from "vitest";
import { parseLinkedinUsername, normalizeLinkedinProfile } from "./linkedin";

describe("parseLinkedinUsername", () => {
  it("linkedin.com/in/{username}'den kullanıcı adını çıkarır", () => {
    expect(parseLinkedinUsername("https://www.linkedin.com/in/williamhgates")).toBe("williamhgates");
    expect(parseLinkedinUsername("https://linkedin.com/in/williamhgates/")).toBe("williamhgates");
    expect(parseLinkedinUsername("https://tr.linkedin.com/in/williamhgates?originalSubdomain=tr")).toBe("williamhgates");
  });

  it("/in/ dışı yolları ve çok/eksik segmentli URL'leri reddeder", () => {
    expect(parseLinkedinUsername("https://www.linkedin.com/company/microsoft")).toBeNull();
    expect(parseLinkedinUsername("https://www.linkedin.com/in/")).toBeNull();
    expect(parseLinkedinUsername("https://www.linkedin.com/in/a/b")).toBeNull();
    expect(parseLinkedinUsername("https://www.linkedin.com/")).toBeNull();
  });

  it("linkedin dışı host ve geçersiz girdileri reddeder", () => {
    expect(parseLinkedinUsername("https://fiverr.com/in/someone")).toBeNull();
    expect(parseLinkedinUsername("not-a-url")).toBeNull();
  });
});

// Gerçek public profil sayfası şeklinden sadeleştirilmiş JSON-LD. @graph'te profil
// sahibinin yanında bir "decoy" Person (yorumcu/yazar) da bulunur — URL eşleşmesi
// doğru düğümü seçmeli.
function htmlWith(graph: unknown): string {
  const ld = JSON.stringify({ "@context": "http://schema.org", "@graph": graph });
  return `<!doctype html><html><head><script type="application/ld+json">${ld}</script></head><body></body></html>`;
}

const ownerPerson = {
  "@type": "Person",
  name: "Bill Gates",
  url: "https://www.linkedin.com/in/williamhgates",
  sameAs: "https://www.linkedin.com/in/williamhgates",
  description: "Chair of the Gates Foundation. Co-founder of Microsoft.",
  jobTitle: ["Co-chair", "Founder"],
  image: { "@type": "ImageObject", contentUrl: "https://media.licdn.com/dms/image/x/photo.jpg" },
  address: { "@type": "PostalAddress", addressCountry: "US", addressLocality: "Seattle, Washington, United States" },
  worksFor: [
    { "@type": "Organization", name: "Gates Foundation" },
    { "@type": "Organization", name: "Microsoft" },
  ],
  alumniOf: [{ "@type": "EducationalOrganization", name: "Harvard University" }],
};

const decoyPerson = {
  "@type": "Person",
  name: "Bir Yorumcu",
  url: "https://www.linkedin.com/in/decoy",
};

describe("normalizeLinkedinProfile", () => {
  it("JSON-LD'den profil sahibini seçip yapılandırılmış taslağa çevirir", () => {
    const html = htmlWith([decoyPerson, ownerPerson]);
    expect(normalizeLinkedinProfile(html, "williamhgates")).toEqual({
      username: "williamhgates",
      draft: {
        headline: "Co-chair · Founder",
        summary:
          "Chair of the Gates Foundation. Co-founder of Microsoft.\n\n" +
          "Gates Foundation · Microsoft\n\n" +
          "Harvard University\n\n" +
          "Seattle, Washington, United States",
        skills: [],
      },
      avatarUrl: "https://media.licdn.com/dms/image/x/photo.jpg",
    });
  });

  it("ünvan yoksa headline tagline'a düşer; foto yoksa avatarUrl null", () => {
    const html = htmlWith([
      { "@type": "Person", url: "https://www.linkedin.com/in/janedoe", description: "Senior Product Designer" },
    ]);
    const r = normalizeLinkedinProfile(html, "janedoe");
    expect(r?.draft.headline).toBe("Senior Product Designer");
    expect(r?.draft.summary).toBe("Senior Product Designer");
    expect(r?.avatarUrl).toBeNull();
  });

  it("URL eşleşmesi yoksa en zengin Person'ı seçer", () => {
    const html = htmlWith([
      { "@type": "Person", name: "Boş", url: "https://www.linkedin.com/in/other" },
      { "@type": "Person", description: "Tagline", jobTitle: "Developer" },
    ]);
    expect(normalizeLinkedinProfile(html, "nomatch")?.draft.headline).toBe("Developer");
  });

  it("ld+json yoksa / Person yoksa / bozuksa null döner", () => {
    expect(normalizeLinkedinProfile("<html><body>no ld json</body></html>", "x")).toBeNull();
    expect(normalizeLinkedinProfile(htmlWith([{ "@type": "Organization", name: "Acme" }]), "x")).toBeNull();
    expect(normalizeLinkedinProfile('<script type="application/ld+json">{bozuk</script>', "x")).toBeNull();
  });
});
