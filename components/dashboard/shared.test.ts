import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "./shared";

const now = new Date("2026-07-01T12:00:00Z");

describe("formatRelativeTime", () => {
  it("dakika döndürür", () => {
    expect(formatRelativeTime("2026-07-01T11:30:00Z", now)).toEqual({ value: 30, unit: "minute" });
  });
  it("saat döndürür", () => {
    expect(formatRelativeTime("2026-07-01T09:00:00Z", now)).toEqual({ value: 3, unit: "hour" });
  });
  it("gün döndürür", () => {
    expect(formatRelativeTime("2026-06-29T12:00:00Z", now)).toEqual({ value: 2, unit: "day" });
  });
  it("null girdide null döner", () => {
    expect(formatRelativeTime(null, now)).toBeNull();
  });
});
