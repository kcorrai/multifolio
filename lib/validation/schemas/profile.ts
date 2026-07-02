// Profil girdisi için örnek Zod şeması. Faz 1'de uyarlama motoruna beslenecek
// "tek profil" verisinin çekirdeği. Tüm alanlar sunucuda doğrulanır.
import { z } from "zod";

// Platform içe aktarmasından gelen tek portfolyo öğesi (görsel + başlık/açıklama).
export const portfolioItemSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(1000).default(""),
  imageUrl: z.string().trim().max(1000).nullable(),
  category: z.string().trim().max(120).nullable().default(null),
});
export type PortfolioItem = z.infer<typeof portfolioItemSchema>;

export const profileInputSchema = z.object({
  // Görünen başlık, ör. "Senior Frontend Developer".
  headline: z.string().trim().min(2).max(120),
  // Kısa özet / bio.
  summary: z.string().trim().min(10).max(2000),
  // Beceri etiketleri.
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
  // Profil fotoğrafı + portfolyo (opsiyonel — yoksa mevcut değerler korunur).
  avatar_url: z.string().trim().url().max(1000).nullable().optional(),
  portfolio: z.array(portfolioItemSchema).max(50).optional(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
