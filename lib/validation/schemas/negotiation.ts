// Maaş pazarlığı koçluğu şemaları. OpenAI structured-output → tüm alanlar zorunlu.
import { z } from "zod";

export const negotiationSchema = z.object({
  // Teklifin kısa değerlendirmesi (adil mi, hangi sinyaller güçlü/zayıf).
  assessment: z.string(),
  // Pazarlık stratejisi maddeleri (nasıl çerçevele, ne zaman/nasıl konuş).
  strategy: z.array(z.string()),
  // Önerilen karşı-teklif: aralık + sayısal çıpa + gerekçe.
  counterOffer: z.object({
    range: z.string(), // ör. "$78,000–85,000"
    anchor: z.string(), // ilk söylenecek sayı/aralık
    rationale: z.string(),
  }),
  // Görüşmede kullanılacak konuşma noktaları.
  talkingPoints: z.array(z.string()),
  // Hazır karşı-teklif e-postası/mesajı.
  email: z.string(),
});
export type Negotiation = z.infer<typeof negotiationSchema>;

// POST /api/negotiation girdisi.
export const negotiationRequestSchema = z.object({
  job_id: z.string().uuid().optional(),
  // Teklif detayı (zorunlu): teklif edilen ücret + varsa yan haklar/koşullar.
  offer: z.string().trim().min(1).max(4000),
  // Kullanıcının hedefi/beklentisi (opsiyonel).
  target: z.string().trim().max(2000).optional(),
});
