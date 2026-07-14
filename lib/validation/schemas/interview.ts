// Mülakat hazırlık çıktısı şeması. OpenAI structured-output ile üretilir → TÜM
// alanlar zorunlu (.optional()/.nullable() OpenAI'ı 400'ler; boş dizi/metin serbest).
import { z } from "zod";

// STAR hikâyesi (DDI 1974): Situation/Task/Action/Result — Action en ağırlıklı bölüm.
export const starStorySchema = z.object({
  title: z.string(), // hangi proje/deneyimden türedi
  situation: z.string(),
  task: z.string(),
  action: z.string(), // "ben ne yaptım" — en uzun, en somut kısım
  result: z.string(),
});
export type StarStory = z.infer<typeof starStorySchema>;

export const interviewPrepSchema = z.object({
  // "Tell me about yourself" — Present→Past→Future, ~150-200 kelime (~90 sn).
  tellMeAboutYourself: z.string(),
  // Profil/projelerden türetilen STAR hikâye bankası.
  starStories: z.array(starStorySchema),
  // İlana uygun güçlü yanlar (kısa madde).
  strengths: z.array(z.string()),
  // Zayıflık cevabı: ilanın must-have'lerini DIŞLAR + düzeltici eylemle eşlenir.
  weakness: z.object({ text: z.string(), improvement: z.string() }),
  // Adayın soracağı 4-5 soru (rol/ekip/büyüme/süreç dağılımı).
  questionsToAsk: z.array(z.string()),
});
export type InterviewPrep = z.infer<typeof interviewPrepSchema>;

// POST /api/interview/prep girdisi (istemci ilan metnini ve job_id'yi gönderir).
export const interviewPrepCreateSchema = z.object({
  job_id: z.string().uuid(),
  job_description: z.string().trim().min(1).max(20_000),
});
