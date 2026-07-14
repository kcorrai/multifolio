import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { negotiationSchema, type Negotiation } from "@/lib/validation/schemas/negotiation";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface NegotiationResult {
  negotiation: Negotiation;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Kanıta dayalı maaş pazarlığı: sıcak/işbirlikçi çerçeve (ilişkiyi bozmadan), sayısal
// ÇIPA (ilk sayıyı yüksek-ama-gerekçeli ver), aralık sun, değerini somut kanıtla
// (profil/başarılar) destekle. Piyasa RAKAMINI UYDURMA — kesin market verisi yoksa
// aralık/çerçeve öner ve kullanıcıya kendi araştırmasını (Levels.fyi/Glassdoor) hatırlat.
const SYSTEM_PROMPT =
  "Sen deneyimli bir maaş pazarlığı koçusun. Adayın profilini, aldığı teklifi ve (varsa) " +
  "hedefini kullanarak somut, uygulanabilir pazarlık koçluğu üretirsin. Şu kanıta dayalı " +
  "kuralları uygula:\n" +
  "1. assessment: teklifi kısaca değerlendir (adayın deneyimi/becerisine göre güçlü/zayıf yanlar). " +
  "Kesin piyasa rakamı UYDURMA; emin değilsen aralık/çerçeve ver ve kullanıcının kendi piyasa " +
  "araştırmasını (Levels.fyi, Glassdoor) yapmasını öner.\n" +
  "2. strategy: sıcak, işbirlikçi çerçeve (ilişkiyi zedelemeden); önce heyecanını belirt, sonra " +
  "gerekçeli karşı-teklif; tek sayı değil ARALIK; ilk sayıyı sen söyle (çıpa etkisi); yalnız temel " +
  "maaş değil (imza bonusu, izin, uzaktan çalışma, başlangıç tarihi) pazarlık kaldıraçlarını hatırlat.\n" +
  "3. counterOffer: gerçekçi bir aralık + ilk söylenecek çıpa + değerini adayın GERÇEK başarı/" +
  "becerilerine dayandıran gerekçe (uydurma abartı yok).\n" +
  "4. talkingPoints: görüşmede söylenecek 3-5 net cümle.\n" +
  "5. email: gönderilmeye hazır, kibar ama net bir karşı-teklif e-postası.\n" +
  "Çıktı dili aşağıdaki dil direktifine uymalı.";

export async function generateNegotiationCoaching(
  profile: ProfileInput,
  offer: string,
  target: string | null,
  opts: { locale?: Locale; jobTitle?: string | null; company?: string | null } = {},
): Promise<NegotiationResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Aday Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    opts.jobTitle?.trim() ? `Pozisyon: ${opts.jobTitle.trim()}` : "",
    opts.company?.trim() ? `Şirket: ${opts.company.trim()}` : "",
    `Alınan Teklif: ${offer}`,
    target?.trim() ? `Adayın Hedefi/Beklentisi: ${target.trim()}` : "",
    "",
    languageDirective(opts.locale ?? "en"),
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(negotiationSchema, "negotiation"),
    max_tokens: 1800,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Pazarlık koçluğu üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    negotiation: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
