import { describe, it, expect } from "vitest";
import { computePipeline, benchmarkBand } from "./pipeline";
import type { JobStatus } from "@/lib/validation/schemas/job";

const mk = (statuses: JobStatus[]) => statuses.map((status) => ({ status }));

describe("computePipeline", () => {
  it("huni sayılarını ve dönüşüm oranlarını hesaplar", () => {
    // 2 saved, 4 applied, 2 awaiting, 2 interview, 1 offer, 1 rejected
    const jobs = mk([
      "saved", "saved",
      "applied", "applied", "applied", "applied",
      "awaiting_reply", "awaiting_reply",
      "interview", "interview",
      "offer",
      "rejected",
    ]);
    const r = computePipeline(jobs);
    expect(r.saved).toBe(2);
    expect(r.sent).toBe(10); // saved hariç
    expect(r.awaiting).toBe(6); // applied + awaiting_reply
    expect(r.interviewing).toBe(3); // interview + offer
    expect(r.offers).toBe(1);
    expect(r.rejected).toBe(1);
    expect(r.responded).toBe(4); // interview + offer + rejected
    expect(r.responseRate).toBe(40); // 4/10
    expect(r.interviewRate).toBe(30); // 3/10
    expect(r.offerRate).toBe(10); // 1/10
  });

  it("hiç başvuru yoksa oranlar 0 (sıfıra bölme yok)", () => {
    const r = computePipeline(mk(["saved", "saved"]));
    expect(r.sent).toBe(0);
    expect(r.responseRate).toBe(0);
    expect(r.interviewRate).toBe(0);
    expect(r.offerRate).toBe(0);
  });

  it("boş liste patlamaz", () => {
    const r = computePipeline([]);
    expect(r.sent).toBe(0);
    expect(r.saved).toBe(0);
  });
});

describe("benchmarkBand", () => {
  it("yanıt oranı bantları (eşikler 8 / 20)", () => {
    expect(benchmarkBand(0, "response")).toBe("low");
    expect(benchmarkBand(7, "response")).toBe("low");
    expect(benchmarkBand(8, "response")).toBe("ok");
    expect(benchmarkBand(19, "response")).toBe("ok");
    expect(benchmarkBand(20, "response")).toBe("good");
    expect(benchmarkBand(40, "response")).toBe("good");
  });

  it("mülakat oranı bantları (eşikler 4 / 10)", () => {
    expect(benchmarkBand(3, "interview")).toBe("low");
    expect(benchmarkBand(4, "interview")).toBe("ok");
    expect(benchmarkBand(10, "interview")).toBe("good");
  });
});
