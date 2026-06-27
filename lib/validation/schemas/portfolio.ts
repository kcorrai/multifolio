import { z } from "zod";

export const portfolioProjectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "Yalnızca http/https bağlantılar geçerlidir.")
    .optional(),
});

// AI'nın ürettiği ve kullanıcının düzenleyebildiği portfolyo içeriği.
export const portfolioContentSchema = z.object({
  headline: z.string().min(1).max(220),
  bio: z.string().min(1).max(2000),
  skills: z.array(z.string().min(1).max(60)).min(1).max(30),
  projects: z.array(portfolioProjectSchema).max(12).default([]),
});

export type PortfolioContent = z.infer<typeof portfolioContentSchema>;

// PUT /api/portfolio — kısmi güncelleme (tüm alanlar isteğe bağlı).
export const portfolioUpdateSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Yalnızca küçük harf, rakam ve tire.")
    .optional(),
  published: z.boolean().optional(),
  content: portfolioContentSchema.optional(),
});

export type PortfolioUpdate = z.infer<typeof portfolioUpdateSchema>;
