// Uyarlama motoru: tek profil + hedef platform → o platforma optimize metin.
// Sunucu-only. Anthropic Claude'u structured outputs ile çağırır; çıktı şemaya
// göre doğrulanmış JSON olarak döner (serbest metin ayrıştırma yok).
import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ADAPTATION_MODEL, getAnthropicClient } from "./anthropic";
import { PLATFORMS, type PlatformId } from "./platforms";
import { InternalError } from "@/lib/errors";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

// Modelin üreteceği yapı. Structured outputs bunu garanti eder.
export const adaptedOutputSchema = z.object({
  headline: z.string().describe("Platforma uygun, optimize edilmiş başlık."),
  body: z.string().describe("Platforma uygun, optimize edilmiş profil/özet metni."),
});
export type AdaptedOutput = z.infer<typeof adaptedOutputSchema>;

const SYSTEM_PROMPT =
  "Sen freelancer'lar için platforma özel profil metinleri üreten bir uzman " +
  "kariyer metin yazarısın. Kullanıcının çekirdek profilini alır ve hedef platformun " +
  "konvansiyonlarına, tonuna ve okuyucu beklentisine göre uyarlarsın. Gerçeği abartma; " +
  "yalnızca verilen bilgiden yaz. Çıktıyı istenen yapıda döndür.";

/**
 * Bir profili belirli bir platform için uyarlar.
 * @throws InternalError — model çıktısı ayrıştırılamazsa.
 */
export async function adaptProfile(
  profile: ProfileInput,
  platformId: PlatformId,
): Promise<AdaptedOutput> {
  const platform = PLATFORMS[platformId];
  const client = getAnthropicClient();

  const userContent = [
    `Hedef platform: ${platform.label}`,
    `Yönerge: ${platform.guidance}`,
    "",
    "Çekirdek profil:",
    `- Başlık: ${profile.headline}`,
    `- Özet: ${profile.summary}`,
    `- Beceriler: ${profile.skills.join(", ")}`,
  ].join("\n");

  const message = await client.messages.parse({
    model: ADAPTATION_MODEL,
    max_tokens: 4096,
    // Uyarlama nüanslı bir görev; adaptive thinking + dengeli efor.
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: zodOutputFormat(adaptedOutputSchema),
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  if (!message.parsed_output) {
    throw new InternalError("Uyarlama çıktısı ayrıştırılamadı.", {
      context: { stopReason: message.stop_reason, platformId },
    });
  }
  return message.parsed_output;
}
