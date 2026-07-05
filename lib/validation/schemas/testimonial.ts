import { z } from "zod";

// Public müşteri yorum gönderimi (anonim → owner onayına düşer).
export const testimonialSubmitSchema = z.object({
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/),
  authorName: z.string().trim().min(2).max(80),
  authorRole: z.string().trim().max(80).optional(),
  quote: z.string().trim().min(10).max(600),
  // Honeypot: botlar doldurur, gerçek kullanıcı görmez (dolu → sessizce reddedilir).
  website: z.string().max(0).optional(),
});

export type TestimonialSubmit = z.infer<typeof testimonialSubmitSchema>;

// Owner yorum durumu güncellemesi (onayla/reddet).
export const testimonialStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export interface TestimonialRow {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
