// Portfolyo üretim motoru: profil → genel portfolyo içeriği (headline, bio, skills, projects).
// Sunucu-only. adapt.ts ile aynı istemci/model/maliyet desenini kullanır.
import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ADAPTATION_MODEL, getAnthropicClient } from "./anthropic";
import { computeCostUsd } from "./pricing";
import { InternalError } from "@/lib/errors";
import { portfolioContentSchema, type PortfolioContent } from "@/lib/validation/schemas/portfolio";
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
): Promise<GeneratePortfolioResult> {
  const client = getAnthropicClient();

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
  ].join("\n");

  const message = await client.messages.parse({
    model: ADAPTATION_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(portfolioContentSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  if (!message.parsed_output) {
    throw new InternalError("Portfolyo içeriği ayrıştırılamadı.", {
      context: { stopReason: message.stop_reason },
    });
  }

  return {
    content: message.parsed_output,
    model: ADAPTATION_MODEL,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    costUsd: computeCostUsd(ADAPTATION_MODEL, message.usage),
  };
}
