import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { mockQuestionsSchema, mockFeedbackSchema, type MockQuestions, type MockFeedback, type MockDifficulty, type MockCategory } from "@/lib/validation/schemas/mock-interview";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

interface Usage { model: string; inputTokens: number; outputTokens: number; costUsd: number }

// Zorluk seviyesinin soru derinliğine yansıması (prompt direktifi).
const DIFFICULTY_DIRECTIVE: Record<MockDifficulty, string> = {
  junior: "Zorluk: JUNIOR (0-2 yıl) — temel kavramlar, öğrenme isteği, basit senaryolar; aşırı derin sistem tasarımı sorma.",
  mid: "Zorluk: MID (2-5 yıl) — pratik problem çözme, gerçek proje kararları, ölçülebilir sonuçlar; dengeli derinlik.",
  senior: "Zorluk: SENIOR (5+ yıl) — mimari kararlar, trade-off'lar, liderlik/mentorluk, belirsizlik altında yargı; zorlayıcı takip senaryoları.",
};

const CATEGORY_LABEL: Record<MockCategory, string> = {
  behavioral: "behavioral (STAR gerektiren)",
  technical: "technical (rolün becerilerine dair)",
  role_fit: "role_fit (deneyim/uygunluk)",
  motivation: "motivation (neden bu rol/şirket)",
};

// ── Soru üretimi ────────────────────────────────────────────────────────
function questionsSystem(count: number, categories: MockCategory[], difficulty: MockDifficulty): string {
  const cats = categories.length > 0 ? categories : (["behavioral", "technical", "role_fit", "motivation"] as MockCategory[]);
  const catText = cats.map((c) => CATEGORY_LABEL[c]).join(", ");
  return (
    "Sen deneyimli bir teknik/işe-alım mülakatçısısın. Adayın profiline ve (varsa) hedef ilana " +
    `göre GERÇEKÇİ mülakat soruları üretirsin. TAM ${count} soru üret; SADECE şu kategorilere yay: ${catText}. ` +
    `${DIFFICULTY_DIRECTIVE[difficulty]} ` +
    "Sorular adayın seviyesine ve alanına özgü olsun (jenerik değil). " +
    "Her soru için strongAnswerHint: güçlü bir cevabın neyi kapsaması gerektiği (kısa). " +
    "Çıktı dili aşağıdaki dil direktifine uymalı."
  );
}

export async function generateMockQuestions(
  profile: ProfileInput,
  jobDescription: string | null,
  opts: { locale?: Locale; difficulty?: MockDifficulty; count?: number; categories?: MockCategory[] } = {},
): Promise<{ result: MockQuestions } & Usage> {
  const client = getOpenAIClient();
  const count = opts.count ?? 6;
  const categories = opts.categories ?? [];
  const difficulty = opts.difficulty ?? "mid";
  const userContent = [
    "Aday Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    jobDescription?.trim() ? `Hedef İş İlanı:\n${jobDescription.trim()}` : "Hedef ilan verilmedi — profile göre genel mülakat soruları üret.",
    "",
    languageDirective(opts.locale ?? "en"),
  ].join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: questionsSystem(count, categories, difficulty) },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(mockQuestionsSchema, "mock_questions"),
    max_tokens: 2200,
  });
  const parsed = completion.choices[0].message.parsed;
  if (!parsed) throw new InternalError("Mülakat soruları üretilemedi.", { context: { finish_reason: completion.choices[0].finish_reason } });
  const usage = { prompt_tokens: completion.usage?.prompt_tokens ?? 0, completion_tokens: completion.usage?.completion_tokens ?? 0 };
  return { result: parsed, model: AI_MODEL, inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, costUsd: computeCostUsd(AI_MODEL, usage) };
}

// ── Cevap değerlendirmesi ───────────────────────────────────────────────
const FEEDBACK_SYSTEM =
  "Sen destekleyici ama dürüst bir mülakat koçusun. Adayın bir mülakat sorusuna verdiği cevabı " +
  "değerlendirirsin. Kriterler: soruyu gerçekten yanıtlıyor mu, somut/özgül mü (STAR gerektiren " +
  "sorularda Situation/Task/Action/Result ve ölçülebilir sonuç var mı), yapı ve netlik. " +
  "score: 0-100 gerçekçi puan. strengths: cevabın iyi yanları. improvements: SOMUT gelişim önerileri. " +
  "modelAnswer: adayın profilinden kurulmuş, aynı soruya güçlü bir ÖRNEK cevap (uydurma abartı yok, " +
  "profildeki gerçek bilgiyi kullan). " +
  "followUp: cevap zayıf/eksik/yüzeysel ise gerçek bir mülakatçının soracağı TEK derinleştirici " +
  "takip sorusu (adayın atladığı noktayı kurcalayan). Cevap zaten güçlü ve eksiksizse followUp'ı " +
  "BOŞ STRING ('') yap. Çıktı dili aşağıdaki dil direktifine uymalı.";

export async function evaluateMockAnswer(
  profile: ProfileInput,
  question: string,
  answer: string,
  jobDescription: string | null,
  opts: { locale?: Locale } = {},
): Promise<{ result: MockFeedback } & Usage> {
  const client = getOpenAIClient();
  const userContent = [
    "Aday Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    jobDescription?.trim() ? `\nHedef İş İlanı:\n${jobDescription.trim()}` : "",
    "",
    `Mülakat Sorusu: ${question}`,
    "",
    `Adayın Cevabı: ${answer}`,
    "",
    languageDirective(opts.locale ?? "en"),
  ].filter(Boolean).join("\n");

  const completion = await client.chat.completions.parse({
    model: AI_MODEL,
    messages: [
      { role: "system", content: FEEDBACK_SYSTEM },
      { role: "user", content: userContent },
    ],
    response_format: zodResponseFormat(mockFeedbackSchema, "mock_feedback"),
    max_tokens: 1400,
  });
  const parsed = completion.choices[0].message.parsed;
  if (!parsed) throw new InternalError("Cevap değerlendirilemedi.", { context: { finish_reason: completion.choices[0].finish_reason } });
  const usage = { prompt_tokens: completion.usage?.prompt_tokens ?? 0, completion_tokens: completion.usage?.completion_tokens ?? 0 };
  // Skoru 0-100'e sıkıştır (model bazen aşabilir).
  const clamped: MockFeedback = { ...parsed, score: Math.max(0, Math.min(100, Math.round(parsed.score))) };
  return { result: clamped, model: AI_MODEL, inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, costUsd: computeCostUsd(AI_MODEL, usage) };
}
