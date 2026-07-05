import { describe, it, expect } from "vitest";
import { buildPersonJsonLd } from "./json-ld";

const base = {
  name: "Senior React Developer",
  description: "8 years building dashboards.",
  skills: ["React", "TypeScript"],
  avatarUrl: "https://cdn.example.com/a.jpg",
  url: "https://multifolio.app/p/senior-react-developer",
};

describe("buildPersonJsonLd", () => {
  it("geçerli Person JSON üretir", () => {
    const obj = JSON.parse(buildPersonJsonLd(base));
    expect(obj["@type"]).toBe("Person");
    expect(obj["@context"]).toBe("https://schema.org");
    expect(obj.name).toBe(base.name);
    expect(obj.image).toBe(base.avatarUrl);
    expect(obj.knowsAbout).toEqual(["React", "TypeScript"]);
    expect(obj.url).toBe(base.url);
  });

  it("avatar/skill yoksa o alanları atlar", () => {
    const obj = JSON.parse(buildPersonJsonLd({ ...base, avatarUrl: null, skills: [] }));
    expect(obj.image).toBeUndefined();
    expect(obj.knowsAbout).toBeUndefined();
  });

  it("'<' kaçırılır (</script> break-out önlenir) ama JSON hâlâ geçerli", () => {
    const raw = buildPersonJsonLd({ ...base, description: "bio </script><script>alert(1)" });
    expect(raw).not.toContain("</script>");
    expect(raw).toContain("\\u003c");
    // Kaçışlı JSON hâlâ ayrıştırılabilir + orijinal metni korur.
    const obj = JSON.parse(raw);
    expect(obj.description).toContain("</script>");
  });

  it("description 300 karakterle sınırlanır", () => {
    const obj = JSON.parse(buildPersonJsonLd({ ...base, description: "a".repeat(500) }));
    expect(obj.description.length).toBe(300);
  });
});
