import { describe, expect, it } from "vitest";
import { buildFunnel, biggestDropoff, type ProductEventRow } from "@/lib/analytics/funnel";

const rows = (...pairs: Array<[string | null, string]>): ProductEventRow[] =>
  pairs.map(([user_id, name]) => ({ user_id, name }));

describe("buildFunnel", () => {
  it("kohort boşken her adım sıfır — bölme hatası yok", () => {
    const steps = buildFunnel([], []);
    expect(steps.map((s) => s.users)).toEqual([0, 0, 0, 0, 0]);
    expect(steps.every((s) => s.ofTotalPct === 0 && s.ofPreviousPct === 0)).toBe(true);
  });

  it("ilk adım kayıt sayısıdır — olay gerekmez", () => {
    const steps = buildFunnel(["a", "b", "c"], []);
    expect(steps[0]).toMatchObject({ key: "signup", users: 3, ofTotalPct: 100, ofPreviousPct: 100 });
  });

  it("aynı kullanıcının tekrar eden olayı bir kez sayılır", () => {
    const steps = buildFunnel(["a", "b"], rows(["a", "profile_saved"], ["a", "profile_saved"]));
    expect(steps[1]).toMatchObject({ key: "profile_saved", users: 1, ofTotalPct: 50 });
  });

  it("kohort DIŞI kullanıcının olayı sayılmaz — dönüşüm %100'ü aşamaz", () => {
    // 'eski' dönem öncesinden gelen bir kullanıcı; kohortta yok.
    const steps = buildFunnel(["a"], rows(["a", "profile_saved"], ["eski", "profile_saved"]));
    expect(steps[1].users).toBe(1);
    expect(steps[1].ofTotalPct).toBe(100);
  });

  it("user_id'si silinmiş (null) olay sayıma girmez ama patlatmaz", () => {
    const steps = buildFunnel(["a"], rows([null, "profile_saved"]));
    expect(steps[1].users).toBe(0);
  });

  it("ofPreviousPct bir önceki adıma göre hesaplanır", () => {
    const steps = buildFunnel(
      ["a", "b", "c", "d"],
      rows(
        ["a", "profile_saved"], ["b", "profile_saved"],
        ["a", "adapt_generated"],
      ),
    );
    // 4 kayıt → 2 profil (%50) → 1 adapt (toplamın %25'i, öncekinin %50'si)
    expect(steps[1]).toMatchObject({ users: 2, ofTotalPct: 50, ofPreviousPct: 50 });
    expect(steps[2]).toMatchObject({ users: 1, ofTotalPct: 25, ofPreviousPct: 50 });
  });

  it("adım atlayan kullanıcı sonraki adımda sayılır (huni katı değil)", () => {
    // Kullanıcı profil kaydetmeden teklif üretemez ama veri bozuksa bile
    // hesap patlamamalı: adım bazlı sayım bağımsızdır.
    const steps = buildFunnel(["a"], rows(["a", "proposal_generated"]));
    expect(steps[1].users).toBe(0);
    expect(steps[3].users).toBe(1);
    // Önceki adım 0 iken yüzde 0 döner, Infinity DEĞİL.
    expect(Number.isFinite(steps[3].ofPreviousPct)).toBe(true);
    expect(steps[3].ofPreviousPct).toBe(0);
  });
});

describe("biggestDropoff", () => {
  it("hiç kayıp yoksa null", () => {
    const steps = buildFunnel(["a"], rows(
      ["a", "profile_saved"], ["a", "adapt_generated"],
      ["a", "proposal_generated"], ["a", "checkout_started"],
    ));
    expect(biggestDropoff(steps)).toBeNull();
  });

  it("en çok kullanıcı kaybedilen geçişi bulur", () => {
    const steps = buildFunnel(
      ["a", "b", "c", "d", "e"],
      rows(
        ["a", "profile_saved"], ["b", "profile_saved"], ["c", "profile_saved"], ["d", "profile_saved"],
        ["a", "adapt_generated"],
      ),
    );
    // 5 → 4 (1 kayıp), 4 → 1 (3 kayıp) ← en büyük
    expect(biggestDropoff(steps)).toEqual({ from: "profile_saved", to: "adapt_generated", lost: 3 });
  });
});
