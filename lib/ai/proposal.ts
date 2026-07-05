import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { buildRequirementsBlock, buildFocusBlock } from "./coverage";
import { proposalLanguageDirective } from "./language";
import { buildPlatformProfileBlock, type PlatformProfileContext } from "./platform-context";
import { buildStyleDirective, type ProposalTone, type ProposalLength } from "@/lib/proposal/style";
import { InternalError } from "@/lib/errors";
import { PROPOSAL_GUIDANCE, PLATFORM_LANGUAGE, type PlatformId } from "@/lib/ai/platforms";
import {
  proposalWithCoverageSchema,
  type ProposalCoverageItem,
} from "@/lib/validation/schemas/proposal";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface ProposalResult {
  content: string;
  coverage: ProposalCoverageItem[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface GenerateProposalOptions {
  requirements?: string[];
  focusRequirements?: string[];
  locale?: Locale;
  /** Kullanıcının hedef platformdan çekilmiş gerçek profili (varsa). */
  platformProfile?: PlatformProfileContext | null;
  /** İlanın geldiği feed'in kullanıcı tanımlı teklif yönergesi (varsa). */
  feedPrompt?: string | null;
  /** Kullanıcının seçtiği yazım tonu + uzunluğu (varsa; yoksa nötr). */
  tone?: ProposalTone | null;
  length?: ProposalLength | null;
}

// Feed'e özel serbest yönerge bloğu (boş/whitespace ise eklenmez).
function buildFeedPromptBlock(p: string | null | undefined): string {
  if (!p || !p.trim()) return "";
  return ["", "Kullanıcının bu feed için tanımladığı teklif yönergesi (uygula):", p.trim()].join("\n");
}

const SYSTEM_PROMPT =
  "Sen bir freelance kariyer danışmanısın. Freelancer'ın profilini ve iş ilanını kullanarak " +
  "ilgili platform için özgün, etkili bir iş teklifi yazarsın. Şablon gibi görünme; doğal ve inandırıcı yaz. " +
  "Ayrıca teklifin ilandaki her gereksinimi ne ölçüde karşıladığını 'coverage' olarak değerlendirirsin. " +
  "Sana gereksinim listesi verilirse onları kullan; verilmezse ilandan en önemli gereksinimleri (en çok 7) kendin çıkar. " +
  "Her gereksinim için status: 'met' (teklif açıkça karşılıyor), 'partial' (kısmen/dolaylı), 'missing' (teklifte yok). " +
  "note kısa bir gerekçe olsun; çıktı dili aşağıdaki dil direktifine uymalı.";

export async function generateProposal(
  profile: ProfileInput,
  jobDescription: string,
  platform: PlatformId,
  opts: GenerateProposalOptions = {},
): Promise<ProposalResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Freelancer Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    buildPlatformProfileBlock(opts.platformProfile),
    "",
    "İş İlanı:",
    jobDescription,
    buildRequirementsBlock(opts.requirements),
    buildFocusBlock(opts.focusRequirements),
    "",
    "Platform Yönergesi:",
    PROPOSAL_GUIDANCE[platform],
    buildFeedPromptBlock(opts.feedPrompt),
    buildStyleDirective(opts.tone, opts.length),
    // content = platform dili (Upwork/Fiverr/LinkedIn → EN), coverage notları = UI dili.
    proposalLanguageDirective(PLATFORM_LANGUAGE[platform], opts.locale ?? "en"),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(proposalWithCoverageSchema, "proposal"),
    max_tokens: 1600,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Teklif üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    content: parsed.content,
    coverage: parsed.coverage,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
