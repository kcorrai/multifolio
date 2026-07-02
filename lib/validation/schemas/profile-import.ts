// Profil içe aktarma girdileri. `file` modu multipart geldiğinden bu union'da
// YOKTUR; route'ta content-type'a göre ayrılır ve dosya elle doğrulanır.
import { z } from "zod";

export const IMPORT_TEXT_MAX = 50_000; // ham girdi tavanı (AI'a gitmeden 20k'ya kırpılır)

export const importRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("url"),
    url: z.string().trim().url().max(2000).refine((u) => /^https?:\/\//i.test(u), "Yalnız http(s)"),
  }),
  z.object({
    mode: z.literal("text"),
    text: z.string().trim().min(1).max(IMPORT_TEXT_MAX),
  }),
]);
export type ImportRequest = z.infer<typeof importRequestSchema>;

// AI çıkarım taslağı: kayıt şeması (profileInputSchema) DEĞİL — alt sınırlar yok,
// kullanıcı düzenledikten sonra /api/profile kendi şemasıyla doğrular.
export const profileDraftSchema = z.object({
  headline: z.string().max(120),
  summary: z.string().max(2000),
  skills: z.array(z.string().min(1).max(40)).max(50),
});
export type ProfileDraft = z.infer<typeof profileDraftSchema>;
