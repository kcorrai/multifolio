import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";
import type { PortfolioItem } from "./profile";

// POST /api/platform-profiles — bağlı URL'den platform profil verisini çek.
export const platformProfileSyncSchema = z.object({
  platform: platformIdSchema,
});

// platform_profiles satırı (istemciye dönen şekil).
export interface PlatformProfileRow {
  platform: string;
  headline: string;
  summary: string;
  skills: string[];
  avatar_url: string | null;
  portfolio: PortfolioItem[];
  source_url: string | null;
  fetched_at: string;
}
