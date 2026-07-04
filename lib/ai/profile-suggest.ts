import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { profileDraftSchema, type ProfileDraft } from "@/lib/validation/schemas/profile-import";
import type { Locale } from "@/i18n/detect";

// Public profil önerisi (Dalga 3): kullanıcının farklı platformlardan ÇEKİLMİŞ
// public profillerini (platform_profiles) sentezleyip tek, güçlü bir master
// profil (headline/summary/skills) önerir. extractProfile'dan farkı: serbest
// metin değil, YAPILANDIRILMIŞ çok-platform veriyi harmanlar.

export interface SuggestPlatformProfile {
  platform: string;
  headline: string;
  summary: string;
  skills: string[];
}

export interface SuggestCurrentProfile {
  headline: string;
  summary: string;
  skills: string[];
}

export interface ProfileSuggestResult {
  draft: ProfileDraft;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT =
  "Sen bir freelance kariyer ve kişisel marka danışmanısın. Kullanıcının farklı " +
  "platformlardaki (LinkedIn, Upwork, Fiverr, Bionluk) PUBLIC profil verileri ve " +
  "varsa mevcut profili verilir. Bunları SENTEZLEYEREK tek, tutarlı ve güçlü bir " +
  "master profil önerirsin: headline (rol + net değer önerisi, en çok 120 karakter), " +
  "summary (3-5 cümlelik özgün, akıcı özet — kaynak metinleri kopyalama, damıt ve " +
  "profesyonelleştir), skills (platformlardaki becerileri birleştir, tekrarları at, " +
  "en önemlileri öne al, en çok 20 adet). Platformlar çelişiyorsa en profesyonel ve " +
  "tutarlı olanı seç. Bilgi yoksa uydurma. Çıktı dili aşağıdaki direktife uymalı.";

function platformBlock(p: SuggestPlatformProfile): string {
  const lines = [`— ${p.platform.toUpperCase()} profili:`];
  if (p.headline) lines.push(`  Başlık: ${p.headline}`);
  if (p.summary) lines.push(`  Özet: ${p.summary}`);
  if (p.skills.length) lines.push(`  Beceriler: ${p.skills.join(", ")}`);
  return lines.join("\n");
}

export async function suggestProfile(inputs: {
  platformProfiles: SuggestPlatformProfile[];
  current: SuggestCurrentProfile | null;
  locale?: Locale;
}): Promise<ProfileSuggestResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Kullanıcının bağlı platform public profilleri:",
    inputs.platformProfiles.map(platformBlock).join("\n\n"),
    ...(inputs.current && (inputs.current.headline || inputs.current.summary || inputs.current.skills.length)
      ? [
          "",
          "Mevcut Multifolio profili (referans; daha iyisini öner):",
          inputs.current.headline ? `  Başlık: ${inputs.current.headline}` : "",
          inputs.current.summary ? `  Özet: ${inputs.current.summary}` : "",
          inputs.current.skills.length ? `  Beceriler: ${inputs.current.skills.join(", ")}` : "",
        ].filter(Boolean)
      : []),
    "",
    languageDirective(inputs.locale ?? "en"),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(profileDraftSchema, "profile_suggestion"),
    max_tokens: 900,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Profil önerisi üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    draft: parsed as ProfileDraft,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
