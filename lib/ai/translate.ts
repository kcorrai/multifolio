// İlan çeviri motoru (sunucu-only). İki iş yapar:
// 1) translateJobTitles — scrape sonrası BATCH: dil tespiti + başlıkların EN/TR çevirisi.
// 2) translateJobDescription — on-demand: tek ilan açıklamasını hedef dile çevirir.
// Her ikisi de token/maliyet raporlar (usage_events / scrape özeti için).
import "server-only";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { InternalError } from "@/lib/errors";
import type { Locale } from "@/i18n/detect";

export interface AiUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/* ── Başlık batch çevirisi ──────────────────────────────────────────── */

const titleBatchSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      lang: z.string(),
      title_en: z.string(),
      title_tr: z.string(),
    }),
  ),
});

export type TitleTranslation = z.infer<typeof titleBatchSchema>["items"][number];

const TITLE_SYSTEM_PROMPT =
  "Sen bir iş ilanı çevirmenisin. Sana id ve başlıktan oluşan bir ilan listesi verilir. " +
  "Her ilan için: lang = başlığın dilinin ISO 639-1 kodu (ör. 'de', 'en', 'tr'); " +
  "title_en = başlığın İngilizce hali; title_tr = başlığın Türkçe hali. " +
  "Başlık zaten hedef dildeyse o alana AYNEN orijinali yaz. Şirket/ürün adlarını, " +
  "teknoloji terimlerini ve (m/w/d) gibi ekleri çevirmeden koru. id'yi birebir geri döndür.";

/** İlan başlıklarını tek çağrıda toplu çevirir (dil tespiti + EN/TR). */
export async function translateJobTitles(
  jobs: { id: string; title: string }[],
): Promise<{ items: TitleTranslation[] } & AiUsage> {
  const client = getOpenAIClient();

  const userContent = jobs.map((j) => JSON.stringify({ id: j.id, title: j.title })).join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: TITLE_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(titleBatchSchema, "title_translations"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Başlık çevirisi ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    items: parsed.items,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}

/* ── Açıklama çevirisi (on-demand) ──────────────────────────────────── */

// Aşırı uzun açıklamalar maliyeti şişirmesin (ilan açıklamaları tipik <10k karakter).
const DESCRIPTION_MAX_CHARS = 12_000;

const DESCRIPTION_SYSTEM_PROMPT =
  "Sen bir iş ilanı çevirmenisin. Sana bir ilan açıklaması verilir; onu istenen dile " +
  "çevirirsin. Paragraf/satır yapısını ve maddeleme düzenini koru. Şirket/ürün adlarını " +
  "ve teknoloji terimlerini çevirme. Yorum ekleme, özetleme — yalnızca çeviriyi döndür.";

/** Tek ilan açıklamasını hedef dile çevirir; düz metin döner. */
export async function translateJobDescription(
  text: string,
  target: Locale,
): Promise<{ translated: string } & AiUsage> {
  const client = getOpenAIClient();
  const targetName = target === "tr" ? "Türkçe" : "İngilizce";

  const completion = await client.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: "system", content: DESCRIPTION_SYSTEM_PROMPT },
      { role: "user", content: `Hedef dil: ${targetName}\n\n${text.slice(0, DESCRIPTION_MAX_CHARS)}` },
    ],
  });

  const translated = completion.choices[0]?.message?.content?.trim();
  if (!translated) {
    throw new InternalError("Açıklama çevirisi boş döndü.", {
      context: { finish_reason: completion.choices[0]?.finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    translated,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
