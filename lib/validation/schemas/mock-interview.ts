// Sahte mülakat (mock interview) şemaları. OpenAI structured-output → tüm alanlar zorunlu.
import { z } from "zod";

// Üretilen soru: kategori + soru metni + güçlü cevabın neyi içermesi gerektiği ipucu.
export const mockQuestionSchema = z.object({
  category: z.enum(["behavioral", "technical", "role_fit", "motivation"]),
  question: z.string(),
  strongAnswerHint: z.string(), // güçlü bir cevabın neyi kapsaması gerektiği
});
export type MockQuestion = z.infer<typeof mockQuestionSchema>;

export const mockQuestionsSchema = z.object({
  questions: z.array(mockQuestionSchema),
});
export type MockQuestions = z.infer<typeof mockQuestionsSchema>;

// Cevap değerlendirmesi: 0-100 puan + güçlü yanlar + gelişim alanları + model cevap.
export const mockFeedbackSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  modelAnswer: z.string(), // kullanıcının profilinden kurulmuş örnek güçlü cevap
});
export type MockFeedback = z.infer<typeof mockFeedbackSchema>;

// POST /api/interview/mock/start girdisi (job_id opsiyonel; yoksa profil-genel pratik).
export const mockStartSchema = z.object({
  job_id: z.string().uuid().optional(),
  job_description: z.string().trim().max(20_000).optional(),
});

// POST /api/interview/mock/feedback girdisi (bağlam: job_id ya da doğrudan job_description).
export const mockFeedbackRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  answer: z.string().trim().min(1).max(6000),
  job_id: z.string().uuid().optional(),
  job_description: z.string().trim().max(20_000).optional(),
});
