import { z } from "zod";

// Kullanıcı ayarları (user_settings). Şimdilik tek alan: haftalık özet e-postası.
export const settingsUpdateSchema = z.object({
  weeklyDigest: z.boolean(),
});

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
