import "server-only";
import { zodResponseFormat } from "openai/helpers/zod";
import { AI_MODEL, getOpenAIClient } from "./openai-client";
import { computeCostUsd } from "./pricing";
import { languageDirective } from "./language";
import { InternalError } from "@/lib/errors";
import { interviewPrepSchema, type InterviewPrep } from "@/lib/validation/schemas/interview";
import type { Locale } from "@/i18n/detect";
import type { ProfileInput, ProfileProject } from "@/lib/validation/schemas/profile";

export interface InterviewPrepResult {
  prep: InterviewPrep;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Kanıta dayalı mülakat hazırlık kuralları: STAR (DDI 1974; Action ağırlıklı),
// "tell me about yourself" Present→Past→Future ~90 sn, zayıflık ilanın must-have'ini
// DIŞLAR + düzeltici eylem, 4-5 soru rol/ekip/büyüme/süreç dağılımında. Yalnız gerçek
// profil/proje verisinden — uydurma deneyim ekleme.
const SYSTEM_PROMPT =
  "Sen deneyimli bir mülakat koçusun. Adayın profilini, projelerini ve hedef iş ilanını " +
  "kullanarak somut, kişiye özel bir mülakat hazırlığı üretirsin. Şu kanıta dayalı kuralları uygula:\n" +
  "1. STAR hikâyeleri: her hikâye Situation/Task/Action/Result yapısında olsun; ACTION en uzun ve " +
  "en somut kısım olmalı (adayın KENDİ yaptığı). Hikâyeleri adayın GERÇEK projelerinden türet — uydurma.\n" +
  "2. 'Tell me about yourself': Present→Past→Future akışı (şu anki rol/başarı → ilgili geçmiş → neden bu rol); " +
  "~150-200 kelime, konuşma diline uygun.\n" +
  "3. Zayıflık: ilanın OLMAZSA OLMAZ becerilerinden OLMAYAN gerçek bir gelişim alanı seç; mutlaka " +
  "somut bir düzeltici eylemle eşle (karakter kusuru değil, gelişilebilir bir konu).\n" +
  "4. Sorular: adayın soracağı 4-5 soru; rol, ekip/kültür, büyüme ve süreç kategorilerine yay.\n" +
  "5. Yalnız verilen gerçek verilerden yaz; bilgi uydurma. Çıktı dili aşağıdaki dil direktifine uymalı.";

/** Projeleri prompt bloğuna indirger (başlık + açıklama + beceriler). */
function buildProjectsBlock(projects: ProfileProject[]): string {
  const usable = projects.filter((p) => p.title?.trim() || p.description?.trim());
  if (usable.length === 0) return "Projeler: (belirtilmemiş)";
  const lines = usable.slice(0, 8).map((p) => {
    const skills = p.skills?.length ? ` [${p.skills.join(", ")}]` : "";
    const role = p.role?.trim() ? ` (rol: ${p.role.trim()})` : "";
    const desc = p.description?.trim() ? ` — ${p.description.trim().slice(0, 400)}` : "";
    return `- ${p.title?.trim() || "Proje"}${role}${skills}${desc}`;
  });
  return ["Projeler:", ...lines].join("\n");
}

export async function generateInterviewPrep(
  profile: ProfileInput,
  projects: ProfileProject[],
  jobDescription: string,
  opts: { locale?: Locale; jobTitle?: string | null } = {},
): Promise<InterviewPrepResult> {
  const client = getOpenAIClient();

  const userContent = [
    "Aday Profili:",
    `Başlık: ${profile.headline}`,
    `Özet: ${profile.summary}`,
    `Beceriler: ${profile.skills.join(", ")}`,
    "",
    buildProjectsBlock(projects),
    "",
    "Hedef İş İlanı:",
    opts.jobTitle?.trim() ? `Pozisyon: ${opts.jobTitle.trim()}` : "",
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
    response_format: zodResponseFormat(interviewPrepSchema, "interview_prep"),
    max_tokens: 2200,
  });

  const parsed = completion.choices[0].message.parsed;
  if (!parsed) {
    throw new InternalError("Mülakat hazırlığı üretilemedi.", {
      context: { finish_reason: completion.choices[0].finish_reason },
    });
  }

  const usage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
  };

  return {
    prep: parsed,
    model: AI_MODEL,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    costUsd: computeCostUsd(AI_MODEL, usage),
  };
}
