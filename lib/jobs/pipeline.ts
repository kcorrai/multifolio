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
