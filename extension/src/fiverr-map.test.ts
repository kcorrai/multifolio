import { describe, it, expect } from "vitest";
import { mapFiverrProps, fiverrImageKey, dedupeFiverrImages } from "./fiverr-map";

// Gerçek Fiverr __PERSEUS__initialProps yapısından türetilmiş küçük fixture.
const props = {
  seller: {
    user: {
      name: "saadrehman1710",
      profile: { displayName: "Saad Rehman" },
      profileImageUrl: "https://fiverr-res.cloudinary.com/image/upload/t_profile/attachments/profile/photo/abc-1/x.png",
      languages: [
        { code: "EN", level: "NATIVE_OR_BILINGUAL" },
        { code: "FR", level: "BASIC" },
      ],
    },
    oneLinerTitle: "AI Powered Solutions, Full Stack, and Automation Expert",
    description: "I'm a full stack developer and AI specialist with 4 years of experience.",
    rating: { score: 4.9, count: 82 },
    sellerLevel: "LEVEL_TWO",
    responseTime: { inHours: 1 },
    hourlyRate: { priceInCents: 5000 },
    activeStructuredSkills: [
      { name: "Python Django", level: "PRO" },
      { name: "Machine learning" },
      { name: "Python Django" }, // tekrar
    ],
    activeEducations: [{ degree: "data science", toYear: 2025, school: "NUST-Islamabad", degreeTitle: "MSC" }],
    certifications: [{ receivedFrom: "Google Cloud", certificationName: "Web Development", year: 2024 }],
    workExperiences: {
      nodes: [{ title: "Founder & CEO", company: { name: "BrainDev" }, description: "Leading full stack delivery." }],
    },
  },
  gigsData: [
    {
      gig_id: 438919053,
      title: "be your full stack web developer for custom ai integrated websites",
      price_i: 300,
      buying_review_rating: 4.9,
      metadata: [
        { type: "website_type", value: ["saas"] },
        { type: "programming_language", value: ["html_css", "javascript", "react"] },
      ],
      assets: [
        { type: "ImageAsset", cloud_img_main_gig: "https://fiverr-res.cloudinary.com/t_main1,q_auto,f_auto/gigs/438919053/original/aaa.png" },
        { type: "VideoAsset", attachment_id: "x" }, // görsel yok → atlanır
      ],
    },
  ],
};

describe("mapFiverrProps", () => {
  const r = mapFiverrProps(props)!;

  it("seller yoksa null döner", () => {
    expect(mapFiverrProps(null)).toBeNull();
    expect(mapFiverrProps({})).toBeNull();
    expect(mapFiverrProps({ seller: null })).toBeNull();
  });

  it("avatar + skills (tekrarsız) çıkarır", () => {
    expect(r.avatarUrl).toContain("attachments/profile/photo");
    expect(r.skills).toEqual(["Python Django", "Machine learning"]);
  });

  it("gig'i proje olarak çıkarır (yalnız görsel asset)", () => {
    expect(r.projects).toHaveLength(1);
    const p = r.projects[0];
    expect(p.title).toContain("full stack web developer");
    expect(p.images).toHaveLength(1); // VideoAsset atlandı
    expect(p.images[0].url).toContain("/gigs/438919053/");
    expect(p.skills).toContain("html css"); // alt çizgi boşluğa
    expect(p.description).toContain("Starting at $300");
  });

  it("temiz metin bloğunda tüm bölümler yer alır", () => {
    expect(r.text).toContain("Saad Rehman");
    expect(r.text).toContain("Headline: AI Powered");
    expect(r.text).toContain("full stack developer and AI specialist");
    expect(r.text).toContain("Rating: 4.9 (82 reviews)");
    expect(r.text).toContain("Hourly rate: $50");
    expect(r.text).toContain("Skills: Python Django, Machine learning");
    expect(r.text).toContain("Languages: EN (Native), FR (Basic)");
    expect(r.text).toContain("MSC data science — NUST-Islamabad — (2025)");
    expect(r.text).toContain("Web Development — Google Cloud — (2024)");
    expect(r.text).toContain("Founder & CEO @ BrainDev");
    expect(r.text).toContain("Services / gigs:");
  });
});

describe("fiverrImageKey + dedupeFiverrImages", () => {
  it("aynı görselin farklı thumbnail biçimlerini tek anahtara toplar", () => {
    const card = "https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto,t_portfolio_project_card/v1/attachments/project_item/attachment/hash-1/shot.png";
    const grid = "https://fiverr-res.cloudinary.com/image/upload/f_auto,q_auto,t_portfolio_project_grid/v1/attachments/project_item/attachment/hash-1/shot.png";
    expect(fiverrImageKey(card)).toBe(fiverrImageKey(grid));
  });

  it("farklı görselleri ayrı tutar; ilk URL'i korur", () => {
    const a1 = "https://fiverr-res.cloudinary.com/image/upload/t_portfolio_project_grid/v1/attachments/project_item/attachment/hash-1/a.png";
    const a2 = "https://fiverr-res.cloudinary.com/image/upload/t_portfolio_project_card/v1/attachments/project_item/attachment/hash-1/a.png";
    const b = "https://fiverr-res.cloudinary.com/image/upload/t_portfolio_project_grid/v1/attachments/project_item/attachment/hash-2/b.png";
    expect(dedupeFiverrImages([a1, a2, b])).toEqual([a1, b]);
  });

  it("https olmayanı eler", () => {
    expect(dedupeFiverrImages(["http://x/y.png", "data:image/png;base64,z"])).toEqual([]);
  });
});
