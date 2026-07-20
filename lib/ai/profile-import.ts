import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { InternalError } from "@/lib/errors";
import { profileDraftSchema, type ProfileDraft } from "@/lib/validation/schemas/profile-import";
import { clampImportText } from "@/lib/import/text";

export interface ProfileImportResult {
  draft: ProfileDraft;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/* Prompt İNGİLİZCE: ürün global-only ve AI çıktısı her zaman İngilizce (CLAUDE.md).
   Eskiden prompt Türkçeydi + "kaynak metnin dilini koru" diyordu → İngilizce
   kaynaktan Türkçe özet üretiyordu (PeoplePerHour senkronunda canlı görüldü). */
const SYSTEM_PROMPT =
  "You are a career assistant. You are given the text of a freelancer's platform " +
  "profile, CV or profile page. Extract their professional profile from it: " +
  "headline (role + value proposition, max 120 characters), summary (an original " +
  "3-5 sentence summary — distil, do not copy the text), skills (concrete skill " +
  "tags, max 20). If the text contains no profile information, leave the fields " +
  "empty; NEVER invent anything. " +
  "IMPORTANT: always write the output in ENGLISH, whatever language the source " +
  "text is in — translate it if needed.";

/** Serbest metinden profil taslağı çıkarır (çıktı DAİMA İngilizce — kaynak dili ne olursa olsun).
 *  Boş taslak da dönebilir — anlamlılık kararı çağırana (route) aittir. */
export async function extractProfile(text: string): Promise<ProfileImportResult> {
  const client = getOpenAIClient();

  const userContent = ["Source text:", clampImportText(text)].join("\n");

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
