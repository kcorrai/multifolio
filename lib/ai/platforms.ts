// Desteklenen platformlar ve her birine özgü uyarlama yönergesi.
// Faz 1: LinkedIn + Upwork. Yeni platform eklemek = buraya bir giriş eklemek.
import { z } from "zod";

// platformIdSchema = tek doğruluk kaynağı; PlatformId ve PLATFORM_IDS bundan türer.
export const platformIdSchema = z.enum(["linkedin", "upwork"]);
export type PlatformId = z.infer<typeof platformIdSchema>;

export interface PlatformSpec {
  id: PlatformId;
  label: string;
  /** Modele verilecek platform-özgü ton/biçim yönergesi. */
  guidance: string;
}

export const PLATFORMS: Record<PlatformId, PlatformSpec> = {
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    guidance:
      "LinkedIn profili için yaz. Birinci tekil şahıs, profesyonel ama insani bir ton. " +
      "headline: 220 karakteri aşmayan, rol + değer önerisi içeren bir başlık. " +
      "body: 3-4 kısa paragraf 'Hakkında' (About) bölümü; başarıları somut sonuçlarla " +
      "anlat, sektör anahtar kelimelerini doğal kullan, davet edici bir kapanışla bitir.",
  },
  upwork: {
    id: "upwork",
    label: "Upwork",
    guidance:
      "Upwork freelancer profili için yaz. Müşteri-odaklı, sonuç vaat eden bir ton. " +
      "headline: hizmeti net tanımlayan kısa bir uzmanlık başlığı (ör. 'React & Next.js " +
      "Frontend Developer'). body: müşterinin sorununu çözmeye odaklı bir özet; ne " +
      "yapabileceğini, hangi sonuçları getirdiğini ve neden seçilmesi gerektiğini açıkla; " +
      "kısa, taranabilir, harekete geçirici.",
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];
