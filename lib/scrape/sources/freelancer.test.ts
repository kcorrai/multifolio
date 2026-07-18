import { describe, it, expect } from "vitest";
import { normalizeFreelancer, isDevDesign } from "./freelancer";

// Freelancer active-projects yanıtından tek proje örneği (job_details + full_description).
const sample = {
  id: 38912345,
  title: "Build a Next.js dashboard",
  seo_url: "javascript/build-nextjs-dashboard",
  type: "fixed",
  description: "<p>Build a <b>dashboard</b> with React.</p>",
  time_submitted: 1_780_000_000,
  currency: { code: "USD", sign: "$" },
  budget: { minimum: 250, maximum: 750 },
  jobs: [
    { name: "React.js", category: { name: "Websites, IT & Software" } },
    { name: "Next.js", category: { name: "Websites, IT & Software" } },
  ],
};

describe("normalizeFreelancer", () => {
  it("ham projeyi PoolJobUpsert'e çevirir + HTML düz metne + job_type freelance", () => {
    expect(normalizeFreelancer(sample)).toEqual({
      source: "freelancer",
      external_id: "38912345",
      title: "Build a Next.js dashboard",
      description: "Build a dashboard with React.",
      url: "https://www.freelancer.com/projects/javascript/build-nextjs-dashboard",
      budget: "$250-750",
      skills: ["React.js", "Next.js"],
      client_country: null,
      client_spent: null,
      posted_at: "2026-05-28T20:26:40.000Z",
      job_type: "freelance",
    });
  });

  it("hourly projede bütçeye /hr ekler", () => {
    const r = normalizeFreelancer({ ...sample, type: "hourly", budget: { minimum: 25, maximum: 50 } });
    expect(r?.budget).toBe("$25-50/hr");
  });

  it("eksik budget/jobs/seo_url'de null/[] lenient", () => {
    const r = normalizeFreelancer({ id: 7, title: "X" });
    expect(r).toMatchObject({ external_id: "7", budget: null, skills: [], url: null, posted_at: null, job_type: "freelance" });
  });

  it("kitle DIŞI kategorideki projeyi eler (feed alaka koruması)", () => {
    const r = normalizeFreelancer({
      ...sample,
      jobs: [{ name: "Copy Typing", category: { name: "Data Entry & Admin" } }],
    });
    expect(r).toBeNull();
  });

  it("zorunlu alan (title) eksikse null döner (atlanır)", () => {
    expect(normalizeFreelancer({ id: 1 })).toBeNull();
    expect(normalizeFreelancer("garbage")).toBeNull();
  });
});

describe("isDevDesign", () => {
  it("yazılım/tasarım kategorisi varsa true", () => {
    expect(isDevDesign([{ category: { name: "Design, Media & Architecture" } }])).toBe(true);
    expect(isDevDesign([{ category: { name: "Mobile Phones & Computing" } }])).toBe(true);
  });
  it("yalnız alakasız kategoriler → false", () => {
    expect(isDevDesign([{ category: { name: "Writing & Content" } }])).toBe(false);
  });
  it("kategori bilgisi hiç yoksa lenient (true)", () => {
    expect(isDevDesign([{ name: "Something" }])).toBe(true);
    expect(isDevDesign([])).toBe(true);
    expect(isDevDesign(undefined)).toBe(true);
  });
});
