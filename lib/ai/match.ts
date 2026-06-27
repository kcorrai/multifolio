import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
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
  const client = getOpenAIClient();

  const userContent = [
    "Profil:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "İlan:",
    jobDescription,
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(jobMatchResultSchema, "match"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Eşleştirme sonucu ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    result: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
