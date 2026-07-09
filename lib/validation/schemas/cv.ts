// CV / özgeçmiş içeriği şemaları. İki katman (portfolio.ts deseni):
//  - Depolama şeması (cvContentSchema): KATI, min/max sınırlı; `.default()`'lı alanlar
//    eski/eksik kayıtların geçerli kalmasını sağlar (DB'den safeParse ile okunur).
//  - AI şeması (cvGenSchema): GEVŞEK; OpenAI structured-output tüm alanları ZORUNLU ister,
//    `.optional()`'ı nullable olmadan reddeder ve min/max/refine/default'u yok sayar.
//    Sonuç mapCvContent (lib/ai/cv.ts) ile depolama şemasına kırpılır.
//
// GLOBAL ATS-GÜVENLİ: foto/doğum tarihi/medeni hal/askerlik/TC No alanı BİLEREK YOKTUR
// (ABD/UK/AB ayrımcılık riski + ATS uyumu). Yüklenen TR CV'sinde bu alanlar görülse bile
// çıkarımda dışlanır.
import { z } from "zod";
import { CV_TEMPLATES, CV_ACCENTS } from "@/lib/cv/theme";

/* ── Depolama şeması (katı) ─────────────────────────────────────────── */

// Görsel tema: şablon + vurgu rengi. `.default()` → temasız eski kayıtlar; `.catch()` →
// eski/geçersiz şablon-renk değerleri (ör. kaldırılmış "modern") default'a düşer, kayıt kaybolmaz.
export const cvThemeSchema = z
  .object({
    template: z.enum(CV_TEMPLATES).catch("sidebar").default("sidebar"),
    accent: z.enum(CV_ACCENTS).catch("blue").default("blue"),
  })
  .catch({ template: "sidebar", accent: "blue" })
  .default({ template: "sidebar", accent: "blue" });
export type CvTheme = z.infer<typeof cvThemeSchema>;

export const cvContactSchema = z
  .object({
    email: z.string().trim().max(200).default(""),
    phone: z.string().trim().max(60).default(""),
    location: z.string().trim().max(160).default(""),
    linkedin: z.string().trim().max(300).default(""),
    website: z.string().trim().max(300).default(""),
  })
  .default({ email: "", phone: "", location: "", linkedin: "", website: "" });

export const cvExperienceSchema = z.object({
  company: z.string().trim().max(200).default(""),
  role: z.string().trim().max(200).default(""),
  location: z.string().trim().max(160).default(""),
  // Serbest metin tarih (ör. "Jan 2024") — tutarlılık ATS skorunda kontrol edilir.
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim().max(400)).max(12).default([]),
});

export const cvEducationSchema = z.object({
  school: z.string().trim().max(200).default(""),
  degree: z.string().trim().max(160).default(""),
  field: z.string().trim().max(160).default(""),
  startDate: z.string().trim().max(40).default(""),
  endDate: z.string().trim().max(40).default(""),
});

export const cvProjectSchema = z.object({
  name: z.string().trim().max(160).default(""),
  description: z.string().trim().max(500).default(""),
  bullets: z.array(z.string().trim().max(400)).max(8).default([]),
  url: z.string().trim().max(300).default(""),
});

export const cvCertificationSchema = z.object({
  name: z.string().trim().max(200).default(""),
  issuer: z.string().trim().max(200).default(""),
  date: z.string().trim().max(40).default(""),
});

export const cvLanguageSchema = z.object({
  name: z.string().trim().max(80).default(""),
  level: z.string().trim().max(60).default(""),
});

export const cvSkillsSchema = z
  .object({
    hard: z.array(z.string().trim().max(60)).max(40).default([]),
    soft: z.array(z.string().trim().max(60)).max(20).default([]),
  })
  .default({ hard: [], soft: [] });

export const cvContentSchema = z.object({
  fullName: z.string().trim().max(120).default(""),
  title: z.string().trim().max(160).default(""),
  contact: cvContactSchema,
  summary: z.string().trim().max(2000).default(""),
  skills: cvSkillsSchema,
  experience: z.array(cvExperienceSchema).max(20).default([]),
  education: z.array(cvEducationSchema).max(12).default([]),
  projects: z.array(cvProjectSchema).max(12).default([]),
  certifications: z.array(cvCertificationSchema).max(20).default([]),
  languages: z.array(cvLanguageSchema).max(12).default([]),
  // Üretim/çıktı dili (UI locale'i). Render/PDF bölüm başlıklarını buna göre seçer.
  locale: z.enum(["en", "tr"]).default("en"),
  // Görsel şablon + vurgu rengi (AI üretmez; kullanıcı seçer, yeniden üretimde korunur).
  theme: cvThemeSchema,
});

export type CvContact = z.infer<typeof cvContactSchema>;
export type CvExperience = z.infer<typeof cvExperienceSchema>;
export type CvEducation = z.infer<typeof cvEducationSchema>;
export type CvProject = z.infer<typeof cvProjectSchema>;
export type CvCertification = z.infer<typeof cvCertificationSchema>;
export type CvLanguage = z.infer<typeof cvLanguageSchema>;
export type CvSkills = z.infer<typeof cvSkillsSchema>;
export type CvContent = z.infer<typeof cvContentSchema>;

/* ── Güncelleme (PUT) ───────────────────────────────────────────────── */

export const cvUpdateSchema = z.object({
  content: cvContentSchema,
});
export type CvUpdate = z.infer<typeof cvUpdateSchema>;

/* ── Uyarla (tailor) girdisi ────────────────────────────────────────── */
// İki mod: kayıtlı ilan (jobId) VEYA serbest yapıştırılmış ilan metni (jobText).
export const cvTailorSchema = z.union([
  z.object({ jobId: z.string().uuid() }),
  z.object({ jobText: z.string().trim().min(20).max(12000) }),
]);
export type CvTailor = z.infer<typeof cvTailorSchema>;

/* ── Export girdisi (PDF) ───────────────────────────────────────────── */
// İstemci düzenlenmiş içeriği doğrudan yollar (kaydetmeden de indirilebilsin).
export const cvExportSchema = z.object({
  content: cvContentSchema,
});
export type CvExport = z.infer<typeof cvExportSchema>;

/* ── Madde güçlendirme (batch) girdisi ──────────────────────────────── */
// Bir deneyim/proje girdisinin tüm maddeleri tek çağrıda güçlendirilir.
export const cvBulletsSchema = z.object({
  role: z.string().trim().max(200).default(""),
  company: z.string().trim().max(200).default(""),
  bullets: z.array(z.string().trim().max(400)).min(1).max(12),
});
export type CvBullets = z.infer<typeof cvBulletsSchema>;

/* ── Özet üretimi girdisi ───────────────────────────────────────────── */
// İstemci güncel (kaydedilmemiş olabilir) içeriği yollar → özet varyantları üretilir.
export const cvSummarySchema = z.object({
  content: cvContentSchema,
});
export type CvSummaryInput = z.infer<typeof cvSummarySchema>;
