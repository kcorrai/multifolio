import { describe, it, expect } from "vitest";
import { selectAutoDraftJobs, AUTO_DRAFT_MAX_PER_RUN } from "./auto-draft-select";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

function job(id: string, title: string, skills: string[] = []): PoolJobRow {
  return {
    id, source: "remotive", external_id: id, title, description: title,
    url: null, budget: null, skills, client_country: null, client_spent: null,
    posted_at: null, created_at: "2026-07-01T00:00:00Z", lang: "en", title_en: null, title_tr: null,
  };
}
function feed(id: string, keywords: string[]): JobFeedRow {
  return {
    id, name: id, keywords, exclude_keywords: [], min_budget: null, platform: null,
    exclude_countries: [], min_hourly_rate: null, min_fixed_price: null, min_client_spent: null,
    min_score: null, notify: false, proposal_prompt: null, created_at: "2026-07-01T00:00:00Z",
  };
}
const prof = { headline: "React developer", skills: ["react", "node"] };

describe("selectAutoDraftJobs", () => {
  it("feed tavanı 0 → hiç seçmez", () => {
    const picks = selectAutoDraftJobs([feed("f", ["react"])], [job("1", "React dev")], new Set(), prof, { f: 0 });
    expect(picks).toHaveLength(0);
  });

  it("takip edilenleri (trackedIds) hariç tutar", () => {
    const picks = selectAutoDraftJobs([feed("f", ["react"])], [job("1", "React dev"), job("2", "React app")], new Set(["1"]), prof, { f: 5 });
    expect(picks.map((p) => p.job.id)).toEqual(["2"]);
  });

  it("yalnız feed'e uyanları seçer + doğru feed'e atar", () => {
    const picks = selectAutoDraftJobs([feed("f", ["react"])], [job("1", "React dev"), job("2", "Plumbing")], new Set(), prof, { f: 5 });
    expect(picks).toHaveLength(1);
    expect(picks[0].job.id).toBe("1");
    expect(picks[0].feedId).toBe("f");
  });

  it("feed tavanına uyar", () => {
    const jobs = [job("1", "React a", ["react"]), job("2", "React b", ["react"]), job("3", "React c", ["react"])];
    const picks = selectAutoDraftJobs([feed("f", ["react"])], jobs, new Set(), prof, { f: 2 });
    expect(picks).toHaveLength(2);
  });

  it("koşu-başı emniyet sınırını aşmaz", () => {
    const jobs = Array.from({ length: 10 }, (_, i) => job(String(i), "React " + i, ["react"]));
    const picks = selectAutoDraftJobs([feed("f", ["react"])], jobs, new Set(), prof, { f: 99 });
    expect(picks.length).toBe(AUTO_DRAFT_MAX_PER_RUN);
  });
});
