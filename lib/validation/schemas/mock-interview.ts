// Sahte mülakat (mock interview) şemaları. OpenAI structured-output → tüm alanlar zorunlu.
import { z } from "zod";

// Zorluk seviyesi (soru derinliğini ayarlar) + kategori (soru türü).
export const mockDifficultySchema = z.enum(["junior", "mid", "senior"]);
export type MockDifficulty = z.infer<typeof mockDifficultySchema>;

export const mockCategorySchema = z.enum(["behavioral", "technical", "role_fit", "motivation"]);
export type MockCategory = z.infer<typeof mockCategorySchema>;

// Üretilen soru: kategori + soru metni + güçlü cevabın neyi içermesi gerektiği ipucu.
export const mockQuestionSchema = z.object({
  category: mockCategorySchema,
  question: z.string(),
  strongAnswerHint: z.string(), // güçlü bir cevabın neyi kapsaması gerektiği
});
export type MockQuestion = z.infer<typeof mockQuestionSchema>;

export const mockQuestionsSchema = z.object({
  questions: z.array(mockQuestionSchema),
});
export type MockQuestions = z.infer<typeof mockQuestionsSchema>;

// Cevap değerlendirmesi: 0-100 puan + güçlü yanlar + gelişim alanları + model cevap +
// opsiyonel derinleştirici takip sorusu. followUp OpenAI için ZORUNLU alan (boş string =
// takip yok; .optional() structured-output'ta reddedilir → hep dolu döner).
export const mockFeedbackSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  modelAnswer: z.string(), // kullanıcının profilinden kurulmuş örnek güçlü cevap
  followUp: z.string(), // cevap zayıf/eksikse sorulacak takip sorusu; güçlüyse ""
});
export type MockFeedback = z.infer<typeof mockFeedbackSchema>;

// POST /api/interview/mock/start girdisi (job_id opsiyonel; yoksa profil-genel pratik).
// difficulty/count/categories: kullanıcının başlangıç ekranındaki kapsam ayarları.
export const mockStartSchema = z.object({
  job_id: z.string().uuid().optional(),
  job_description: z.string().trim().max(20_000).optional(),
  difficulty: mockDifficultySchema.default("mid"),
  count: z.number().int().min(3).max(10).default(6),
  categories: z.array(mockCategorySchema).max(4).optional(), // boş/undefined = tüm kategoriler
});

// POST /api/interview/mock/feedback girdisi (bağlam: job_id ya da doğrudan job_description).
// session_id + question_index verilirse cevap+feedback oturuma KALICI yazılır (birincil cevap).
// Takip sorusu cevapları session_id'siz gönderilir → kalıcı değil (rapor tek skor/soru tutar).
export const mockFeedbackRequestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  answer: z.string().trim().min(1).max(6000),
  job_id: z.string().uuid().optional(),
  job_description: z.string().trim().max(20_000).optional(),
  session_id: z.string().uuid().optional(),
  question_index: z.number().int().min(0).max(50).optional(),
});

// POST /api/interview/mock/complete girdisi.
export const mockCompleteSchema = z.object({
  session_id: z.string().uuid(),
});

// ── Oturum kaydı (DB'deki interview_sessions satırı; client'a döner) ──────────
export const interviewQuestionRecordSchema = z.object({
  category: mockCategorySchema,
  question: z.string(),
  strongAnswerHint: z.string(),
  answer: z.string().nullable(),
  score: z.number().nullable(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  modelAnswer: z.string().nullable(),
});
export type InterviewQuestionRecord = z.infer<typeof interviewQuestionRecordSchema>;

export const interviewSessionSchema = z.object({
  id: z.string(),
  job_id: z.string().nullable(),
  difficulty: mockDifficultySchema,
  categories: z.array(mockCategorySchema),
  question_count: z.number(),
  overall_score: z.number().nullable(),
  status: z.enum(["active", "completed"]),
  questions: z.array(interviewQuestionRecordSchema),
  created_at: z.string(),
  completed_at: z.string().nullable(),
});
export type InterviewSession = z.infer<typeof interviewSessionSchema>;
