import { describe, it, expect } from "vitest";
import { winRateByScore, scoreBucket, hasWinRateSignal, type WinRateJob } from "./win-rate";

describe("scoreBucket", () => {
  it("70+ high, 40-69 medium, <40 low", () => {
    expect(scoreBucket(85)).toBe("high");
    expect(scoreBucket(70)).toBe("high");
    expect(scoreBucket(55)).toBe("medium");
    expect(scoreBucket(40)).toBe("medium");
    expect(scoreBucket(30)).toBe("low");
  });
});

describe("winRateByScore", () => {
  const j = (status: WinRateJob["status"], match_score: number | null): WinRateJob => ({ status, match_score });

  it("skoru olmayan + yalnız 'saved' işleri dışlar", () => {
    const rows = winRateByScore([j("saved", 90), j("applied", null)]);
    expect(hasWinRateSignal(rows)).toBe(false);
  });

  it("bantlara doğru böler + winRate = won/decided", () => {
    const rows = winRateByScore([
      j("offer", 85),       // high: won + decided
      j("interview", 75),   // high: won + decided
      j("rejected", 72),    // high: decided
      j("applied", 80),     // high: applied ama decided değil (bekliyor)
      j("rejected", 50),    // medium: decided, won değil
    ]);
    const high = rows.find((r) => r.bucket === "high")!;
    expect(high.applied).toBe(4);
    expect(high.won).toBe(2);
    expect(high.decided).toBe(3);
    expect(high.winRate).toBe(67); // 2/3 = 66.7 → 67

    const medium = rows.find((r) => r.bucket === "medium")!;
    expect(medium.decided).toBe(1);
    expect(medium.winRate).toBe(0); // 0/1
  });

  it("decided 0 ise winRate null (bekleyen başvurular)", () => {
    const rows = winRateByScore([j("applied", 90), j("awaiting_reply", 88)]);
    const high = rows.find((r) => r.bucket === "high")!;
    expect(high.applied).toBe(2);
    expect(high.decided).toBe(0);
    expect(high.winRate).toBeNull();
  });

  it("her zaman 3 bandı high→low sırasıyla döner", () => {
    const rows = winRateByScore([]);
    expect(rows.map((r) => r.bucket)).toEqual(["high", "medium", "low"]);
    expect(hasWinRateSignal(rows)).toBe(false);
  });
});
