import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { coverLetterSchema } from "@/lib/validation/schemas/cover-letter";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface CoverLetterResult {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Cover letter = GELENEKSEL iş başvurusu ön yazısı (freelance teklifinden farklı —
// platform mekaniği yok, resmi mektup formatı). Kanıta dayalı: kişiye-özel (ilandan
// somut detay — ResumeGo N=7.287 kişiye-özel %16.4 vs jenerik %12.5), problem/uyum-odaklı
// açılış, "Hi my name is" değil, ~250-350 kelime (tek sayfa), jenerik cila değil özgüllük.
const SYSTEM_PROMPT =
  "Sen profesyonel bir kariyer metin yazarısın. Adayın profilini ve iş ilanını kullanarak " +
  "geleneksel bir iş başvurusu ön yazısı (cover letter) yazarsın. Şu kanıta dayalı kuralları uygula:\n" +
  "1. Açılış: neden bu rol/şirket + adayın uygunluğu; ilandan SOMUT bir detaya değin (rol adı, " +
  "aranan bir beceri/teknoloji ya da şirketin belirttiği bir ihtiyaç). 'Hi, my name is...' ile AÇMA.\n" +
  "2. Gövde: 1-2 paragraf; ilanın gereksinimine karşılık adayın GERÇEK, ilgili bir başarısını " +
  "(mümkünse ölçülebilir sonuçla) anlat. Jenerik övgü değil, özgül kanıt.\n" +
  "3. Kapanış: role dair samimi ilgi + kibar bir sonraki-adım/görüşme çağrısı.\n" +
  "4. Uzunluk ~250-350 kelime (tek sayfa); resmi ama insani ton. Uydurma bilgi ekleme.\n" +
  "Çıktı yalnız mektup metni (selamlama + paragraflar + kapanış). Dil aşağıdaki direktife uymalı.";

export async function generateCoverLetter(
  profile: ProfileInput,
  jobDescription: string,
  opts: { locale?: Locale; jobTitle?: string | null; company?: string | null } = {},
): Promise<CoverLetterResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Aday Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "Hedef İş İlanı:",
    opts.jobTitle?.trim() ? `Pozisyon: ${opts.jobTitle.trim()}` : "",
    opts.company?.trim() ? `Şirket: ${opts.company.trim()}` : "",
    jobDescription,
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
    response_format: zodResponseFormat(coverLetterSchema, "cover_letter"),
    max_tokens: 1400,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Ön yazı üretilemedi.", {
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
