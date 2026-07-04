import { z } from "zod";
import { httpUrl } from "./profile";

// Kayıtsız /analyze isteği: URL veya serbest metin (biri zorunlu).
export const publicAnalyzeRequestSchema = z
  .object({
    url: httpUrl(2000).optional(),
    text: z.string().trim().min(40).max(15000).optional(),
  })
  .refine((d) => !!d.url || !!d.text, { message: "url veya text gerekli" });

export type PublicAnalyzeRequest = z.infer<typeof publicAnalyzeRequestSchema>;

// AI üretim şeması (structured output): toplam skor YOK — sunucu
// lib/analyze/score.ts ile deterministik türetir (rubrik şeffaflık deseni).
const analysisDimensionSchema = z.object({
  score: z.number().int().min(0).max(100),
  reason: z.string().max(300),
});

export const profileAnalysisAiSchema = z.object({
  headline_impact: analysisDimensionSchema,
  summary_quality: analysisDimensionSchema,
  skills_coverage: analysisDimensionSchema,
  trust_signals: analysisDimensionSchema,
  suggestions: z.array(z.string().max(200)).max(5),
  upworkApprovalNotes: z.array(z.string().max(200)).max(3),
});

export type ProfileAnalysisAi = z.infer<typeof profileAnalysisAiSchema>;
