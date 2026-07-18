import { describe, it, expect } from "vitest";
import { buildApplyQueue } from "./queue";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

function job(id: string, title: string, over: Partial<PoolJobRow> = {}): PoolJobRow {
  return {
    id, source: "remotive", external_id: id, title, description: title,
    url: null, budget: null, skills: [], client_country: null, client_spent: null,
    posted_at: null, created_at: "2026-07-01T00:00:00Z", lang: "en", title_en: null, title_tr: null, job_type: null,
    ...over,
  };
}

function feed(keywords: string[], over: Partial<JobFeedRow> = {}): JobFeedRow {
  return {
    id: "f1", name: "f", keywords, exclude_keywords: [], min_budget: null, platform: null,
    exclude_countries: [], min_hourly_rate: null, min_fixed_price: null, min_client_spent: null,
    min_score: null, job_types: [], notify: false, proposal_prompt: null, created_at: "2026-07-01T00:00:00Z",
    ...over,
  };
}

const noProfile = { headline: null, skills: null };

describe("buildApplyQueue", () => {
  it("başvurulmuş (appliedIds) işleri hariç tutar", () => {
    const pool = [job("1", "React dev"), job("2", "React app")];
    const q = buildApplyQueue(pool, [], new Map(), new Set(["1"]), noProfile);
    expect(q.map((p) => p.id)).toEqual(["2"]);
  });

  it("feed varsa yalnız eşleşenleri alır (keyword)", () => {
    const pool = [job("1", "React developer"), job("2", "Plumbing job")];
    const q = buildApplyQueue(pool, [feed(["react"])], new Map(), new Set(), noProfile);
    expect(q.map((p) => p.id)).toEqual(["1"]);
  });

  it("feed yoksa tüm başvurulmamışları alır", () => {
    const pool = [job("1", "a"), job("2", "b")];
    const q = buildApplyQueue(pool, [], new Map(), new Set(), noProfile);
    expect(q).toHaveLength(2);
  });

  it("AI skoru DESC sıralar (skorsuzlar sona)", () => {
    const pool = [job("1", "x"), job("2", "y"), job("3", "z")];
    const scores = new Map<string, number | null>([["1", 60], ["2", 90]]); // 3 skorsuz
    const q = buildApplyQueue(pool, [], scores, new Set(), noProfile);
    expect(q.map((p) => p.id)).toEqual(["2", "1", "3"]);
  });

  it("limit uygular", () => {
    const pool = Array.from({ length: 30 }, (_, i) => job(String(i), "job " + i));
    expect(buildApplyQueue(pool, [], new Map(), new Set(), noProfile, 5)).toHaveLength(5);
  });
});
