import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { profileDraftSchema, type ProfileDraft } from "@/lib/validation/schemas/profile-import";
import { clampImportText } from "@/lib/import/text";
import type { Locale } from "@/i18n/detect";

export interface ProfileImportResult {
  draft: ProfileDraft;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const SYSTEM_PROMPT =
  "Sen bir kariyer asistanısın. Sana bir freelancer'ın platform profili, CV'si veya " +
  "profil sayfası metni verilir. Bu metinden kişinin profesyonel profilini çıkarırsın: " +
  "headline (rol + değer önerisi, en çok 120 karakter), summary (3-5 cümlelik özgün özet " +
  "— metni kopyalama, damıt), skills (somut beceri etiketleri, en çok 20 adet). " +
  "Metinde profil bilgisi yoksa alanları boş bırak; ASLA uydurma.";

/** Serbest metinden profil taslağı çıkarır. Boş taslak da dönebilir —
 *  anlamlılık kararı çağırana (route) aittir. */
export async function extractProfile(text: string, locale: Locale = "en"): Promise<ProfileImportResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Kaynak metin:",
    clampImportText(text),
    "",
    languageDirective(locale),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(profileDraftSchema, "profile_draft"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Profil çıkarımı ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    draft: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
