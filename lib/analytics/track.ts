import "server-only";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductEventName } from "@/lib/analytics/funnel";

/**
 * Ürün olayı yaz (fire-and-forget).
 *
 * KURAL: analitik ASLA kullanıcı akışını bozmaz. Yazım patlarsa istek yine
 * başarılı biter; hata Sentry'ye nefes kesmeden gider (üç sütun kuralı #1'in
 * "sessizce yutulmaz" kısmı — kullanıcıya sızmaz ama biz görürüz).
 *
 * `await` ETMEK ZORUNDA DEĞİLSİN — çağrı zaten kendi hatasını yutar. Route'un
 * yanıtını geciktirmemek için beklemeden çağırmak tercih edilir.
 *
 * Service-role kullanılır çünkü `product_events` RLS'li ve POLİTİKASIZ:
 * kullanıcı kendi huni satırlarını okuyamaz/yazamaz (sayımı kirletemez).
 */
export function trackEvent(
  name: ProductEventName,
  opts: { userId?: string | null; props?: Record<string, string | number | boolean | null> } = {},
): void {
  void (async () => {
    try {
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("product_events").insert({
        user_id: opts.userId ?? null,
        name,
        props: opts.props ?? {},
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      Sentry.captureException(err, { tags: { area: "analytics", event: name } });
    }
  })();
}
