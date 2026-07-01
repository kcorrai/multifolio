import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { portfolioContentSchema, type PortfolioContent } from "@/lib/validation/schemas/portfolio";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

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
    languageDirective(locale),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(portfolioContentSchema, "portfolio"),
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
    content: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
