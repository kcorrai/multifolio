// Başvuru pipeline analitiği (SAF, AI/kredi/DB yok): kullanıcının takip ettiği
// işlerden huni + dönüşüm oranları. "Başvuruların %X'i mülakata ulaştı" içgörüsü.
// Applied görünümünde (liste + pano) mevcut jobs listesinden hesaplanır.
import type { JobStatus } from "@/lib/validation/schemas/job";

export interface PipelineStats {
  /** Kaydedilmiş (henüz başvurulmamış). */
  saved: number;
  /** Gönderilen başvuru (saved hariç tümü). */
  sent: number;
  /** Yanıt bekleyen (applied + awaiting_reply). */
  awaiting: number;
  /** Müşteri yanıtı gelen (interview + offer + rejected). */
  responded: number;
  /** Mülakat aşamasına ulaşan (interview + offer). */
  interviewing: number;
  /** Teklif alınan. */
  offers: number;
  /** Reddedilen. */
  rejected: number;
  /** responded / sent (0-100). */
  responseRate: number;
  /** interviewing / sent (0-100). */
  interviewRate: number;
  /** offers / sent (0-100). */
  offerRate: number;
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/** Sektör kıyas bandı: kullanıcının oranı "düşük / normal / iyi" mi?
 *  Bantlar freelance başvuru dönüşümü için kaba referans (kaynak yok — yalnızca
 *  bağlam; kullanıcıya "iyi mi kötü mü" hissi verir). AI/DB yok, saf. */
export type BenchmarkBand = "low" | "ok" | "good";
export type BenchmarkKind = "response" | "interview";

/** [ok-eşiği, good-eşiği] (yüzde). Altı "low", arası "ok", üstü "good". */
export const BENCHMARK_THRESHOLDS: Record<BenchmarkKind, readonly [number, number]> = {
  // Yanıt oranı (yanıt gelen / gönderilen): tipik freelance başvuruda ~%5–20.
  response: [8, 20],
  // Mülakat oranı (mülakat+teklif / gönderilen): ~%3–10.
  interview: [4, 10],
};

export function benchmarkBand(rate: number, kind: BenchmarkKind): BenchmarkBand {
  const [ok, good] = BENCHMARK_THRESHOLDS[kind];
  if (rate >= good) return "good";
  if (rate >= ok) return "ok";
  return "low";
}

export function computePipeline(jobs: { status: JobStatus }[]): PipelineStats {
  let saved = 0, applied = 0, awaitingReply = 0, interview = 0, offer = 0, rejected = 0;
  for (const j of jobs) {
    switch (j.status) {
      case "saved": saved++; break;
      case "applied": applied++; break;
      case "awaiting_reply": awaitingReply++; break;
      case "interview": interview++; break;
      case "offer": offer++; break;
      case "rejected": rejected++; break;
    }
  }
  const sent = applied + awaitingReply + interview + offer + rejected;
  const awaiting = applied + awaitingReply;
  const interviewing = interview + offer;
  const responded = interviewing + rejected;
  const offers = offer;

  return {
    saved,
    sent,
    awaiting,
    responded,
    interviewing,
    offers,
    rejected,
    responseRate: pct(responded, sent),
    interviewRate: pct(interviewing, sent),
    offerRate: pct(offers, sent),
  };
}
