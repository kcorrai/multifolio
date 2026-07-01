import { describe, it, expect } from "vitest";
import { aggregateCreditUsage } from "./analytics";

const NOW = new Date("2026-07-01T12:00:00Z").getTime();

describe("aggregateCreditUsage", () => {
  it("toplam kredi, adet, tür ve günlük seriyi toplar", () => {
    const rows = [
      { kind: "proposal",   credits_spent: 2, created_at: "2026-07-01T09:00:00Z" },
      { kind: "adaptation", credits_spent: 1, created_at: "2026-07-01T10:00:00Z" },
      { kind: "proposal",   credits_spent: 2, created_at: "2026-06-30T10:00:00Z" },
    ];
    const out = aggregateCreditUsage(rows, NOW);
    expect(out.totalCredits).toBe(5);
    expect(out.totalCount).toBe(3);
    expect(out.byKind.proposal).toEqual({ count: 2, credits: 4 });
    expect(out.byKind.adaptation).toEqual({ count: 1, credits: 1 });
    expect(out.dailySeries).toEqual([
      { date: "2026-06-30", credits: 2 },
      { date: "2026-07-01", credits: 3 },
    ]);
  });

  it("30 günden eski kayıtları günlük seriden hariç tutar (ama toplamda tutar)", () => {
    const rows = [
      { kind: "adaptation", credits_spent: 1, created_at: "2026-05-01T10:00:00Z" },
    ];
    const out = aggregateCreditUsage(rows, NOW);
    expect(out.totalCredits).toBe(1);
    expect(out.dailySeries).toEqual([]);
  });

  it("null credits_spent'i 0 sayar", () => {
    const out = aggregateCreditUsage(
      [{ kind: "adaptation", credits_spent: null, created_at: "2026-07-01T10:00:00Z" }],
      NOW,
    );
    expect(out.totalCredits).toBe(0);
    expect(out.byKind.adaptation).toEqual({ count: 1, credits: 0 });
  });
});
