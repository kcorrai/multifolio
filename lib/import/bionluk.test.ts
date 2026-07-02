import { describe, it, expect } from "vitest";
import { parseBionlukUsername, normalizeBionlukProfile } from "./bionluk";

describe("parseBionlukUsername", () => {
  it("bionluk.com/{username}'den kullanıcı adını çıkarır", () => {
    expect(parseBionlukUsername("https://bionluk.com/furkanthebrave")).toBe("furkanthebrave");
    expect(parseBionlukUsername("https://www.bionluk.com/furkanthebrave/")).toBe("furkanthebrave");
    expect(parseBionlukUsername("https://bionluk.com/furkanthebrave?ref=x")).toBe("furkanthebrave");
  });

  it("sistem path'lerini ve çok segmentli URL'leri reddeder", () => {
    expect(parseBionlukUsername("https://bionluk.com/freelancer-vitrin/d5d3603faca2")).toBeNull();
    expect(parseBionlukUsername("https://bionluk.com/ilanlar/freelance")).toBeNull();
    expect(parseBionlukUsername("https://bionluk.com/")).toBeNull();
  });

  it("bionluk dışı host ve geçersiz girdileri reddeder", () => {
    expect(parseBionlukUsername("https://fiverr.com/someone")).toBeNull();
    expect(parseBionlukUsername("not-a-url")).toBeNull();
  });
});

// get_public_profile gerçek yanıtından (furkanthebrave) sadeleştirilmiş örnek.
const sampleProfile = {
  success: true,
  data: {
    user: {
      username: "furkanthebrave",
      avatar_url: "https://bgcp.bionluk.com/images/avatar/200x200/239bbf0f.jpg",
      title: "Grafik Tasarımcı / İllustrator",
      description: "Grafik tasarım ve ilüstrasyon konusunda deneyimliyim.",
      seller_skills: [{ id: "7498", name: "Photoshop" }, { id: "266", name: "Karakter Tasarımı" }],
      sellerRating: { commentCount: 13, commentRating: 4.7 },
      user_created_at: "Haziran 2021",
    },
  },
};

const samplePortfolio = {
  success: true,
  data: {
    portfolios: [
      {
        name: "Pixel Art",
        description: "<p>Pixel art günümüzde çok popüler bir tarz.</p>",
        image_url: "https://bgcp.bionluk.com/images/portfolio/1400x788/ab1d200c.jpg",
        image_url_small: "https://bgcp.bionluk.com/images/portfolio/526x296/ab1d200c.jpg",
        category_name: "Grafik & Tasarım",
      },
    ],
  },
};

describe("normalizeBionlukProfile", () => {
  it("profil + portfolyoyu yapılandırılmış BionlukProfile'a çevirir", () => {
    const result = normalizeBionlukProfile(sampleProfile, samplePortfolio);
    expect(result).toEqual({
      username: "furkanthebrave",
      draft: {
        headline: "Grafik Tasarımcı / İllustrator",
        summary: "Grafik tasarım ve ilüstrasyon konusunda deneyimliyim.",
        skills: ["Photoshop", "Karakter Tasarımı"],
      },
      avatarUrl: "https://bgcp.bionluk.com/images/avatar/200x200/239bbf0f.jpg",
      portfolio: [
        {
          title: "Pixel Art",
          description: "Pixel art günümüzde çok popüler bir tarz.",
          imageUrl: "https://bgcp.bionluk.com/images/portfolio/1400x788/ab1d200c.jpg",
          category: "Grafik & Tasarım",
        },
      ],
      rating: { count: 13, average: 4.7 },
      memberSince: "Haziran 2021",
    });
  });

  it("portfolyo yoksa/patlarsa profili yine döndürür (boş portfolyo)", () => {
    const result = normalizeBionlukProfile(sampleProfile, null);
    expect(result?.portfolio).toEqual([]);
    expect(result?.draft.headline).toBe("Grafik Tasarımcı / İllustrator");
  });

  it("yorum yoksa rating null olur", () => {
    const noRating = { data: { user: { username: "x", sellerRating: { commentCount: 0, commentRating: 0 } } } };
    expect(normalizeBionlukProfile(noRating, null)?.rating).toBeNull();
  });

  it("profil ayrıştırılamazsa (success:false / bozuk) null döner", () => {
    expect(normalizeBionlukProfile({ success: false, message: "Not found" }, null)).toBeNull();
    expect(normalizeBionlukProfile("garbage", null)).toBeNull();
  });
});
