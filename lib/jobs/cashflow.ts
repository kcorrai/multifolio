// SAF nakit-akışı projeksiyonu (AI/kredi/IO yok, test edilebilir). Aktif pipeline'daki
// işlerin budget metninden best-effort gelir tahmini üretir. Budget serbest metin +
// karışık para birimi olduğundan bu KABA bir yön göstergesidir (kesin muhasebe değil).
import type { JobStatus } from "@/lib/validation/schemas/job";
import { extractBudgetFloor, isHourlyBudget } from "@/lib/feed/filter";

// Aşamaya göre kapanma olasılığı (ağırlık). saved/rejected = 0 → projeksiyon dışı.
export const STAGE_WEIGHTS: Record<JobStatus, number> = {
  saved: 0,
  applied: 0.1,
  awaiting_reply: 0.15,
  interview: 0.4,
  offer: 0.8,
  rejected: 0,
};

// Projeksiyona giren aşamalar (soldan sağa pipeline sırası).
export const CASHFLOW_STAGES: JobStatus[] = ["applied", "awaiting_reply", "interview", "offer"];

export interface CashflowJob {
  status: JobStatus;
  budget: string | null;
}

export interface StageBreakdown {
  status: JobStatus;
  count: number; // bu aşamadaki (fixed, tutarı okunabilen) iş sayısı
  sum: number; // face-value toplam
  weighted: number; // ağırlıklı beklenen (sum × weight)
}

export interface CashflowProjection {
  weighted: number; // ağırlıklı beklenen gelir (tüm aşamalar)
  potential: number; // aktif aşamalardaki toplam face-value
  byStage: StageBreakdown[]; // yalnız tutarı olan aşamalar
  hourlyCount: number; // saatlik (projeksiyona alınmayan) iş sayısı
  countedCount: number; // projeksiyona giren fixed iş sayısı
}

// Aktif işlerden ağırlıklı gelir projeksiyonu. Saatlik bütçeler saat bilinmediği
// için toplama katılmaz (ayrı sayılır); tutarı okunamayan/0 olanlar atlanır.
export function projectCashflow(jobs: CashflowJob[]): CashflowProjection {
  const stageMap = new Map<JobStatus, StageBreakdown>();
  let weighted = 0;
  let potential = 0;
  let hourlyCount = 0;
  let countedCount = 0;

  for (const job of jobs) {
    const weight = STAGE_WEIGHTS[job.status] ?? 0;
    if (weight === 0) continue; // saved/rejected/bilinmeyen
    if (isHourlyBudget(job.budget)) {
      hourlyCount++;
      continue;
    }
    const floor = extractBudgetFloor(job.budget);
    if (floor === null || floor <= 0) continue;

    const w = floor * weight;
    weighted += w;
    potential += floor;
    countedCount++;

    const entry = stageMap.get(job.status) ?? { status: job.status, count: 0, sum: 0, weighted: 0 };
    entry.count++;
    entry.sum += floor;
    entry.weighted += w;
    stageMap.set(job.status, entry);
  }

  const byStage = CASHFLOW_STAGES.map((s) => stageMap.get(s)).filter((x): x is StageBreakdown => Boolean(x));
  return {
    weighted: Math.round(weighted),
    potential: Math.round(potential),
    byStage,
    hourlyCount,
    countedCount,
  };
}
