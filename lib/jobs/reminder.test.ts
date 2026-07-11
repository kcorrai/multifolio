import { describe, it, expect } from "vitest";
import { daysUntil, reminderUrgency } from "./reminder";

const now = new Date(2026, 6, 11); // 2026-07-11 yerel gün-başı

describe("daysUntil", () => {
  it("bugün=0, dün=-1, yarın=+1", () => {
    expect(daysUntil("2026-07-11", now)).toBe(0);
    expect(daysUntil("2026-07-10", now)).toBe(-1);
    expect(daysUntil("2026-07-12", now)).toBe(1);
  });
  it("saat eki gün farkını etkilemez (timezone kaymaz)", () => {
    expect(daysUntil("2026-07-14T23:00:00Z", now)).toBe(3);
  });
  it("geçersiz/boş → null", () => {
    expect(daysUntil("", now)).toBeNull();
    expect(daysUntil(null, now)).toBeNull();
    expect(daysUntil("not-a-date", now)).toBeNull();
  });
});

describe("reminderUrgency", () => {
  it("geçmiş=overdue, bugün=today, 1-2=soon, sonrası=upcoming", () => {
    expect(reminderUrgency("2026-07-09", now)).toBe("overdue");
    expect(reminderUrgency("2026-07-11", now)).toBe("today");
    expect(reminderUrgency("2026-07-12", now)).toBe("soon");
    expect(reminderUrgency("2026-07-13", now)).toBe("soon");
    expect(reminderUrgency("2026-07-20", now)).toBe("upcoming");
  });
  it("geçersiz → null", () => {
    expect(reminderUrgency(null, now)).toBeNull();
  });
});
