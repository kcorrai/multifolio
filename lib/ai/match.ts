import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { computeRubricScore, rubricVerdict } from "./rubric";
import { InternalError } from "@/lib/errors";
import { jobMatchAiSchema, type JobMatchResult } from "@/lib/validation/schemas/job";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export interface MatchResult {
  result: JobMatchResult;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// İlanın açıklama dışı yapılandırılmış alanları (varsa) — bütçe/kapsam ve ilan
// kalitesi boyutları ancak bu bağlamla anlamlı skorlanır.
export interface MatchJobContext {
  title?: string | null;
  budget?: string | null;
  skills?: string[] | null;
  clientCountry?: string | null;
  clientSpent?: number | null;
}

const SYSTEM_PROMPT =
  "Sen bir kariyer danışmanısın. Freelancer'ın profilini ve iş ilanını karşılaştırır, " +
  "uyumu 4 sabit rubrik boyutunda ayrı ayrı 0-100 puanlarsın (her boyuta tek cümlelik somut gerekçe):\n" +
  "- skill_fit: profildeki becerilerin ilanın istediği becerileri karşılama derecesi.\n" +
  "- experience_fit: profildeki deneyim/alan geçmişinin ilanın alanına uygunluğu.\n" +
  "- budget_fit: ilanın bütçe/kapsamının profildeki seviyeye uygunluğu (bütçe bilgisi yoksa açıklamadaki kapsam sinyallerinden değerlendir; hiç sinyal yoksa 50 ver ve gerekçede belirt).\n" +
  "- listing_quality: ilanın kalitesi ve risk sinyalleri (net gereksinimler, gerçekçi bütçe, güvenilir müşteri sinyalleri = yüksek; belirsiz/şablon metin, gerçekdışı beklenti = düşük).\n" +
  "Toplam skoru SEN HESAPLAMAZSIN; sistem rubrikten türetir. " +
  "Ayrıca öne çıkan güçlü/eksik yönleri öz biçimde raporlar ve ilandan, bir teklifin karşılaması " +
  "gereken en önemli somut gereksinimleri (en çok 7 madde) 'requirements' olarak çıkarırsın; " +
  "her madde kısa ve eyleme dönük olsun. Nesnel ol; yalnızca verilen bilgiden çıkar.\n" +
  "Son olarak ilanı dolandırıcılık/risk sinyalleri için tararsın ve bulduklarını 'risks' dizisinde " +
  "(en çok 3 kısa madde) raporlarsın: platform dışına iletişim daveti (Telegram/WhatsApp/e-posta), " +
  "freelancer'dan ödeme/depozito/yazılım satın alma talebi, kişisel/finansal veri talebi, " +
  "gerçekdışı bütçe veya vaat, aşırı belirsiz kapsam + acele baskısı. " +
  "Sinyal yoksa 'risks' BOŞ dizi olsun; zorlama, yalnız somut sinyal raporla.";

// İlan bağlam satırları — yalnız dolu alanlar eklenir.
function buildJobContextLines(context: MatchJobContext): string[] {
  const lines: string[] = [];
  if (context.title) lines.push(`Başlık: ${context.title}`);
  if (context.budget) lines.push(`Bütçe: ${context.budget}`);
  if (context.skills && context.skills.length > 0) lines.push(`İstenen beceriler: ${context.skills.join(", ")}`);
  if (context.clientCountry) lines.push(`Müşteri ülkesi: ${context.clientCountry}`);
  if (context.clientSpent != null) lines.push(`Müşterinin platformdaki toplam harcaması: $${context.clientSpent}`);
  return lines;
}

export async function matchJobToProfile(
  profile: ProfileInput,
  jobDescription: string,
  locale: Locale = "en",
  jobContext: MatchJobContext = {},
): Promise<MatchResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Profil:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    "İlan:",
    ...buildJobContextLines(jobContext),
    jobDescription,
    languageDirective(locale),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(jobMatchAiSchema, "match"),
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Eşleştirme sonucu ayrıştırılamadı.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  // Şeffaf skor: ağırlıklı rubrik toplamı + eşikten türeyen karar (lib/ai/rubric.ts).
  const score = computeRubricScore(parsed.rubric);
  const result: JobMatchResult = { ...parsed, score, verdict: rubricVerdict(score) };

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    result,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
