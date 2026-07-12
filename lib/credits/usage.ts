// İstek başına tek usage_events sorgusu + kredi analitiği. Dashboard layout (toplam
// harcama) ile Genel Bakış sayfası (tür/gün dökümü) aynı tabloyu ayrı ayrı çekiyordu.
// React cache() ile sorgu istek başına bir kez çalışır; aggregateCreditUsage saf
// olduğundan iki tüketici de aynı sonuçtan beslenir.
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/auth";
import { aggregateCreditUsage, type CreditAnalytics, type UsageRow } from "@/lib/credits/analytics";

export const getCreditUsage = cache(async (): Promise<CreditAnalytics> => {
  const user = await getRequestUser();
  let rows: UsageRow[] = [];
  if (user) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("usage_events")
      .select("kind, credits_spent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    rows = (data ?? []) as UsageRow[];
  }
  return aggregateCreditUsage(rows, Date.now());
});
