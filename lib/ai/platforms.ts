// Desteklenen platformlar ve her birine özgü uyarlama yönergesi.
// Yeni platform eklemek = buraya bir giriş eklemek (başka değişiklik gerekmez).
import { z } from "zod";

export const platformIdSchema = z.enum([
  "linkedin",
  "upwork",
  "fiverr",
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
      "headline: 'I will...' kalıbıyla değil, net bir freelancer kimliği olarak; " +
      "net hizmet alanı + fark yaratan bir özellik belirt. " +
      "body: kısa paragraflar; alıcı kime yardım ettiğini, nasıl çalıştığını ve neden " +
      "tercih edilmesi gerektiğini anlasın. Rakamlar ve somut örneklerle güven oluştur.",
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

// Platformun MÜŞTERİYE GİDEN metin dili (teklif içeriği bu dilde üretilir —
// UI locale'inden bağımsız; global platformlarda teklif İngilizce olmalı).
export const PLATFORM_LANGUAGE: Record<PlatformId, "en"> = {
  linkedin: "en",
  upwork: "en",
  fiverr: "en",
};

// Her platform için iş teklifi (proposal) yönergesi.
export const PROPOSAL_GUIDANCE: Record<PlatformId, string> = {
  linkedin: "LinkedIn InMail veya bağlantı isteği mesajı olarak yaz. " +
    "Kısa ve profesyonel (150-200 kelime). İlk cümlede ortak bağlantı noktasını veya ilgi çekici " +
    "bir gözlemi paylaş. Deneyimi somut sonuçlarla destekle. Resmi ama insani bir ton kullan.",
  upwork: "Upwork iş teklifi (cover letter) olarak yaz. İlk 2 cümlede alıcının dikkatini çek — " +
    "ilanın özünü anladığını göster. Maksimum 200 kelime. Müşteri odaklı; kendi becerilerini " +
    "müşterinin sorununu çözme kapasitesi üzerinden anlat. Net bir eylem çağrısıyla bitir.",
  fiverr: "Fiverr Buyer Request yanıtı olarak yaz. Enerjik, doğrudan ve güven verici. " +
    "Ne teslim edeceğini ve sürecinin nasıl işlediğini net anlat. " +
    "150 kelimeyi geçme. Kısa paragraflar kullan.",
};
