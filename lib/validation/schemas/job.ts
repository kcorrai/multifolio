import { z } from "zod";

export const JOB_STATUSES = ["saved", "applied", "awaiting_reply", "interview", "offer", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobStatusSchema = z.enum(JOB_STATUSES);

export const jobCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(60).optional(),
  description: z.string().trim().min(10).max(10000),
  url: z.string().url().max(2000).optional(),
  budget: z.string().trim().max(100).optional(),
  source_pool_id: z.string().uuid().optional(),
});

export const jobUpdateSchema = z.object({
  status: jobStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
});

// Rubrik: sabit 4 boyut — ilanlar arası karşılaştırılabilirlik için anahtar seti kilitli.
// Ağırlıklar ve skor/karar türetimi lib/ai/rubric.ts'te (saf, test edilebilir).
export const RUBRIC_KEYS = ["skill_fit", "experience_fit", "budget_fit", "listing_quality"] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

const rubricDimensionSchema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().max(200),
});

export const jobMatchRubricSchema = z.object({
  skill_fit: rubricDimensionSchema,
  experience_fit: rubricDimensionSchema,
  budget_fit: rubricDimensionSchema,
  listing_quality: rubricDimensionSchema,
});

export const MATCH_VERDICTS = ["go", "maybe", "skip"] as const;
export type MatchVerdict = (typeof MATCH_VERDICTS)[number];

// AI üretim şeması (structured output): toplam skor ve verdict YOK — sunucu
// rubrikten deterministik türetir (şeffaflık: skor = ağırlıklı rubrik toplamı).
export const jobMatchAiSchema = z.object({
  rubric: jobMatchRubricSchema,
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  requirements: z.array(z.string()).max(7),
  summary: z.string().max(400),
});

// Kayıtlı eşleştirme sonucu — lib/ai/match.ts ve /api/jobs/[id]/match tarafından paylaşılır.
// rubric/verdict optional: rubrik öncesi cache'lenmiş job_scores/match_result satırları bunlarsız.
export const jobMatchResultSchema = jobMatchAiSchema.extend({
  score: z.number().int().min(0).max(100),
  rubric: jobMatchRubricSchema.optional(),
  verdict: z.enum(MATCH_VERDICTS).optional(),
});

export type JobCreate = z.infer<typeof jobCreateSchema>;
export type JobUpdate = z.infer<typeof jobUpdateSchema>;
export type JobMatchRubric = z.infer<typeof jobMatchRubricSchema>;
export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;
