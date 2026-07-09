// Profil girdisi için örnek Zod şeması. Faz 1'de uyarlama motoruna beslenecek
// "tek profil" verisinin çekirdeği. Tüm alanlar sunucuda doğrulanır.
import { z } from "zod";

// Yalnız http(s) URL kabul eden yardımcı (javascript:/data: gibi şemaları eler —
// bu URL'ler <img src>/avatar olarak render edildiğinden şema kısıtı savunma katmanı).
export const httpUrl = (max: number) =>
  z.string().trim().max(max).refine((u) => /^https?:\/\//i.test(u), "Yalnız http(s) URL.");

// Platform içe aktarmasından gelen tek portfolyo öğesi (görsel + başlık/açıklama).
// `platform`: öğenin kaynak platformu — içe aktarma save'inde platform bazlı merge için
// (aynı platform değişir, diğerleri korunur). null = manuel/bilinmeyen kaynak.
export const portfolioItemSchema = z.object({
  title: z.string().trim().max(200),
  description: z.string().trim().max(1000).default(""),
  imageUrl: httpUrl(1000).nullable(),
  category: z.string().trim().max(120).nullable().default(null),
  platform: z.string().trim().max(40).nullable().optional(),
});
export type PortfolioItem = z.infer<typeof portfolioItemSchema>;

// Yapılandırılmış proje (her biri ayrı): başlık + açıklama + rol + beceriler + görseller
// (her görselin kendi altyazısı). Upwork uzantısı window.__NUXT__'tan çeker.
export const projectImageSchema = z.object({
  url: httpUrl(1000),
  caption: z.string().trim().max(400).default(""),
});
export const profileProjectSchema = z.object({
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(4000).default(""),
  role: z.string().trim().max(200).default(""),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  images: z.array(projectImageSchema).max(20).default([]),
  // Kaynak platform — içe aktarma save'inde platform bazlı merge için (bkz portfolioItemSchema).
  platform: z.string().trim().max(40).nullable().optional(),
});
export type ProfileProject = z.infer<typeof profileProjectSchema>;

export const profileInputSchema = z.object({
  // Görünen başlık, ör. "Senior Frontend Developer".
  headline: z.string().trim().min(2).max(120),
  // Kısa özet / bio.
  summary: z.string().trim().min(10).max(2000),
  // Beceri etiketleri. Boş olabilir: bazı içe aktarma kaynakları (ör. LinkedIn public
  // ld+json) beceri vermez — kullanıcıyı save'de beceri girmeye zorlamayız (sonra ekler).
  skills: z.array(z.string().trim().min(1).max(40)).max(50),
  // Profil fotoğrafı + portfolyo (opsiyonel — yoksa mevcut değerler korunur).
  avatar_url: httpUrl(1000).nullable().optional(),
  portfolio: z.array(portfolioItemSchema).max(50).optional(),
  // Yapılandırılmış projeler (opsiyonel — gönderildiyse yazılır, yoksa korunur).
  projects: z.array(profileProjectSchema).max(30).optional(),
  // İçe aktarma save'i bunu gönderir → sunucu portfolio/projects'i PLATFORM BAZLI merge
  // eder (bu platformun öğeleri değişir, diğer platformlarınki korunur). Düz profil
  // düzenlemesi (ProfileTab) GÖNDERMEZ → tam-durum replace (mevcut davranış). null = manuel.
  sourcePlatform: z.string().trim().max(40).nullable().optional(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
