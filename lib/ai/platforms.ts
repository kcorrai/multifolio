// Desteklenen platformlar ve her birine özgü uyarlama yönergesi.
// Yeni platform eklemek = buraya bir giriş eklemek (başka değişiklik gerekmez).
import { z } from "zod";

export const platformIdSchema = z.enum([
  "linkedin",
  "upwork",
  "fiverr",
  "bionluk",
  "armut",
]);
export type PlatformId = z.infer<typeof platformIdSchema>;

export interface PlatformSpec {
  id: PlatformId;
  label: string;
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
  fiverr: {
    id: "fiverr",
    label: "Fiverr",
    guidance:
      "Fiverr seller profili için yaz. Enerjik, güven verici, hizmet-odaklı bir ton. " +
      "headline: 'I will...' kalıbıyla değil, Türkçe freelancer kimliği olarak; " +
      "net hizmet alanı + fark yaratan bir özellik belirt. " +
      "body: kısa paragraflar; alıcı kime yardım ettiğini, nasıl çalıştığını ve neden " +
      "tercih edilmesi gerektiğini anlasın. Rakamlar ve somut örneklerle güven oluştur.",
  },
  bionluk: {
    id: "bionluk",
    label: "Bionluk",
    guidance:
      "Bionluk (Türk freelance platformu) profili için yaz. Samimi, profesyonel, " +
      "yerel pazara uygun bir ton — Türk müşterilere hitap et. " +
      "headline: uzmanlık alanını ve hedef müşteriyi açıkça belirten kısa bir başlık. " +
      "body: Türk iş dünyasının beklentilerine uygun; iletişim kolaylığı, hızlı teslimat " +
      "ve güvenilirliği vurgula. Somut proje türleri ve sektörleri listele.",
  },
  armut: {
    id: "armut",
    label: "Armut",
    guidance:
      "Armut (Türk hizmet platformu) profili için yaz. Net, güven verici, " +
      "hizmet tanımı odaklı bir ton — yerel müşteriyle doğrudan konuş. " +
      "headline: sunulan hizmetin tam adını içeren, arama dostu bir başlık. " +
      "body: hangi hizmetleri verdiğini, neden tercih edilmesi gerektiğini ve " +
      "müşterinin ne bekleyebileceğini (süreç, teslimat, iletişim) netçe anlat.",
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];
