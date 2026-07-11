import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { type PortfolioContent, type PortfolioMedia } from "@/lib/validation/schemas/portfolio";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

// OpenAI structured-output ŞEMASI (depolama şemasından AYRI): OpenAI, tüm
// alanların zorunlu olmasını ister ve `.optional()`'ı `.nullable()` olmadan
// reddeder; ayrıca min/max/refine/default'u yok sayar. Bu yüzden burada sade,
// nullable-url'li bir şema kullanılır; sonuç depolama şemasına (PortfolioContent)
// eşlenip kırpılır (aşağıda mapToContent).
const portfolioGenSchema = z.object({
  headline: z.string(),
  bio: z.string(),
  skills: z.array(z.string()),
  projects: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      // OpenAI tüm alanları ZORUNLU ister → boş string (uygulanamazsa). Depolamada opsiyonel.
      problem: z.string(),
      solution: z.string(),
      result: z.string(),
      url: z.string().nullable(),
    }),
  ),
});

const clamp = (s: string, n: number) => s.trim().slice(0, n);

// AI ham çıktısını geçerli, kırpılmış PortfolioContent'e çevirir (depolama
// şeması min/max sınırlarını asla ihlal etmez; boş alanlar profilden dolar).
// media (avatar+galeri) AI'dan DEĞİL, profilden anlık kopyalanır (route sağlar);
// theme varsayılan (studio/blue) — kullanıcı panelden değiştirir/route korur.
function mapToContent(
  raw: z.infer<typeof portfolioGenSchema>,
  profile: ProfileInput,
  media: PortfolioMedia,
): PortfolioContent {
  const skills = raw.skills.map((s) => clamp(s, 60)).filter(Boolean).slice(0, 30);
  return {
    headline: clamp(raw.headline, 220) || clamp(profile.headline, 220),
    bio: clamp(raw.bio, 2000) || clamp(profile.summary, 2000),
    skills: skills.length ? skills : profile.skills.slice(0, 30),
    projects: raw.projects
      .filter((p) => p.title?.trim() && p.description?.trim())
      .slice(0, 12)
      .map((p) => {
        const u = p.url?.trim();
        const url = u && /^https?:\/\//i.test(u) ? u : undefined;
        const problem = clamp(p.problem ?? "", 400);
        const solution = clamp(p.solution ?? "", 400);
        const result = clamp(p.result ?? "", 400);
        return {
          title: clamp(p.title, 120),
          description: clamp(p.description, 500),
          ...(problem ? { problem } : {}),
          ...(solution ? { solution } : {}),
          ...(result ? { result } : {}),
          ...(url ? { url } : {}),
        };
      }),
    layout: "gallery",
    theme: { preset: "studio", accent: "blue" },
    media,
  };
}

export interface GeneratePortfolioResult {
  content: PortfolioContent;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT =
  "Sen freelancer'lar için etkileyici, kişisel portfolyo web siteleri yazan bir metin " +
  "uzmanısın. Kullanıcının çekirdek profilinden; ziyaretçiyi ikna eden, profesyonel ama " +
  "samimi bir portfolyo içeriği üretirsin. Gerçeği abartma; yalnızca verilen bilgiden yaz.";

export async function generatePortfolio(
  profile: ProfileInput,
  locale: Locale = "en",
  media: PortfolioMedia = { avatarUrl: null, gallery: [], projectGroups: [] },
): Promise<GeneratePortfolioResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Aşağıdaki profil verisinden portfolyo içeriği üret:",
    "",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "Kurallar:",
    "- headline: kısa, özgün, dikkat çeken (max 120 karakter).",
    "- bio: ilgi çekici biyografi (2-3 paragraf, max 1500 karakter).",
    "- skills: profildeki becerileri koruyarak öncelik sırasına diz.",
    "- projects: profil verisinde somut bir proje/başarı varsa çıkar; yoksa boş bırak.",
    "- her proje için mümkünse problem (çözülen sorun), solution (senin yaklaşımın) ve " +
      "result (sonuç/etki) alanlarını doldur. result için: kaynak profilde SOMUT bir sonuç/rakam " +
      "varsa birebir aktar; rakam yoksa niteliksel anlat (ör. 'teslimat süresini belirgin kısalttı'). " +
      "RAKAM UYDURMA — bu içerik public bir sayfada yayınlanır. Bilgi yoksa alanı boş string bırak.",
    languageDirective(locale),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    max_tokens: 1600,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(portfolioGenSchema, "portfolio"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Portfolyo içeriği ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    content: mapToContent(parsed, profile, media),
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
