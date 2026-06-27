// /api/adapt istek gövdesi şeması.
import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";
import { profileInputSchema } from "./profile";

export const adaptRequestSchema = z.object({
  // Hedef platform (linkedin | upwork).
  platform: platformIdSchema,
  // İsteğe bağlı satır-içi profil; verilmezse kullanıcının kayıtlı profili kullanılır.
  profile: profileInputSchema.optional(),
});

export type AdaptRequest = z.infer<typeof adaptRequestSchema>;
