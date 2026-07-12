import { describe, it, expect } from "vitest";
import { computeInsights, hasInsightSignal } from "./insights";
import type { JobStatus } from "@/lib/validation/schemas/job";

const j = (status: JobStatus, platform: string | null = "upwork") => ({ status, platform });

describe("computeInsights", () => {
  it("boş liste → sinyal yok, oran null", () => {
    const r = computeInsights([]);
    expect(r).toEqual({ appliedCount: 0, interviewCount: 0, responseRate: null, topPlatform: null });
    expect(hasInsightSignal([])).toBe(false);
  });

  it("yalnız 'saved' → başvuru yok, sinyal yok", () => {
    expect(hasInsightSignal([j("saved"), j("saved")])).toBe(false);
    expect(computeInsights([j("saved")]).responseRate).toBeNull();
  });

  it("yanıt oranı = (interview+offer)/başvuru", () => {
    const jobs = [j("applied"), j("applied"), j("interview"), j("offer")]; // 4 başvuru, 2 görüşme
    const r = computeInsights(jobs);
    expect(r.appliedCount).toBe(4);
    expect(r.interviewCount).toBe(2);
    expect(r.responseRate).toBe(50);
  });

  it("rejected başvuru sayılır ama görüşme sayılmaz", () => {
    const r = computeInsights([j("applied"), j("rejected")]);
    expect(r.appliedCount).toBe(2);
    expect(r.interviewCount).toBe(0);
    expect(r.responseRate).toBe(0);
  });

  it("en aktif platform = en çok işi olan", () => {
    const jobs = [j("applied", "upwork"), j("applied", "fiverr"), j("saved", "fiverr"), j("interview", "fiverr")];
    expect(computeInsights(jobs).topPlatform).toEqual({ platform: "fiverr", count: 3 });
  });

  it("platform'suz işler en-aktif sayımına girmez", () => {
    expect(computeInsights([j("applied", null), j("applied", null)]).topPlatform).toBeNull();
  });
});
