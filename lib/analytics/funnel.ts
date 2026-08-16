// SAF aktivasyon hunisi motoru (I/O yok, vitest'li).
//
// Soru: "kayıt olan kullanıcı nerede düşüyor?" Cevabı ölçmek için istemci
// scripti gerekmiyor — adımların hepsi zaten sunucu rotalarında gerçekleşiyor.
// Bu dosya yalnız SAYIM ve DÖNÜŞÜM hesabını yapar; okuma `lib/analytics/track.ts`
// ve `/admin` tarafında.

/** Kanonik ürün olayları. Yeni olay eklerken TEK yer burası. */
export const PRODUCT_EVENTS = [
  "profile_imported",   // /api/profile/import — AI taslak üretildi
  "profile_saved",      // /api/profile POST — profil kaydedildi (AKTİVASYON)
  "adapt_generated",    // /api/adapt — ilk platform metni
  "proposal_generated", // /api/proposal POST — ilk teklif
  "portfolio_published",// /api/portfolio PUT — yayınlandı
  "checkout_started",   // /api/checkout — ödeme sayfasına gidildi
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

/**
 * Huni adımları. İlk adım olay DEĞİL — `auth.users` sayımı.
 * Böylece kayıt için ayrı bir istemci olayı enstrümante etmeye gerek kalmaz.
 */
export const FUNNEL_STEPS = [
  { key: "signup", event: null },
  { key: "profile_saved", event: "profile_saved" },
  { key: "adapt_generated", event: "adapt_generated" },
  { key: "proposal_generated", event: "proposal_generated" },
  { key: "checkout_started", event: "checkout_started" },
] as const;

export type FunnelStepKey = (typeof FUNNEL_STEPS)[number]["key"];

/** Ham satır — yalnız huni için gereken alanlar. */
export interface ProductEventRow {
  user_id: string | null;
  name: string;
}

export interface FunnelStep {
  key: FunnelStepKey;
  /** Bu adıma ulaşan FARKLI kullanıcı sayısı. */
  users: number;
  /** İlk adıma göre yüzde (0-100, tam sayı). */
  ofTotalPct: number;
  /** Bir ÖNCEKİ adıma göre yüzde — asıl sızıntı burada görünür. */
  ofPreviousPct: number;
}

/**
 * Huniyi kur. `signupUserIds` dönem içinde kayıt olan kullanıcılar;
 * `rows` aynı dönemin ürün olayları.
 *
 * Kohort mantığı: bir adım yalnız DÖNEMDE KAYIT OLAN kullanıcılar için sayılır.
 * Aksi halde eski kullanıcıların aktivitesi dönüşümü %100'ün üstüne çıkarır.
 */
export function buildFunnel(signupUserIds: string[], rows: ProductEventRow[]): FunnelStep[] {
  const cohort = new Set(signupUserIds);
  const total = cohort.size;

  // Olay adı → kohorttaki farklı kullanıcılar.
  const reached = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.user_id || !cohort.has(row.user_id)) continue;
    let set = reached.get(row.name);
    if (!set) {
      set = new Set();
      reached.set(row.name, set);
    }
    set.add(row.user_id);
  }

  const steps: FunnelStep[] = [];
  let previous = total;

  for (const step of FUNNEL_STEPS) {
    const users = step.event === null ? total : (reached.get(step.event)?.size ?? 0);
    steps.push({
      key: step.key,
      users,
      ofTotalPct: total > 0 ? Math.round((users / total) * 100) : 0,
      ofPreviousPct: previous > 0 ? Math.round((users / previous) * 100) : 0,
    });
    previous = users;
  }

  return steps;
}

/**
 * En büyük sızıntıyı bulur — hangi adımda en çok kullanıcı kayboluyor.
 * İlk adım aday değildir (öncesi yok). Hiç kayıp yoksa null.
 */
export function biggestDropoff(steps: FunnelStep[]): { from: FunnelStepKey; to: FunnelStepKey; lost: number } | null {
  let worst: { from: FunnelStepKey; to: FunnelStepKey; lost: number } | null = null;

  for (let i = 1; i < steps.length; i++) {
    const lost = steps[i - 1].users - steps[i].users;
    if (lost <= 0) continue;
    if (!worst || lost > worst.lost) {
      worst = { from: steps[i - 1].key, to: steps[i].key, lost };
    }
  }

  return worst;
}
