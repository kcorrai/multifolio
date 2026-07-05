import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { profileAnalysisAiSchema, type ProfileAnalysisAi } from "@/lib/validation/schemas/analyze";
import { clampImportText } from "@/lib/import/text";
import type { Locale } from "@/i18n/detect";

export interface ProfileAnalysisResult {
  analysis: ProfileAnalysisAi;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Girdi: ya ham profil metni ya da yapılandırılmış profil (Bionluk/LinkedIn
// çekimi). Analizin kendisi her zaman AI'dır; yapılandırılmış yol yalnız
// fetch adımını AI'sız yapar.
export type ProfileAnalyzeInput =
  | { text: string }
  | { profile: { headline: string; summary: string; skills: string[] } };

const SYSTEM_PROMPT =
  "Sen freelance platformlarında (Upwork, Fiverr, LinkedIn, Bionluk) profil optimizasyonu " +
  "uzmanısın. Sana bir freelancer profil metni verilir; 4 sabit boyutta ayrı ayrı 0-100 " +
  "puanlarsın (her boyuta tek cümlelik somut gerekçe):\n" +
  "- headline_impact: başlığın rol + değer önerisini ne kadar net ve çarpıcı verdiği.\n" +
  "- summary_quality: özetin somutluğu, sonuç/kanıt içermesi, müşteri-odaklılığı.\n" +
  "- skills_coverage: becerilerin sayısı, güncelliği ve pazarda aranırlığı.\n" +
  "- trust_signals: güven sinyalleri (deneyim süresi, portfolyo/sonuç referansları, profesyonel ton).\n" +
  "Puan bantları (her boyutta tutarlı uygula, ortalama bir 'güvenli' banda kümelenme): " +
  "0-30 zayıf · 40-60 orta · 70-85 güçlü · 90-100 mükemmel. " +
  "Gerçekten zayıfsa düşük, gerçekten güçlüyse yüksek ver; gerekçe skorla tutarlı olsun.\n" +
  "Toplam skoru SEN HESAPLAMAZSIN; sistem boyutlardan türetir.\n" +
  "Ayrıca en etkili 5 somut iyileştirme önerisini 'suggestions' olarak yazarsın " +
  "(kısa, eyleme dönük, önem sırasıyla).\n" +
  "Son olarak Upwork'ün yeni profil ONAY sürecini düşünürsün: profil olduğu gibi " +
  "Upwork'e taşınsa onaydan geçme şansını düşüren eksikleri 'upworkApprovalNotes' " +
  "olarak raporlarsın (en çok 3 madde; belirgin eksik yoksa boş dizi). " +
  "Nesnel ol; yalnızca verilen bilgiden çıkar, uydurma.";

export async function analyzeProfileText(
  input: ProfileAnalyzeInput,
  locale: Locale = "en",
): Promise<ProfileAnalysisResult> {
  const client = getOpenAIClient();

  const sourceText =
    "text" in input
      ? clampImportText(input.text)
      : [
          `Başlık: ${input.profile.headline}`,
          `Özet: ${input.profile.summary}`,
          `Beceriler: ${input.profile.skills.join(", ")}`,
        ].join("\n");

  const userContent = ["Profil metni:", sourceText, "", languageDirective(locale)].join("\n");

  // Düşük temperature: public /analyze skoru pazarlama vitrini — tekrar analizde
  // tutarlı kalsın.
  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 1200,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(profileAnalysisAiSchema, "profile_analysis"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Profil analizi ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    analysis: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
