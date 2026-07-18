import { describe, it, expect } from "vitest";
import { buildWeeklySummaries, WEEKLY_MAX_MATCHES, type WeeklyJobRow } from "./weekly";
import type { NotifyFeedRow } from "@/lib/scrape/notify";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

const SINCE = "2026-06-27T00:00:00Z";

function makeJob(over: Partial<WeeklyJobRow> = {}): WeeklyJobRow {
  return { user_id: "u1", status: "applied", created_at: "2026-07-01T00:00:00Z", ...over };
}

function makePoolJob(over: Partial<PoolJobRow> = {}): PoolJobRow {
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
    created_at: "2026-07-03T00:00:00Z",
    lang: "en",
    title_en: null,
    title_tr: null,
    job_type: null,
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
    notify: false, // haftalık özet notify bayrağına BAKMAZ — tüm feed'ler dahil
    proposal_prompt: null,
    created_at: "2026-07-01T00:00:00Z",
    ...over,
  };
}

const EMPTY = { sinceIso: SINCE, jobs: [], proposals: [], usage: [], feeds: [], newJobs: [] };

describe("buildWeeklySummaries", () => {
  it("aktiviteyi kullanıcı başına toplar (ilan + teklif + kredi)", () => {
    const out = buildWeeklySummaries({
      ...EMPTY,
      jobs: [
        makeJob(),
        makeJob({ status: "interview", created_at: "2026-06-20T00:00:00Z" }), // eski satır: güncellenmiş ama bu hafta eklenmemiş
      ],
      proposals: [{ user_id: "u1" }, { user_id: "u1" }],
      usage: [{ user_id: "u1", credits_spent: 2 }, { user_id: "u1", credits_spent: null }],
    });
    expect(out).toHaveLength(1);
    const s = out[0];
    expect(s.userId).toBe("u1");
    expect(s.jobsAdded).toBe(1); // yalnız created_at >= since
    expect(s.statusCounts).toEqual({ applied: 1, interview: 1 });
    expect(s.proposals).toBe(2);
    expect(s.creditsUsed).toBe(2);
  });

  it("hiç sinyali olmayan kullanıcıya özet üretmez", () => {
    const out = buildWeeklySummaries({ ...EMPTY, usage: [{ user_id: "u1", credits_spent: 0 }] });
    expect(out).toHaveLength(0);
  });

  it("feed eşleşmeleri notify=false feed'lerden de gelir ve tavanlanır", () => {
    const newJobs = Array.from({ length: WEEKLY_MAX_MATCHES + 2 }, (_, i) =>
      makePoolJob({ id: `00000000-0000-0000-0000-00000000000${i + 1}`, external_id: `x${i + 1}` }),
    );
    const out = buildWeeklySummaries({
      ...EMPTY,
      feeds: [makeFeed({ keywords: ["react"] })],
      newJobs,
    });
    expect(out).toHaveLength(1);
    expect(out[0].matches).toHaveLength(WEEKLY_MAX_MATCHES);
    expect(out[0].matchTotal).toBe(WEEKLY_MAX_MATCHES + 2);
  });

  it("yalnız eşleşmesi olan kullanıcı da (aktivitesiz) özet alır", () => {
    const out = buildWeeklySummaries({
      ...EMPTY,
      feeds: [makeFeed({ user_id: "u2", keywords: ["react"] })],
      newJobs: [makePoolJob()],
    });
    expect(out.map((s) => s.userId)).toEqual(["u2"]);
    expect(out[0].jobsAdded).toBe(0);
  });

  it("kullanıcıları ayrı özetlere böler", () => {
    const out = buildWeeklySummaries({
      ...EMPTY,
      jobs: [makeJob(), makeJob({ user_id: "u2", status: "offer" })],
    });
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.userId === "u2")?.statusCounts).toEqual({ offer: 1 });
  });
});
