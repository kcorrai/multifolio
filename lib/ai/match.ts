// Profil × iş ilanı eşleştirme motoru. adapt.ts ile aynı istemci/model/maliyet desenini kullanır.
import "server-only";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ADAPTATION_MODEL, getAnthropicClient } from "./anthropic";
import { computeCostUsd } from "./pricing";
import { InternalError } from "@/lib/errors";
import { jobMatchResultSchema, type JobMatchResult } from "@/lib/validation/schemas/job";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface MatchResult {
  result: JobMatchResult;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT =
  "Sen bir kariyer danışmanısın. Freelancer'ın profilini ve iş ilanını karşılaştırır, " +
  "uyum skorunu (0-100) ve öne çıkan güçlü/eksik yönleri öz biçimde raporlarsın. " +
  "Nesnel ol; yalnızca verilen bilgiden çıkar.";

export async function matchJobToProfile(
  profile: ProfileInput,
  jobDescription: string,
): Promise<MatchResult> {
  const client = getAnthropicClient();

  const userContent = [
    "Profil:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "İlan:",
    jobDescription,
  ].join("\n");

  const message = await client.messages.parse({
    model: ADAPTATION_MODEL,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    output_config: {
      format: zodOutputFormat(jobMatchResultSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  if (!message.parsed_output) {
    throw new InternalError("Eşleştirme sonucu ayrıştırılamadı.", {
      context: { stopReason: message.stop_reason },
    });
  }

  return {
    result: message.parsed_output,
    model: ADAPTATION_MODEL,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    costUsd: computeCostUsd(ADAPTATION_MODEL, message.usage),
  };
}
