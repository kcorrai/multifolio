import "server-only";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { InternalError } from "@/lib/errors";
import { PROPOSAL_GUIDANCE, type PlatformId } from "@/lib/ai/platforms";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface ProposalResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT =
  "Sen bir freelance kariyer danışmanısın. Freelancer'ın profilini ve iş ilanını kullanarak " +
  "ilgili platform için özgün, etkili bir iş teklifi yazıyorsun. " +
  "Platformun beklentilerine uy; şablon gibi görünme, doğal ve inandırıcı yaz.";

export async function generateProposal(
  profile: ProfileInput,
  jobDescription: string,
  platform: PlatformId,
): Promise<ProposalResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Freelancer Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "İş İlanı:",
    jobDescription,
    "",
    "Platform Yönergesi:",
    PROPOSAL_GUIDANCE[platform],
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    max_tokens: 700,
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new InternalError("Teklif üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    content,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
