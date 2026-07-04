import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { PROPOSAL_GUIDANCE, PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { Locale } from "@/i18n/detect";

// Takip mesajı üretimi (Dalga 3): başvurudan X gün sonra platform içi
// gönderilecek kısa, nazik, değer katan follow-up metni.

export interface FollowUpResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface GenerateFollowUpOptions {
  jobTitle: string;
  /** Serbest metin platform alanı; bilinen bir PlatformId ise tonu yönergeden alır. */
  platform?: string | null;
  jobDescription?: string | null;
  /** Kullanıcının bu ilana gönderdiği son teklif (bağlam — mesaj teklifi TEKRARLAMAZ). */
  lastProposal?: string | null;
  daysSince: number;
  headline?: string | null;
  locale?: Locale;
}

const followUpSchema = z.object({ content: z.string() });

const SYSTEM_PROMPT =
  "Sen bir freelance kariyer danışmanısın. Freelancer'ın başvurduğu ama yanıt almadığı iş için " +
  "kısa (en çok 120 kelime), nazik ve profesyonel bir takip (follow-up) mesajı yazarsın. " +
  "Mesaj yalvarmaz, suçlamaz; ilgiyi hatırlatır ve küçük bir DEĞER ekler (ilanla ilgili somut bir fikir, " +
  "soru veya öneri). Orijinal teklifi tekrarlamaz. Selamlama + 1-2 kısa paragraf + kapanış; " +
  "yer tutucu ([isim] gibi) KULLANMA. Çıktı dili aşağıdaki dil direktifine uymalı.";

export async function generateFollowUp(opts: GenerateFollowUpOptions): Promise<FollowUpResult> {
  const client = getOpenAIClient();

  const platformGuidance = PLATFORM_IDS.includes(opts.platform as PlatformId)
    ? PROPOSAL_GUIDANCE[opts.platform as PlatformId]
    : null;

  const userContent = [
    `İş İlanı Başlığı: ${opts.jobTitle}`,
    opts.platform ? `Platform: ${opts.platform}` : "",
    `Başvurudan bu yana geçen süre: ${opts.daysSince} gün`,
    opts.headline ? `Freelancer başlığı: ${opts.headline}` : "",
    opts.jobDescription ? ["", "İlan Açıklaması:", opts.jobDescription].join("\n") : "",
    opts.lastProposal ? ["", "Gönderilen Teklif (tekrarlama, yalnız bağlam):", opts.lastProposal].join("\n") : "",
    platformGuidance ? ["", "Platform Yönergesi (ton için):", platformGuidance].join("\n") : "",
    languageDirective(opts.locale ?? "en"),
  ].filter(Boolean).join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(followUpSchema, "followup"),
    max_tokens: 500,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Takip mesajı üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    content: parsed.content,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
