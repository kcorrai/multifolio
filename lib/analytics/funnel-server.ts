import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildFunnel, biggestDropoff, type FunnelStep, type FunnelStepKey, type ProductEventRow } from "@/lib/analytics/funnel";

/** Kohort penceresi. Kısa tutulur: "şu an huni nerede kırılıyor" sorusu için. */
export const FUNNEL_WINDOW_DAYS = 30;

/**
 * auth.users PostgREST'e açık değil → Admin API ile çekilir. Tek sayfa 1000
 * kullanıcı; ürün bu ölçeği aştığında sayfalama gerekir (o gün gelene kadar
 * fazladan karmaşıklık taşımıyoruz — aşıldığında panel bunu SÖYLER).
 */
export const FUNNEL_USER_CAP = 1000;

export interface FunnelData {
  steps: FunnelStep[];
  worst: { from: FunnelStepKey; to: FunnelStepKey; lost: number } | null;
  cohortSize: number;
  /** Kullanıcı sayısı sayfa sınırına dayandı mı (rakamlar eksik olabilir). */
  truncated: boolean;
}

/**
 * Huni verisini yükle. Bileşen DEĞİL — `Date.now()` bilinçli olarak burada:
 * React'in saflık kuralı render sırasında impure çağrıyı yasaklıyor, veri
 * yükleyicide ise doğru yer burası.
 */
export async function loadFunnel(): Promise<FunnelData> {
  const admin = createSupabaseAdminClient();
  const since = new Date(Date.now() - FUNNEL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [usersRes, eventsRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: FUNNEL_USER_CAP }),
    admin.from("product_events").select("user_id, name").gte("created_at", since.toISOString()),
  ]);

  const allUsers = usersRes.data?.users ?? [];

  // Kohort: pencerede KAYIT OLAN kullanıcılar (eski kullanıcılar dönüşümü şişirmesin).
  const cohortIds = allUsers
    .filter((u) => u.created_at && new Date(u.created_at) >= since)
    .map((u) => u.id);

  const steps = buildFunnel(cohortIds, (eventsRes.data ?? []) as ProductEventRow[]);

  return {
    steps,
    worst: biggestDropoff(steps),
    cohortSize: cohortIds.length,
    truncated: allUsers.length >= FUNNEL_USER_CAP,
  };
}
