import { z } from "zod";
import { PORTFOLIO_PRESETS, PORTFOLIO_ACCENTS } from "@/lib/portfolio/theme";

export const portfolioProjectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), "Yalnızca http/https bağlantılar geçerlidir.")
    .optional(),
});

// Kullanıcının seçtiği görsel tema (preset + vurgu rengi). Eksikse studio/blue.
export const portfolioThemeSchema = z
  .object({
    preset: z.enum(PORTFOLIO_PRESETS).default("studio"),
    accent: z.enum(PORTFOLIO_ACCENTS).default("blue"),
  })
  .default({ preset: "studio", accent: "blue" });

// Bağlı public profillerden alınan görseller (üretimde anlık kopyalanır → public
// sayfa tek sorguyla okur, sahibinin RLS'li profiline erişmeye gerek kalmaz).
export const portfolioGalleryItemSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(120).default(""),
});
export const portfolioMediaSchema = z
  .object({
    avatarUrl: z.string().url().nullable().default(null),
    gallery: z.array(portfolioGalleryItemSchema).max(24).default([]),
  })
  .default({ avatarUrl: null, gallery: [] });

// AI'nın ürettiği ve kullanıcının düzenleyebildiği portfolyo içeriği.
// theme/media `.default()`'lı → eski (theme'siz) kayıtlar geçerli kalır.
export const portfolioContentSchema = z.object({
  headline: z.string().min(1).max(220),
  bio: z.string().min(1).max(2000),
  skills: z.array(z.string().min(1).max(60)).min(1).max(30),
  projects: z.array(portfolioProjectSchema).max(12).default([]),
  theme: portfolioThemeSchema,
  media: portfolioMediaSchema,
  // İşe-al/iletişim CTA hedefi (opsiyonel; ikisi de yoksa CTA gizli). Editörde serbest
  // yazılır (yarım e-posta tüm kaydı bloklamasın diye biçim burada zorlanmaz); public
  // sayfa RENDER'da yalnız geçerli e-posta / http(s) URL'i href yapar (javascript: vb. engellenir).
  contactEmail: z.string().max(200).nullable().optional(),
  contactUrl: z.string().max(300).nullable().optional(),
});

export type PortfolioTheme = z.infer<typeof portfolioThemeSchema>;
export type PortfolioMedia = z.infer<typeof portfolioMediaSchema>;

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
