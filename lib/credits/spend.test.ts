import { describe, it, expect, vi, beforeEach } from "vitest";

// Admin client'ı mockla: rpc çağrılarını yakala.
const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

// next-intl'in sunucu request kapsamı bu birim testte yok; getTranslations'ı mockla.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

import { spendCredits } from "./spend";
import { InsufficientCreditsError } from "@/lib/errors";

beforeEach(() => rpc.mockReset());

describe("spendCredits", () => {
  it("krediyi düşer, işi çalıştırır, bakiye+spent döner", async () => {
    rpc.mockResolvedValueOnce({ data: 98, error: null }); // deduct_credits → yeni bakiye 98
    const work = vi.fn().mockResolvedValue("ok");

    const out = await spendCredits("u1", "proposal", work);

    expect(rpc).toHaveBeenCalledWith("deduct_credits", { p_user: "u1", p_amount: 2 });
    expect(work).toHaveBeenCalledOnce();
    expect(out).toEqual({ result: "ok", balance: 98, spent: 2 });
  });

  it("yetersiz kredide işi ÇALIŞTIRMAZ ve InsufficientCreditsError fırlatır", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "insufficient_credits" } });
    const work = vi.fn();

    await expect(spendCredits("u1", "adaptation", work)).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(work).not.toHaveBeenCalled();
  });

  it("iş patlarsa krediyi iade eder ve hatayı yeniden fırlatır", async () => {
    rpc.mockResolvedValueOnce({ data: 99, error: null });  // deduct
    rpc.mockResolvedValueOnce({ data: 100, error: null });  // refund
    const boom = new Error("AI patladı");
    const work = vi.fn().mockRejectedValue(boom);

    await expect(spendCredits("u1", "adaptation", work)).rejects.toBe(boom);
    expect(rpc).toHaveBeenNthCalledWith(2, "refund_credits", { p_user: "u1", p_amount: 1 });
  });
});
