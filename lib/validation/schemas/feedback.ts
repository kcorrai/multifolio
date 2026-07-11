import { z } from "zod";

// Ürün geri bildirimi kategorileri (migration 0035 CHECK ile aynı).
export const FEEDBACK_CATEGORIES = ["bug", "feature", "general"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

// POST /api/feedback — kullanıcı girdisi (sunucuda doğrulanır; istemciye güvenilmez).
export const feedbackCreateSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().trim().min(3).max(2000),
});

export type FeedbackCreate = z.infer<typeof feedbackCreateSchema>;

// GET yanıtındaki tek satır (kullanıcının kendi geçmişi).
export interface FeedbackRow {
  id: string;
  category: FeedbackCategory;
  message: string;
  created_at: string;
}
