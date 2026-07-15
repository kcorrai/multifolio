// Follow-up hatırlatıcı (Dalga 3 / Tier 2 #7 — Teal/Simplify deseni): saf
// yardımcı. Başvurulmuş/yanıt beklenen ilan X günden uzun süredir durum
// değiştirmediyse hatırlatma gösterilir. Sunucu + client ortak import eder.
import type { JobStatus } from "@/lib/validation/schemas/job";

/** İlk hatırlatma eşiği (gün) — nazik hatırlatma. */
export const FOLLOWUP_AFTER_DAYS = 5;
/** İkinci (son) hatırlatma eşiği (gün) — kibar son dürtme. Takip disiplini iki
 *  aşamalıdır: ilk hatırlatma yanıtsız kalırsa daha kararlı bir son takip önerilir. */
export const FOLLOWUP_SECOND_DAYS = 12;

const FOLLOWUP_STATUSES: ReadonlySet<JobStatus> = new Set(["applied", "awaiting_reply"]);

const DAY_MS = 24 * 60 * 60 * 1000;

/** status_changed_at (varsa) → updated_at fallback (eski satırlar) referansından
 *  geçen tam gün sayısı; takip durumunda değilse veya referans yoksa/bozuksa null. */
function elapsedDays(
  status: JobStatus,
  statusChangedAt: string | null | undefined,
  updatedAt: string | null | undefined,
  now: Date,
): number | null {
  if (!FOLLOWUP_STATUSES.has(status)) return null;
  const ref = statusChangedAt ?? updatedAt;
  if (!ref) return null;
  const elapsed = now.getTime() - new Date(ref).getTime();
  if (Number.isNaN(elapsed)) return null;
  return Math.floor(elapsed / DAY_MS);
}

/** Eşik aşıldıysa bekleme gün sayısını, aksi halde null döner (geriye-uyum). */
export function followUpDays(
  status: JobStatus,
  statusChangedAt: string | null | undefined,
  updatedAt: string | null | undefined,
  now: Date,
): number | null {
  const days = elapsedDays(status, statusChangedAt, updatedAt, now);
  return days !== null && days >= FOLLOWUP_AFTER_DAYS ? days : null;
}

/** Takip aşaması: eşik altındaysa null; 5–11 gün "first" (nazik), ≥12 gün "second"
 *  (son dürtme). UI banner tonunu ve AI mesaj yönergesini bu aşama belirler. */
export function followUpStage(
  status: JobStatus,
  statusChangedAt: string | null | undefined,
  updatedAt: string | null | undefined,
  now: Date,
): { days: number; stage: "first" | "second" } | null {
  const days = elapsedDays(status, statusChangedAt, updatedAt, now);
  if (days === null || days < FOLLOWUP_AFTER_DAYS) return null;
  return { days, stage: days >= FOLLOWUP_SECOND_DAYS ? "second" : "first" };
}
