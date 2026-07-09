import { describe, it, expect } from "vitest";
import {
  mapFiverrProps,
  fiverrImageKey,
  dedupeFiverrImages,
  portfolioProjectsFromResponse,
  mergePortfolio,
  rawToProject,
  type PortfolioProjectRaw,
} from "./fiverr-map";

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
    portfolios: { totalCount: 11 },
    activeStructuredSkills: [{ name: "Python Django", level: "PRO" }, { name: "Machine learning" }, { name: "Python Django" }],
    activeEducations: [{ degree: "data science", toYear: 2025, school: "NUST-Islamabad", degreeTitle: "MSC" }],
    certifications: [{ receivedFrom: "Google Cloud", certificationName: "Web Development", year: 2024 }],
    workExperiences: {
      nodes: [{ title: "Founder & CEO", company: { name: "BrainDev" }, description: "Leading full stack delivery." }],
    },
  },
  gigsData: [{ title: "be your full stack web developer for custom ai integrated websites" }],
};

describe("mapFiverrProps", () => {
  const r = mapFiverrProps(props)!;

  it("seller yoksa null döner", () => {
    expect(mapFiverrProps(null)).toBeNull();
    expect(mapFiverrProps({})).toBeNull();
    expect(mapFiverrProps({ seller: null })).toBeNull();
  });

  it("avatar + skills (tekrarsız) çıkarır, projeler DÖNDÜRMEZ (portföyden ayrı)", () => {
    expect(r.avatarUrl).toContain("attachments/profile/photo");
    expect(r.skills).toEqual(["Python Django", "Machine learning"]);
    expect("projects" in r).toBe(false);
  });

  it("temiz metin bloğunda tüm bölümler + gig başlığı (hizmet sinyali) yer alır", () => {
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
    expect(r.text).toContain("full stack web developer for custom ai");
  });
});

// Gerçek /portfolio/api yanıt yapısından türetilmiş fixture (liste sığ + firstProject derin).
const CDN = "https://fiverr-res.cloudinary.com/image/upload";
const imgNode = (transform: string, tail: string) => ({ attachment: { previewUrl: `${CDN}/${transform}/v1/attachments/project_item/attachment/${tail}` } });
const portfolioResponse = {
  projects: [
    { id: "p1", title: "FiberFlow-Textile PLM", items: { nodes: [imgNode("t_portfolio_project_grid", "h1-1/a.png")] } },
    { id: "p2", title: "Monaarch Studio", items: { nodes: [imgNode("t_portfolio_project_grid", "h2-1/b.png")] } },
  ],
  firstProject: {
    id: "p1",
    title: "FiberFlow-Textile PLM Digitalization",
    description: "Client: A textile company. Goal: build a PLM system.",
    duration: "ONE_TO_THREE_MONTHS",
    price: { amount: "1500.0" },
    projectStartedAt: 1706745600, // 2024
    industries: [{ name: "Textile Manufacturing" }, { name: "Data Analytics" }],
    items: {
      nodes: [imgNode("t_portfolio_project_card", "h1-1/a.png"), imgNode("t_portfolio_project_card", "h1-2/pic2.png")],
    },
  },
  totalProjects: 11,
};

describe("portfolioProjectsFromResponse + mergePortfolio", () => {
  it("liste sığ + firstProject derin projeleri çıkarır", () => {
    const raws = portfolioProjectsFromResponse(portfolioResponse);
    expect(raws).toHaveLength(3); // p1(sığ) + p2(sığ) + p1(derin)
    const detailed = raws.find((p) => p.detailed)!;
    expect(detailed.id).toBe("p1");
    expect(detailed.skills).toEqual(["Textile Manufacturing", "Data Analytics"]);
    expect(detailed.description).toContain("Duration: 1-3 months");
    expect(detailed.description).toContain("Budget: $1500");
    expect(detailed.description).toContain("Started 2024");
    expect(detailed.images).toHaveLength(2);
  });

  it("merge id bazında ZENGİN sürümü (detailed) tutar", () => {
    const store = new Map<string, PortfolioProjectRaw>();
    mergePortfolio(store, portfolioProjectsFromResponse(portfolioResponse));
    expect(store.size).toBe(2); // p1 + p2 (p1'in iki sürümü birleşti)
    const p1 = store.get("p1")!;
    expect(p1.detailed).toBe(true); // derin sürüm kazandı
    expect(rawToProject(p1).description).toContain("PLM system");
    expect(rawToProject(store.get("p2")!).description).toBe(""); // sığ: açıklama yok
  });

  it("portföy yanıtı değilse boş döner", () => {
    expect(portfolioProjectsFromResponse(null)).toEqual([]);
    expect(portfolioProjectsFromResponse({ foo: 1 })).toEqual([]);
  });

  it("per-proje DETAY yanıtını (tek proje objesi) derin olarak tanır", () => {
    // /portfolio/{id} yanıtı: liste/firstProject sarmalı YOK, root doğrudan proje.
    const detail = {
      id: "p2",
      title: "Monaarch Studio – AI Music Suite",
      description: "AI-powered music production suite.",
      duration: "THREE_TO_SIX_MONTHS",
      industries: [{ name: "Music" }, { name: "Machine Learning" }],
      items: { nodes: [imgNode("t_portfolio_project_card", "h2-1/b.png")] },
    };
    const raws = portfolioProjectsFromResponse(detail);
    expect(raws).toHaveLength(1);
    expect(raws[0].detailed).toBe(true);
    expect(raws[0].skills).toEqual(["Music", "Machine Learning"]);
    expect(raws[0].description).toContain("Duration: 3-6 months");
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
