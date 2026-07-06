import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { clampImportText } from "@/lib/import/text";
import { cvContentSchema, type CvContent } from "@/lib/validation/schemas/cv";
import type { ProfileInput, ProfileProject } from "@/lib/validation/schemas/profile";
import type { Locale } from "@/i18n/detect";

// OpenAI structured-output şeması (depolama şemasından AYRI): tüm alanlar ZORUNLU,
// URL/boş için nullable, min/max YOK. Sonuç mapCvContent ile cvContentSchema'ya kırpılır.
// GLOBAL ATS-GÜVENLİ: foto/doğum tarihi/askerlik/medeni hal/TC alanı YOK (istenmez).
const cvGenSchema = z.object({
  fullName: z.string(),
  title: z.string(),
  contact: z.object({
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    linkedin: z.string(),
    website: z.string(),
  }),
  summary: z.string(),
  skills: z.object({
    hard: z.array(z.string()),
    soft: z.array(z.string()),
  }),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      location: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      current: z.boolean(),
      bullets: z.array(z.string()),
    }),
  ),
  education: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      bullets: z.array(z.string()),
      url: z.string().nullable(),
    }),
  ),
  certifications: z.array(
    z.object({ name: z.string(), issuer: z.string(), date: z.string() }),
  ),
  languages: z.array(z.object({ name: z.string(), level: z.string() })),
});

type CvGen = z.infer<typeof cvGenSchema>;

const clamp = (s: string | null | undefined, n: number) => (s ?? "").trim().slice(0, n);
const httpOrEmpty = (s: string | null | undefined, n: number) => {
  const u = (s ?? "").trim();
  return /^https?:\/\//i.test(u) ? u.slice(0, n) : "";
};

// AI ham çıktısını geçerli, kırpılmış CvContent'e çevirir (depolama şeması sınırlarını
// asla ihlal etmez). locale route'tan gelir (AI üretmez).
function mapCvContent(raw: CvGen, locale: Locale): CvContent {
  const draft = {
    fullName: clamp(raw.fullName, 120),
    title: clamp(raw.title, 160),
    contact: {
      email: clamp(raw.contact?.email, 200),
      phone: clamp(raw.contact?.phone, 60),
      location: clamp(raw.contact?.location, 160),
      linkedin: clamp(raw.contact?.linkedin, 300),
      website: clamp(raw.contact?.website, 300),
    },
    summary: clamp(raw.summary, 2000),
    skills: {
      hard: (raw.skills?.hard ?? []).map((s) => clamp(s, 60)).filter(Boolean).slice(0, 40),
      soft: (raw.skills?.soft ?? []).map((s) => clamp(s, 60)).filter(Boolean).slice(0, 20),
    },
    experience: (raw.experience ?? [])
      .slice(0, 20)
      .map((e) => ({
        company: clamp(e.company, 200),
        role: clamp(e.role, 200),
        location: clamp(e.location, 160),
        startDate: clamp(e.startDate, 40),
        endDate: clamp(e.endDate, 40),
        current: !!e.current,
        bullets: (e.bullets ?? []).map((b) => clamp(b, 400)).filter(Boolean).slice(0, 12),
      }))
      .filter((e) => e.role || e.company || e.bullets.length),
    education: (raw.education ?? [])
      .slice(0, 12)
      .map((e) => ({
        school: clamp(e.school, 200),
        degree: clamp(e.degree, 160),
        field: clamp(e.field, 160),
        startDate: clamp(e.startDate, 40),
        endDate: clamp(e.endDate, 40),
      }))
      .filter((e) => e.school || e.degree),
    projects: (raw.projects ?? [])
      .slice(0, 12)
      .map((p) => ({
        name: clamp(p.name, 160),
        description: clamp(p.description, 500),
        bullets: (p.bullets ?? []).map((b) => clamp(b, 400)).filter(Boolean).slice(0, 8),
        url: httpOrEmpty(p.url, 300),
      }))
      .filter((p) => p.name || p.description),
    certifications: (raw.certifications ?? [])
      .slice(0, 20)
      .map((c) => ({ name: clamp(c.name, 200), issuer: clamp(c.issuer, 200), date: clamp(c.date, 40) }))
      .filter((c) => c.name),
    languages: (raw.languages ?? [])
      .slice(0, 12)
      .map((l) => ({ name: clamp(l.name, 80), level: clamp(l.level, 60) }))
      .filter((l) => l.name),
    locale,
  };
  // Depolama şemasıyla son doğrulama (kırpma sonrası geçerli olmalı).
  return cvContentSchema.parse(draft);
}

export interface CvAiResult {
  content: CvContent;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// ATS + doğruluk kuralları — üç fonksiyonun da ortak sistem yönergesi tabanı.
const ATS_RULES =
  "ATS-UYUMLU, dürüst bir özgeçmiş (CV) içeriği üretirsin. Kurallar:\n" +
  "- Deneyim madde işaretleri (bullets) XYZ formülünde: aksiyon fiili + ne yapıldığı/kapsam + " +
  "NİCELENMİŞ sonuç (%/sayı/$/süre). 'responsible for', 'helped', 'assisted' gibi dolgu ifadeler KULLANMA.\n" +
  "- Beceriler hard (teknik) ve soft olarak ayrılır.\n" +
  "- ASLA veri UYDURMA: verilmeyen işveren/tarih/unvan/beceri/rakam ekleme. Bilgi yoksa alanı boş bırak.\n" +
  "- Foto, doğum tarihi, medeni hal, askerlik durumu, TC/kimlik no gibi alanlar İSTENMEZ — üretme.";

const GEN_SYSTEM =
  "Sen bir uzman özgeçmiş (CV) yazarısın. " +
  ATS_RULES +
  "\nKullanıcının çekirdek profili + projelerinden yola çıkarak CV içeriği üretirsin. " +
  "Yapılandırılmış iş geçmişi verilmediyse: projeleri 'projects' bölümüne yaz ve varsa freelance " +
  "çalışmayı tek şemsiye deneyim olarak ('Independent Consultant' / 'Freelance <rol>') 'experience' " +
  "içine koyabilirsin — ama tarih/işveren UYDURMA, yoksa boş bırak.";

/** Çekirdek profil + projelerden CV taslağı üretir. locale çıktı dilini belirler. */
export async function generateCv(
  profile: Pick<ProfileInput, "headline" | "summary" | "skills">,
  projects: ProfileProject[],
  locale: Locale = "en",
): Promise<CvAiResult> {
  const client = getOpenAIClient();

  const projectLines = projects.slice(0, 12).map((p, i) => {
    const parts = [`${i + 1}. ${p.title || "(başlıksız)"}`];
    if (p.role) parts.push(`Rol: ${p.role}`);
    if (p.description) parts.push(p.description.slice(0, 600));
    if (p.skills.length) parts.push(`Beceriler: ${p.skills.join(", ")}`);
    return parts.join(" — ");
  });

  const userContent = [
    "Aşağıdaki profil verisinden ATS-uyumlu bir CV içeriği üret:",
    "",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    projectLines.length ? `\nProjeler:\n${projectLines.join("\n")}` : "\n(Yapılandırılmış proje verisi yok.)",
    "",
    "title: profildeki role dayalı profesyonel unvan.",
    "summary: 3-4 satırlık, anahtar-kelime zengini profesyonel özet.",
    "skills.hard: profildeki teknik beceriler; skills.soft: özetten çıkarılabilen sosyal beceriler.",
    "projects: verilen projeleri XYZ-formatlı madde işaretleriyle yaz.",
    languageDirective(locale),
  ].join("\n");

  const parsed = await runCvCompletion(client, GEN_SYSTEM, userContent);
  return finalize(parsed.raw, parsed.usage, locale);
}

const EXTRACT_SYSTEM =
  "Sen bir özgeçmiş (CV) ayrıştırıcısısın. Sana ham CV metni verilir; içeriğini yapılandırılmış " +
  "alanlara çıkarırsın. " +
  ATS_RULES +
  "\nEK KURALLAR:\n" +
  "- Metindeki bilgiyi KORU/normalize et; YENİ bilgi ekleme.\n" +
  "- Türkçe ay adlarını ve 'Halen'/'Devam ediyor' ifadelerini normalize et (current=true).\n" +
  "- Foto/doğum tarihi/medeni hal/askerlik/TC no gibi ATS-dışı & hassas alanları metinde görsen bile ÇIKARMA (dışla).\n" +
  "- ÖNEMLİ: Çıktıyı KAYNAK METNİN DİLİNDE üret — çevirme.";

/** Ham CV metnini (PDF/DOCX'ten) yapılandırılmış CvContent'e çıkarır. Kaynak dilini korur. */
export async function extractCvFromText(text: string, locale: Locale = "en"): Promise<CvAiResult> {
  const client = getOpenAIClient();
  const userContent = ["Ham CV metni:", clampImportText(text)].join("\n");
  const parsed = await runCvCompletion(client, EXTRACT_SYSTEM, userContent);
  // locale: depolamada bölüm başlığı dili için; kaynak dil bilinmediğinden UI locale kullanılır.
  return finalize(parsed.raw, parsed.usage, locale);
}

export interface TailorJobContext {
  title: string;
  description: string;
  requirements?: string[];
  skills?: string[];
}

const TAILOR_SYSTEM =
  "Sen bir özgeçmiş (CV) optimizasyon uzmanısın. Sana MEVCUT bir CV ve bir iş ilanı verilir. " +
  "CV'yi ilana göre optimize edersin: ilanın anahtar kelimelerini/becerilerini, KULLANICININ ZATEN " +
  "SAHİP OLDUĞU deneyim ve becerilerle örtüşen yerlerde öne çıkarır; madde işaretlerini yeniden " +
  "ifade eder/sıralar; özeti ilana göre yeniden yazarsın. " +
  ATS_RULES +
  "\nMUTLAK KURAL: CV'de OLMAYAN beceri/deneyim/işveren/unvan EKLEME. Yalnız mevcut içeriği yeniden " +
  "sırala, vurgula ve yeniden ifade et. Kullanıcının sahip olmadığı bir yeteneği ima etme.";

/** Mevcut CV'yi bir ilana göre uyarlar (yeni bilgi eklemeden yeniden ifade/sırala). */
export async function tailorCv(
  content: CvContent,
  job: TailorJobContext,
  locale: Locale = "en",
): Promise<CvAiResult> {
  const client = getOpenAIClient();
  const userContent = [
    "MEVCUT CV (JSON):",
    JSON.stringify(content),
    "",
    "HEDEF İLAN:",
    `Başlık: ${job.title}`,
    job.requirements && job.requirements.length ? `Gereksinimler: ${job.requirements.join(" | ")}` : "",
    job.skills && job.skills.length ? `İstenen beceriler: ${job.skills.join(", ")}` : "",
    clampImportText(job.description).slice(0, 4000),
    "",
    "CV'yi bu ilana göre optimize et (yalnız mevcut bilgiden).",
    languageDirective(locale),
  ]
    .filter(Boolean)
    .join("\n");

  const parsed = await runCvCompletion(client, TAILOR_SYSTEM, userContent, 2000);
  return finalize(parsed.raw, parsed.usage, locale);
}

/* ── Ortak yardımcılar ──────────────────────────────────────────────── */

async function runCvCompletion(
  client: ReturnType<typeof getOpenAIClient>,
  system: string,
  userContent: string,
  maxTokens = 2500,
) {
  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(cvGenSchema, "cv"),
  });
  const raw = completion.choices[0].message.parsed;
  if (!raw) {
    throw new InternalError("CV içeriği ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }
  return {
    raw,
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens ?? 0,
      completion_tokens: completion.usage?.completion_tokens ?? 0,
    },
  };
}

function finalize(raw: CvGen, usage: { prompt_tokens: number; completion_tokens: number }, locale: Locale): CvAiResult {
  return {
    content: mapCvContent(raw, locale),
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
