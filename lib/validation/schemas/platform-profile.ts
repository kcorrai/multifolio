import { z } from "zod";
import { platformIdSchema } from "@/lib/ai/platforms";
import type { PortfolioItem } from "./profile";

// POST /api/platform-profiles — bağlı URL'den platform profil verisini çek.
export const platformProfileSyncSchema = z.object({
  platform: platformIdSchema,
});

// PATCH /api/platform-profiles — çekilmiş profil metnini güncelle (çeviri sonrası kalıcı).
// Yalnız metin alanları; avatar/portfolyo/kaynak korunur.
export const platformProfileUpdateSchema = z.object({
  platform: platformIdSchema,
  headline: z.string().trim().max(400).default(""),
  summary: z.string().trim().max(4000).default(""),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
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
