// Kazanma oranı × AI-skor analitiği (SAF): başvurulan işleri AI eşleşme skoruna göre
// bantlara ayırıp her bantta kazanma oranını hesaplar. Amaç: "yüksek skor → daha çok
// kazanma" ilişkisini KANITLAMAK (çekirdek eşleştirme özelliğinin değeri). AI/kredi YOK.
// Genel CRM'ler bunu yapamaz — Multifolio'nun skor verisi + outcome pipeline'ı var.
import type { JobStatus } from "@/lib/validation/schemas/job";

export interface WinRateJob {
  status: JobStatus;
  match_score: number | null;
}

export type ScoreBucket = "high" | "medium" | "low";

// Rubrik verdict eşikleriyle hizalı (≥70 go / ≥40 maybe / <40 skip — lib/ai/rubric.ts).
export function scoreBucket(score: number): ScoreBucket {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export interface WinRateRow {
  bucket: ScoreBucket;
  /** Başvurulan (saved hariç, skoru olan) ilan sayısı. */
  applied: number;
  /** Görüşme + teklif aşamasına ulaşan (pozitif sonuç). */
  won: number;
  /** Sonuçlanmış (görüşme + teklif + reddedildi) — bekleyen hariç. */
  decided: number;
  /** won / decided (%), decided 0 ise null. */
  winRate: number | null;
}

// "Başvuruldu" = saved dışındaki tüm durumlar (kullanıcı gerçekten başvurdu).
const APPLIED_STATUSES: ReadonlySet<JobStatus> = new Set([
  "applied", "awaiting_reply", "interview", "offer", "rejected",
]);
const WON_STATUSES: ReadonlySet<JobStatus> = new Set(["interview", "offer"]);
const DECIDED_STATUSES: ReadonlySet<JobStatus> = new Set(["interview", "offer", "rejected"]);

const BUCKET_ORDER: ScoreBucket[] = ["high", "medium", "low"];

/**
 * Skoru olan + başvurulan işleri banda böler, her bant için kazanma oranını döner.
 * Skoru olmayan veya yalnız "saved" işler dışlanır (başvuru yok → sinyal yok).
 * Her zaman 3 bandı (high/medium/low) döner; sırayla — boş bantlar UI'da gizlenebilir.
 */
export function winRateByScore(jobs: WinRateJob[]): WinRateRow[] {
  const init: Record<ScoreBucket, WinRateRow> = {
    high: { bucket: "high", applied: 0, won: 0, decided: 0, winRate: null },
    medium: { bucket: "medium", applied: 0, won: 0, decided: 0, winRate: null },
    low: { bucket: "low", applied: 0, won: 0, decided: 0, winRate: null },
  };

  for (const j of jobs) {
    if (j.match_score == null) continue;
    if (!APPLIED_STATUSES.has(j.status)) continue;
    const b = init[scoreBucket(j.match_score)];
    b.applied += 1;
    if (WON_STATUSES.has(j.status)) b.won += 1;
    if (DECIDED_STATUSES.has(j.status)) b.decided += 1;
  }

  for (const b of BUCKET_ORDER) {
    const row = init[b];
    row.winRate = row.decided > 0 ? Math.round((row.won / row.decided) * 100) : null;
  }
  return BUCKET_ORDER.map((b) => init[b]);
}

/** Analitiği göstermeye değer mi (en az bir başvurulan+skorlu iş var mı). */
export function hasWinRateSignal(rows: WinRateRow[]): boolean {
  return rows.some((r) => r.applied > 0);
}
