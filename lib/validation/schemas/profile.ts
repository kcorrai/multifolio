// Profil girdisi için örnek Zod şeması. Faz 1'de uyarlama motoruna beslenecek
// "tek profil" verisinin çekirdeği. Tüm alanlar sunucuda doğrulanır.
import { z } from "zod";

export const profileInputSchema = z.object({
  // Görünen başlık, ör. "Senior Frontend Developer".
  headline: z.string().trim().min(2).max(120),
  // Kısa özet / bio.
  summary: z.string().trim().min(10).max(2000),
  // Beceri etiketleri.
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
