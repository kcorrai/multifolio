// Kredi harcama sarmalayıcısı: krediyi ATOMİK düşer (yetersizse işi hiç
// çalıştırmaz), işi çalıştırır, iş patlarsa krediyi iade eder. Yalnız sunucuda.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { InsufficientCreditsError } from "@/lib/errors";
import { CREDIT_COSTS, type CreditKind } from "./costs";

export async function spendCredits<T>(
  userId: string,
  kind: CreditKind,
  work: () => Promise<T>,
): Promise<{ result: T; balance: number; spent: number }> {
  const admin = createSupabaseAdminClient();
  const cost = CREDIT_COSTS[kind];

  const { data: balance, error } = await admin.rpc("deduct_credits", {
    p_user: userId,
    p_amount: cost,
  });
  if (error) {
    if (error.message?.includes("insufficient_credits")) {
      throw new InsufficientCreditsError();
    }
    throw error;
  }

  try {
    const result = await work();
    return { result, balance: balance as number, spent: cost };
  } catch (err) {
    // İş patladı → krediyi geri yükle, sonra hatayı yükselt.
    await admin.rpc("refund_credits", { p_user: userId, p_amount: cost });
    throw err;
  }
}
