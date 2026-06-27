import { z } from "zod";

export const JOB_STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobStatusSchema = z.enum(JOB_STATUSES);

export const jobCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  company: z.string().trim().max(100).optional(),
  platform: z.string().trim().max(60).optional(),
  description: z.string().trim().min(10).max(10000),
});

export const jobUpdateSchema = z.object({
  status: jobStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  company: z.string().trim().max(100).optional(),
});

// AI eşleştirme çıktısı — lib/ai/match.ts ve /api/jobs/[id]/match tarafından paylaşılır.
export const jobMatchResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).max(5),
  gaps: z.array(z.string()).max(5),
  summary: z.string().max(400),
});

export type JobCreate = z.infer<typeof jobCreateSchema>;
export type JobUpdate = z.infer<typeof jobUpdateSchema>;
export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;
