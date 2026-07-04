// /api/adapt istek gövdesi şeması.
import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";
import { profileInputSchema } from "./profile";

// Uyarlamanın hangi kaynaktan üretileceği:
//  - "both"     → çekirdek profil + platformdan çekilmiş profil birlikte (varsayılan; eski davranış)
//  - "platform" → yalnızca platformdan çekilmiş public profil
//  - "core"     → yalnızca çekirdek (kullanıcının girdiği) profil
export const adaptSourceSchema = z.enum(["both", "platform", "core"]);
export type AdaptSource = z.infer<typeof adaptSourceSchema>;

export const adaptRequestSchema = z.object({
  // Hedef platform (linkedin | upwork).
  platform: platformIdSchema,
  // İsteğe bağlı satır-içi profil; verilmezse kullanıcının kayıtlı profili kullanılır.
  profile: profileInputSchema.optional(),
  // Uyarlama kaynağı; verilmezse "both" (eski davranış).
  source: adaptSourceSchema.optional(),
});

export type AdaptRequest = z.infer<typeof adaptRequestSchema>;
