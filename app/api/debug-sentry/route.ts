// TEST UÇ NOKTASI — Sentry'nin doğru çalıştığını (doğru satırla) doğrulamak için
// bilerek hata fırlatır. Faz 0 doğrulamasından sonra kaldırılabilir.
//
// GET /api/debug-sentry  → bilinmeyen hata yolu: withErrorHandler bunu
//   Sentry'ye gönderir ve istemciye generic 500 döner.
import { withErrorHandler } from "@/lib/errors";

export const GET = withErrorHandler(async () => {
  throw new Error("Multifolio Sentry test hatası — bilerek fırlatıldı.");
});
