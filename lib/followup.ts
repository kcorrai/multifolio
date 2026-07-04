// Follow-up hatırlatıcı (Dalga 3 / Tier 2 #7 — Teal/Simplify deseni): saf
// yardımcı. Başvurulmuş/yanıt beklenen ilan X günden uzun süredir durum
// değiştirmediyse hatırlatma gösterilir. Sunucu + client ortak import eder.
import type { JobStatus } from "@/lib/validation/schemas/job";

/** Hatırlatma eşiği (gün). */
export const FOLLOWUP_AFTER_DAYS = 5;

const FOLLOWUP_STATUSES: ReadonlySet<JobStatus> = new Set(["applied", "awaiting_reply"]);

const DAY_MS = 24 * 60 * 60 * 1000;

/** Eşik aşıldıysa bekleme gün sayısını, aksi halde null döner.
 *  Referans: status_changed_at (varsa) → updated_at fallback (eski satırlar). */
export function followUpDays(
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
  const days = Math.floor(elapsed / DAY_MS);
  return days >= FOLLOWUP_AFTER_DAYS ? days : null;
}
