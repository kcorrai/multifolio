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
  bionluk: "Bionluk iş teklifi olarak yaz. Türkçe, samimi ve profesyonel bir ton. " +
    "Yerel iş dünyasına uygun; hızlı iletişim, güvenilirlik ve yerel referansları öne çıkar. " +
    "150-200 kelime. İlanın gereksinimlerine özelleştirilmiş bir yaklaşım sun.",
  armut: "Armut platformu için hizmet teklifi olarak yaz. Türkçe, net ve güven odaklı. " +
    "Sunulan hizmetin kapsamını, sürecini ve neden tercih edilmesi gerektiğini açıkla. " +
    "Yerel müşteriyle doğrudan konuş; somut örnekler ve referanslar ekle. 150-200 kelime.",
};
