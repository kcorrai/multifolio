import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { clampImportText } from "@/lib/import/text";
import { cvContentSchema, type CvContent, type CvTheme } from "@/lib/validation/schemas/cv";
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

const DEFAULT_THEME: CvTheme = { template: "sidebar", accent: "blue" };

// AI ham çıktısını geçerli, kırpılmış CvContent'e çevirir (depolama şeması sınırlarını
// asla ihlal etmez). locale + theme route'tan gelir (AI üretmez; yeniden üretimde korunur).
function mapCvContent(raw: CvGen, locale: Locale, theme: CvTheme): CvContent {
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
    theme,
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
  theme: CvTheme = DEFAULT_THEME,
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
  return finalize(parsed.raw, parsed.usage, locale, theme);
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
export async function extractCvFromText(
  text: string,
  locale: Locale = "en",
  theme: CvTheme = DEFAULT_THEME,
): Promise<CvAiResult> {
  const client = getOpenAIClient();
  const userContent = ["Ham CV metni:", clampImportText(text)].join("\n");
  const parsed = await runCvCompletion(client, EXTRACT_SYSTEM, userContent);
  // locale: depolamada bölüm başlığı dili için; kaynak dil bilinmediğinden UI locale kullanılır.
  return finalize(parsed.raw, parsed.usage, locale, theme);
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
  // Uyarlamada kullanıcının seçtiği tema KORUNUR.
  return finalize(parsed.raw, parsed.usage, locale, content.theme);
}

/* ── Madde güçlendirme (batch, rol başına) ──────────────────────────── */

const bulletsGenSchema = z.object({ bullets: z.array(z.string()) });

const ENHANCE_SYSTEM =
  "Sen bir uzman özgeçmiş (CV) yazarısın. Sana bir iş deneyimi/proje için madde " +
  "işaretleri (bullets) verilir; her birini daha güçlü, ATS-uyumlu hale getirirsin. " +
  ATS_RULES +
  "\nEK KURALLAR:\n" +
  "- Girdideki her madde için TAM OLARAK bir çıktı maddesi döndür, AYNI SIRADA. Madde ekleme/çıkarma/birleştirme.\n" +
  "- Mevcut rakamları KORU; OLMAYAN rakam/metrik/yüzde UYDURMA. Nicel veri yoksa fiili ve kapsamı güçlendir, sahte sayı ekleme.\n" +
  "- Her maddeyi güçlü bir aksiyon fiiliyle başlat; dolgu ifadeleri (responsible for/helped/assisted) at.\n" +
  "- Çıktı, girdi maddesinin DİLİNDE olsun (çevirme).";

export interface CvTextMeta {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/** Bir deneyim/proje girdisindeki tüm madde işaretlerini tek çağrıda güçlendirir. */
export async function enhanceBullets(
  bullets: string[],
  ctx: { role: string; company: string },
): Promise<{ bullets: string[] } & CvTextMeta> {
  const clean = bullets.map((b) => b.trim()).filter(Boolean);
  if (clean.length === 0) throw new InternalError("Güçlendirilecek madde yok.");

  const userContent = [
    ctx.role || ctx.company ? `Bağlam: ${[ctx.role, ctx.company].filter(Boolean).join(" @ ")}` : "",
    "Madde işaretleri (aynı sırada, aynı sayıda geri döndür):",
    ...clean.map((b, i) => `${i + 1}. ${b}`),
  ]
    .filter(Boolean)
    .join("\n");

  const { parsed, usage } = await runStructured(ENHANCE_SYSTEM, userContent, bulletsGenSchema, "bullets", 1200);
  // Yapıyı koru: orijinal sayıda kal, boş dönen maddede orijinali tut (veri kaybı yok).
  const out = clean.map((orig, i) => clamp(parsed.bullets[i] ?? "", 400) || orig);
  return {
    bullets: out,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}

/* ── Özet üretimi (2 varyant) ───────────────────────────────────────── */

const summaryGenSchema = z.object({ summaries: z.array(z.string()) });

const SUMMARY_SYSTEM =
  "Sen bir uzman özgeçmiş (CV) yazarısın. Sana bir CV'nin yapılandırılmış içeriği verilir; " +
  "2 farklı profesyonel ÖZET (summary) varyantı üretirsin. " +
  ATS_RULES +
  "\nHer varyant 2-3 cümle (≈50-90 kelime): deneyim alanı/yılı + en güçlü teknik beceriler + " +
  "varsa bir öne çıkan (nicel) başarı; ilgili anahtar kelimelerle.\n" +
  "- Birinci tekil şahıs zamiri (I/my/ben) KULLANMA; fiil-öncüllü yaz.\n" +
  "- CV'de OLMAYAN bilgi/rakam UYDURMA.";

/** Mevcut CV içeriğinden 2 özet varyantı üretir (kullanıcı birini seçer). */
export async function generateSummary(
  content: CvContent,
  locale: Locale = "en",
): Promise<{ summaries: string[] } & CvTextMeta> {
  const brief = {
    title: content.title,
    skills: content.skills.hard.slice(0, 15),
    experience: content.experience.slice(0, 6).map((e) => ({
      role: e.role, company: e.company, bullets: e.bullets.slice(0, 3),
    })),
    projects: content.projects.slice(0, 4).map((p) => ({ name: p.name, description: p.description })),
  };
  const userContent = [
    "CV içeriği (özet üret):",
    JSON.stringify(brief),
    "",
    "2 özet varyantı döndür.",
    languageDirective(locale),
  ].join("\n");

  const { parsed, usage } = await runStructured(SUMMARY_SYSTEM, userContent, summaryGenSchema, "summaries", 900);
  const summaries = parsed.summaries.map((s) => clamp(s, 800)).filter(Boolean).slice(0, 3);
  if (summaries.length === 0) throw new InternalError("Özet üretilemedi.");
  return {
    summaries,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}

/* ── Ortak yardımcılar ──────────────────────────────────────────────── */

// Genel yapılandırılmış tamamlama (cvGenSchema dışındaki küçük şemalar için).
async function runStructured<T extends z.ZodType>(
  system: string,
  userContent: string,
  schema: T,
  name: string,
  maxTokens: number,
): Promise<{ parsed: z.infer<T>; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    temperature: 0.4,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(schema, name),
  });
  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("AI çıktısı ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }
  return {
    parsed,
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens ?? 0,
      completion_tokens: completion.usage?.completion_tokens ?? 0,
    },
  };
}


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

function finalize(
  raw: CvGen,
  usage: { prompt_tokens: number; completion_tokens: number },
  locale: Locale,
  theme: CvTheme,
): CvAiResult {
  return {
    content: mapCvContent(raw, locale, theme),
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
