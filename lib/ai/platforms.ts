// Desteklenen platformlar ve her birine özgü uyarlama yönergesi.
// Yeni platform eklemek = buraya bir giriş eklemek (başka değişiklik gerekmez).
import { z } from "zod";

export const platformIdSchema = z.enum([
  "linkedin",
  "upwork",
  "fiverr",
  "freelancer",
  "contra",
  "peopleperhour",
  "99designs",
  "guru",
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
      "headline: 220 karakteri aşmayan, rol + hedef anahtar kelime + değer önerisi; EN GÜÇLÜ " +
      "bilgi İLK 80 KARAKTERE gelsin (arama/mobil önizlemede yalnız o görünür). " +
      "body: 'Hakkında' (About) bölümü; İLK 2 CÜMLE en kritik (kısa, ~15 kelimeyi aşmayan — " +
      "'see more' öncesi ~200-300 karakter görünür) ve kime nasıl yardım ettiğini söylemeli. " +
      "Ardından 3-4 kısa paragraf: başarıları somut sonuçlarla anlat, sektör anahtar kelimelerini " +
      "doğal kullan, davet edici bir kapanışla bitir.",
  },
  upwork: {
    id: "upwork",
    label: "Upwork",
    guidance:
      "Upwork freelancer profili için yaz. Müşteri-odaklı, sonuç vaat eden bir ton. " +
      "headline: hizmeti net tanımlayan kısa bir uzmanlık başlığı (ör. 'React & Next.js " +
      "Frontend Developer'). body (overview): İLK 2 SATIR müşterinin sorununa/sonucuna odaklanmalı " +
      "(teklif ve arama önizlemesinde yalnız ilk satırlar görünür); kendinden söz ederek AÇMA. " +
      "Ardından ne yaptığını, hangi sonuçları getirdiğini ve neden seçilmesi gerektiğini açıkla; " +
      "kısa, taranabilir, harekete geçirici. NOT: 'specialized profile' önerme (Upwork kaldırdı).",
  },
  fiverr: {
    id: "fiverr",
    label: "Fiverr",
    guidance:
      "Fiverr seller profili için yaz. Enerjik, güven verici, hizmet-odaklı bir ton. " +
      "headline: 'I will...' kalıbıyla değil, net bir freelancer kimliği olarak; alıcının " +
      "ARAYACAĞI birincil anahtar kelimeyi öne koy + fark yaratan bir özellik belirt. " +
      "body: kısa paragraflar; alıcı kime yardım ettiğini, nasıl çalıştığını ve neden " +
      "tercih edilmesi gerektiğini anlasın. Rakamlar ve somut örneklerle güven oluştur.",
  },
  freelancer: {
    id: "freelancer",
    label: "Freelancer.com",
    guidance:
      "Freelancer.com profili için yaz. Müşteri-odaklı, sonuç vaat eden, teklife-dönük bir ton " +
      "(platform bid/proje tabanlı). headline: hizmeti net tanımlayan kısa bir uzmanlık başlığı " +
      "(ör. 'Full-Stack Web Developer — React & Node'). body: müşterinin işini nasıl çözdüğünü, " +
      "teslim güvenilirliğini ve somut sonuçları vurgulayan taranabilir bir özet; anahtar kelimeleri " +
      "(beceri/teknoloji) doğal kullan — profil aramada bunlarla bulunur.",
  },
  contra: {
    id: "contra",
    label: "Contra",
    guidance:
      "Contra bağımsız (independent) profili için yaz. Portfolyo-öncelikli, kişisel-marka odaklı, " +
      "sıcak ama profesyonel bir ton (platform komisyonsuz — kimlik ve iş kalitesi öne çıkar). " +
      "headline: kim olduğunu + kime hangi sonucu getirdiğini net söyleyen bir kimlik başlığı. " +
      "body: 2-3 kısa paragraf; uzmanlık alanı, çalışma tarzı ve fark yaratan tarafın. " +
      "İşini kanıtlayan somut proje/sonuç dilini kullan; jenerik övgüden kaçın.",
  },
  peopleperhour: {
    id: "peopleperhour",
    label: "PeoplePerHour",
    guidance:
      "PeoplePerHour profili için yaz. Müşteri-odaklı, teklife-dönük, güven verici bir ton " +
      "(UK ağırlıklı; bid + sabit-fiyat 'Hourlies'). headline: net hizmet + uzmanlık başlığı. " +
      "body: müşterinin problemini nasıl çözdüğünü, sürecini ve teslim güvenilirliğini anlatan " +
      "kısa, taranabilir bir özet; ilgili beceri anahtar kelimelerini doğal serpiştir.",
  },
  "99designs": {
    id: "99designs",
    label: "99designs",
    guidance:
      "99designs tasarımcı profili için yaz. Yaratıcı ama profesyonel, portfolyo-güdümlü bir ton " +
      "(tasarım yarışması + doğrudan işe alım). headline: tasarım uzmanlık alanını net belirt " +
      "(ör. 'Logo & Brand Identity Designer'). body: hangi tasarım problemlerini çözdüğün, stil/" +
      "yaklaşımın ve müşteriye kattığın değer; işini konuşturan somut dil kullan, çıktı odaklı ol.",
  },
  guru: {
    id: "guru",
    label: "Guru",
    guidance:
      "Guru.com profili için yaz. Profesyonel, güven verici, teklife-dönük bir ton (bid/quote tabanlı, " +
      "çok kategorili). headline: net hizmet + uzmanlık başlığı. body: uzmanlığını, çalışma sürecini " +
      "ve somut sonuçlarını vurgulayan taranabilir bir özet; ilgili beceri anahtar kelimelerini doğal kullan.",
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

// Platformun MÜŞTERİYE GİDEN metin dili (teklif içeriği bu dilde üretilir —
// UI locale'inden bağımsız; global platformlarda teklif İngilizce olmalı).
export const PLATFORM_LANGUAGE: Record<PlatformId, "en"> = {
  linkedin: "en",
  upwork: "en",
  fiverr: "en",
  freelancer: "en",
  contra: "en",
  peopleperhour: "en",
  "99designs": "en",
  guru: "en",
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
  freelancer: "Freelancer.com iş teklifi (bid) olarak yaz. İlk 2 cümlede ilanın özünü anladığını " +
    "göster ve müşterinin sonucuna odaklan. Maksimum 200 kelime. İlgili deneyimi somut sonuçlarla " +
    "destekle, teslim süresi/yaklaşım konusunda net ol, eylem çağrısıyla bitir.",
  contra: "Contra proje teklifi / tanışma mesajı olarak yaz. Sıcak ama profesyonel; portfolyo-odaklı. " +
    "İlk cümlede müşterinin ihtiyacını anladığını göster, ilgili işini kanıt olarak bağla, net bir " +
    "sonraki adım öner. 180 kelimeyi geçme.",
  peopleperhour: "PeoplePerHour teklifi (proposal) olarak yaz. İlk 2 cümlede müşterinin problemini " +
    "hedefle. Maksimum 200 kelime. Müşteri odaklı; becerini onun sorununu çözme kapasitesi üzerinden " +
    "anlat, teslim güvenilirliğini vurgula, net eylem çağrısıyla bitir.",
  "99designs": "99designs brief yanıtı / tasarımcı teklifi olarak yaz. Müşterinin tasarım hedefini " +
    "anladığını göster, yaklaşımını (stil/süreç) kısaca açıkla ve ilgili işinden bir örneğe atıf yap. " +
    "Yaratıcı ama net; 180 kelimeyi geçme.",
  guru: "Guru.com teklifi (quote) olarak yaz. İlk 2 cümlede işin kapsamını anladığını göster. " +
    "Maksimum 200 kelime. Uzmanlığını somut sonuçlarla destekle, süreç ve teslim konusunda net ol, " +
    "eylem çağrısıyla bitir.",
};
