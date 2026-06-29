import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";

export const platformConnectionUpsertSchema = z.object({
  platform:    platformIdSchema,
  profile_url: z.string().url("Geçerli bir URL girin.").max(500),
});

export type PlatformConnectionUpsert = z.infer<typeof platformConnectionUpsertSchema>;

export interface PlatformConnection {
  id:          string;
  user_id:     string;
  platform:    string;
  profile_url: string;
  created_at:  string;
  updated_at:  string;
}
