import { describe, it, expect } from "vitest";
import { followUpDays, followUpStage, FOLLOWUP_AFTER_DAYS, FOLLOWUP_SECOND_DAYS } from "./followup";

const NOW = new Date("2026-07-10T12:00:00Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

describe("followUpDays", () => {
  it("eşik aşılınca bekleme gün sayısını döner", () => {
    expect(followUpDays("applied", daysAgo(7), null, NOW)).toBe(7);
    expect(followUpDays("awaiting_reply", daysAgo(FOLLOWUP_AFTER_DAYS), null, NOW)).toBe(FOLLOWUP_AFTER_DAYS);
  });

  it("eşik altında null döner", () => {
    expect(followUpDays("applied", daysAgo(FOLLOWUP_AFTER_DAYS - 1), null, NOW)).toBeNull();
    expect(followUpDays("applied", daysAgo(0), null, NOW)).toBeNull();
  });

  it("yalnız applied/awaiting_reply durumlarında çalışır", () => {
    expect(followUpDays("saved", daysAgo(30), null, NOW)).toBeNull();
    expect(followUpDays("interview", daysAgo(30), null, NOW)).toBeNull();
    expect(followUpDays("offer", daysAgo(30), null, NOW)).toBeNull();
    expect(followUpDays("rejected", daysAgo(30), null, NOW)).toBeNull();
  });

  it("status_changed_at yoksa updated_at'e düşer (eski satırlar)", () => {
    expect(followUpDays("applied", null, daysAgo(9), NOW)).toBe(9);
    expect(followUpDays("applied", undefined, daysAgo(9), NOW)).toBe(9);
  });

  it("status_changed_at updated_at'ten önceliklidir", () => {
    // Not düzenlemesi updated_at'i sıçratmış olsa da sayaç durum değişiminden sayılır.
    expect(followUpDays("applied", daysAgo(8), daysAgo(1), NOW)).toBe(8);
  });

  it("iki referans da yoksa veya tarih bozuksa null döner", () => {
    expect(followUpDays("applied", null, null, NOW)).toBeNull();
    expect(followUpDays("applied", "not-a-date", null, NOW)).toBeNull();
  });
});

describe("followUpStage", () => {
  it("eşik altında null döner", () => {
    expect(followUpStage("applied", daysAgo(FOLLOWUP_AFTER_DAYS - 1), null, NOW)).toBeNull();
    expect(followUpStage("applied", daysAgo(0), null, NOW)).toBeNull();
  });

  it("5–11 gün arası 'first' aşamasıdır", () => {
    expect(followUpStage("applied", daysAgo(FOLLOWUP_AFTER_DAYS), null, NOW)).toEqual({ days: 5, stage: "first" });
    expect(followUpStage("awaiting_reply", daysAgo(FOLLOWUP_SECOND_DAYS - 1), null, NOW)).toEqual({ days: 11, stage: "first" });
  });

  it("≥12 gün 'second' aşamasıdır", () => {
    expect(followUpStage("applied", daysAgo(FOLLOWUP_SECOND_DAYS), null, NOW)).toEqual({ days: 12, stage: "second" });
    expect(followUpStage("applied", daysAgo(20), null, NOW)).toEqual({ days: 20, stage: "second" });
  });

  it("yalnız applied/awaiting_reply durumlarında çalışır", () => {
    expect(followUpStage("saved", daysAgo(30), null, NOW)).toBeNull();
    expect(followUpStage("interview", daysAgo(30), null, NOW)).toBeNull();
  });
});
