import { z } from "zod";
import type { JobMatchResult } from "./job";

// Kayıtlı feed oluşturma/güncelleme
export const feedCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  keywords: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  excludeKeywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  minBudget: z.number().int().min(0).max(1_000_000).optional(),
  platform: z.string().trim().max(60).optional(),
  excludeCountries: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  minHourlyRate: z.number().min(0).max(10_000).optional(),
  minFixedPrice: z.number().min(0).max(1_000_000).optional(),
  minClientSpent: z.number().min(0).max(100_000_000).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  notify: z.boolean().default(false),
  proposalPrompt: z.string().trim().max(2000).optional(),
});

// Güncellemede alanlar null gönderilerek TEMİZLENEBİLİR (undefined = dokunma).
export const feedUpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  excludeKeywords: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  minBudget: z.number().int().min(0).max(1_000_000).nullable().optional(),
  platform: z.string().trim().max(60).nullable().optional(),
  excludeCountries: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  minHourlyRate: z.number().min(0).max(10_000).nullable().optional(),
  minFixedPrice: z.number().min(0).max(1_000_000).nullable().optional(),
  minClientSpent: z.number().min(0).max(100_000_000).nullable().optional(),
  minScore: z.number().int().min(0).max(100).nullable().optional(),
  notify: z.boolean().optional(),
  proposalPrompt: z.string().trim().max(2000).nullable().optional(),
});

// Query: liste sayfalama
export const feedListQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

// Query: anlık arama
export const feedSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(60).optional(),
  minBudget: z.coerce.number().int().min(0).max(1_000_000).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

// Yıldız aç/kapa
export const starToggleSchema = z.object({
  jobPoolId: z.string().uuid(),
});

export type FeedCreate = z.infer<typeof feedCreateSchema>;
export type FeedUpdate = z.infer<typeof feedUpdateSchema>;

// job_pool satırı (DB şekli). lang null = başlık çevirisi henüz yapılmadı (cron bekliyor).
export interface PoolJobRow {
  id: string;
  source: string;
  external_id: string;
  title: string;
  description: string;
  url: string | null;
  budget: string | null;
  skills: string[];
  client_country: string | null;
  client_spent: number | null;
  posted_at: string | null;
  created_at: string;
  lang: string | null;
  title_en: string | null;
  title_tr: string | null;
}

// job_feeds satırı
export interface JobFeedRow {
  id: string;
  name: string;
  keywords: string[];
  exclude_keywords: string[];
  min_budget: number | null;
  platform: string | null;
  exclude_countries: string[];
  min_hourly_rate: number | null;
  min_fixed_price: number | null;
  min_client_spent: number | null;
  min_score: number | null;
  notify: boolean;
  proposal_prompt: string | null;
  created_at: string;
}

// İstemciye dönen zenginleştirilmiş pool ilanı
export interface PoolJob extends PoolJobRow {
  isStarred: boolean;
  score: number | null;
  scoreResult: JobMatchResult | null;
}
