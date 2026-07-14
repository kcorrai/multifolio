import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { PLATFORMS, PLATFORM_LANGUAGE, type PlatformId } from "./platforms";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { buildPlatformProfileBlock, type PlatformProfileContext } from "./platform-context";
import { InternalError } from "@/lib/errors";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const adaptedOutputSchema = z.object({
  headline: z.string().describe("Platforma uygun, optimize edilmiş başlık."),
  body: z.string().describe("Platforma uygun, optimize edilmiş profil/özet metni."),
});
export type AdaptedOutput = z.infer<typeof adaptedOutputSchema>;

export interface AdaptResult {
  output: AdaptedOutput;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Kanıta dayalı profil-yazım kuralları: anahtar-kelime hizalama (profil aramada
// bunlarla bulunur) + özgüllük (jenerik övgü değil, somut sonuç/beceri) + platforma
// göre ilk satırların önemi (arama/önizleme yalnız ilk kısmı gösterir).
const SYSTEM_PROMPT =
  "Sen freelancer'lar için platforma özel profil metinleri üreten bir uzman " +
  "kariyer metin yazarısın. Kullanıcının çekirdek profilini alır ve hedef platformun " +
  "konvansiyonlarına, tonuna ve okuyucu beklentisine göre uyarlarsın. Şu kuralları uygula:\n" +
  "1. İlgili beceri/teknoloji anahtar kelimelerini başlıkta ve metinde DOĞAL kullan — " +
  "profiller aramada bu kelimelerle bulunur (keyword-stuffing YAPMA, doğal serpiştir).\n" +
  "2. Başlığın ve metnin İLK cümlesi en güçlü olmalı: çoğu platform arama/önizlemede yalnız " +
  "ilk kısmı gösterir (headline'ın ilk ~80 karakteri, özetin ilk 1-2 cümlesi kritik).\n" +
  "3. Jenerik övgü/klişe yerine ÖZGÜL ol: somut beceri, ölçülebilir sonuç, gerçek uzmanlık alanı.\n" +
  "Gerçeği abartma; yalnızca verilen bilgiden yaz (uydurma ekleme). Çıktıyı istenen yapıda döndür.";

export async function adaptProfile(
  profile: ProfileInput,
  platformId: PlatformId,
  platformProfile: PlatformProfileContext | null = null,
): Promise<AdaptResult> {
  const platform = PLATFORMS[platformId];
  const client = getOpenAIClient();

  const userContent = [
    `Hedef platform: ${platform.label}`,
    `Yönerge: ${platform.guidance}`,
    "",
    "Çekirdek profil:",
    `- Başlık: ${profile.headline}`,
    `- Özet: ${profile.summary}`,
    `- Beceriler: ${profile.skills.join(", ")}`,
    buildPlatformProfileBlock(platformProfile),
    // Uyarlanan metin platform PROFİLİNE gider → platform dilinde (global platformlar
    // EN, yerel platformlar TR); UI diline göre değil (teklifteki PLATFORM_LANGUAGE deseni).
    languageDirective(PLATFORM_LANGUAGE[platformId]),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    max_tokens: 1400,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(adaptedOutputSchema, "output"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Uyarlama çıktısı ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason, platformId },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    output: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
