import { describe, it, expect } from "vitest";
import { buildFeedDigests, type NotifyFeedRow } from "./notify";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

function makeJob(over: Partial<PoolJobRow> = {}): PoolJobRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    source: "remotive",
    external_id: "x1",
    title: "Senior React Developer",
    description: "Build dashboards with React and TypeScript.",
    url: null,
    budget: null,
    skills: [],
    client_country: null,
    client_spent: null,
    posted_at: null,
    job_type: null,
    created_at: "2026-07-03T00:00:00Z",
    lang: "en",
    title_en: null,
    title_tr: null,
    ...over,
  };
}

function makeFeed(over: Partial<NotifyFeedRow> = {}): NotifyFeedRow {
  return {
    id: "f1",
    user_id: "u1",
    name: "React",
    keywords: [],
    exclude_keywords: [],
    min_budget: null,
    platform: null,
    exclude_countries: [],
    min_hourly_rate: null,
    min_fixed_price: null,
    min_client_spent: null,
    min_score: null,
    job_types: [],
    notify: true,
    proposal_prompt: null,
    created_at: "2026-07-01T00:00:00Z",
    ...over,
  };
}

describe("buildFeedDigests", () => {
  it("eşleşen ilanları kullanıcı başına tek özete toplar", () => {
    const feeds = [makeFeed({ keywords: ["react"] })];
    const jobs = [makeJob(), makeJob({ id: "00000000-0000-0000-0000-000000000002", title: "PHP Developer", description: "WordPress only." })];
    const digests = buildFeedDigests(feeds, jobs);
    expect(digests).toHaveLength(1);
    expect(digests[0].userId).toBe("u1");
    expect(digests[0].feedNames).toEqual(["React"]);
    expect(digests[0].jobs.map((j) => j.title)).toEqual(["Senior React Developer"]);
  });

  it("hiç eşleşme yoksa kullanıcıya özet üretmez", () => {
    const feeds = [makeFeed({ keywords: ["golang"] })];
    const digests = buildFeedDigests(feeds, [makeJob()]);
    expect(digests).toHaveLength(0);
  });

  it("aynı ilana birden çok feed eşleşirse ilan bir kez, feed adları birleşik gelir", () => {
    const feeds = [
      makeFeed({ id: "f1", name: "React", keywords: ["react"] }),
      makeFeed({ id: "f2", name: "TypeScript", keywords: ["typescript"] }),
    ];
    const digests = buildFeedDigests(feeds, [makeJob()]);
    expect(digests).toHaveLength(1);
    expect(digests[0].jobs).toHaveLength(1);
    expect(digests[0].feedNames.sort()).toEqual(["React", "TypeScript"]);
  });

  it("kullanıcıları ayrı özetlere böler ve filtreleri uygular", () => {
    const feeds = [
      makeFeed({ id: "f1", user_id: "u1", keywords: ["react"] }),
      makeFeed({ id: "f2", user_id: "u2", name: "US hariç", exclude_countries: ["United States"] }),
    ];
    const jobs = [
      makeJob(),
      makeJob({ id: "00000000-0000-0000-0000-000000000003", title: "Designer", description: "Figma work.", client_country: "United States" }),
    ];
    const digests = buildFeedDigests(feeds, jobs);
    const u1 = digests.find((d) => d.userId === "u1");
    const u2 = digests.find((d) => d.userId === "u2");
    expect(u1?.jobs).toHaveLength(1);
    // u2'nin feed'i keyword'süz → US'li ilan elenir, React ilanı geçer.
    expect(u2?.jobs.map((j) => j.title)).toEqual(["Senior React Developer"]);
  });

  it("min_score kriteri yeni (skorsuz) ilanları ELEMEZ", () => {
    const feeds = [makeFeed({ min_score: 80, keywords: ["react"] })];
    const digests = buildFeedDigests(feeds, [makeJob()]);
    expect(digests).toHaveLength(1);
  });
});
