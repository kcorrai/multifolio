// İş takibinden retention içgörüleri (SAF, kredisiz). Overview'da gösterilir → kullanıcıya
// ilerlemesini/sonuçlarını gösterip geri getirir. Pipeline (huni) ve cashflow Applied
// view'da; bunlar tekrar DEĞİL — yanıt oranı + en aktif platform yalnız burada.
import type { JobStatus } from "@/lib/validation/schemas/job";

// "saved" = henüz başvurulmadı; kalanlar gönderilmiş sayılır.
const APPLIED_STATUSES: JobStatus[] = ["applied", "awaiting_reply", "interview", "offer", "rejected"];
// Müşteri görüşmeye/teklife ilerlettiyse = olumlu yanıt.
const INTERVIEW_STATUSES: JobStatus[] = ["interview", "offer"];

export interface JobInsights {
  appliedCount: number;
  interviewCount: number;
  // Görüşme/teklif ÷ başvuru (%); başvuru yoksa null (sinyal yok).
  responseRate: number | null;
  topPlatform: { platform: string; count: number } | null;
}

export function computeInsights(jobs: { status: JobStatus; platform: string | null }[]): JobInsights {
  const appliedCount = jobs.filter((j) => APPLIED_STATUSES.includes(j.status)).length;
  const interviewCount = jobs.filter((j) => INTERVIEW_STATUSES.includes(j.status)).length;
  const responseRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : null;

  const counts = new Map<string, number>();
  for (const j of jobs) {
    if (!j.platform) continue;
    counts.set(j.platform, (counts.get(j.platform) ?? 0) + 1);
  }
  let topPlatform: { platform: string; count: number } | null = null;
  for (const [platform, count] of counts) {
    if (!topPlatform || count > topPlatform.count) topPlatform = { platform, count };
  }

  return { appliedCount, interviewCount, responseRate, topPlatform };
}

// Anlamlı sinyal var mı (en az bir başvuru) → yoksa içgörü bölümü gizlenir.
export function hasInsightSignal(jobs: { status: JobStatus }[]): boolean {
  return jobs.some((j) => APPLIED_STATUSES.includes(j.status));
}
