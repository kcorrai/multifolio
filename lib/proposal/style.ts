// Teklif yazım stili (SAF): kullanıcı ton + uzunluk seçer → AI prompt'una direktif.
// "AI slop" şikayetini azaltır (kullanıcı sesini ayarlar). Şema (Zod) + UI + proposal.ts
// bu tek kaynaktan besleniyor. Değerler verilmezse eski davranış (nötr) korunur.

export const PROPOSAL_TONES = ["professional", "friendly", "confident"] as const;
export type ProposalTone = (typeof PROPOSAL_TONES)[number];

export const PROPOSAL_LENGTHS = ["concise", "standard", "detailed"] as const;
export type ProposalLength = (typeof PROPOSAL_LENGTHS)[number];

const TONE_DIRECTIVE: Record<ProposalTone, string> = {
  professional: "profesyonel, kurumsal ve resmi",
  friendly: "sıcak, samimi ve konuşma dilinde (aşırı resmi olma)",
  confident: "kendinden emin, iddialı ve sonuç odaklı (ama abartısız)",
};

const LENGTH_DIRECTIVE: Record<ProposalLength, string> = {
  concise: "kısa ve öz tut (yaklaşık 80-120 kelime, gereksiz dolgu yok)",
  standard: "dengeli uzunlukta (yaklaşık 150-220 kelime)",
  detailed: "detaylı ve kapsamlı (yaklaşık 250-350 kelime, örnek/kanıt ekle)",
};

/** Ton + uzunluk direktif bloğu (ikisi de opsiyonel; boşsa "" döner → davranış değişmez). */
export function buildStyleDirective(tone?: ProposalTone | null, length?: ProposalLength | null): string {
  const lines: string[] = [];
  if (tone) lines.push(`Yazım tonu: ${TONE_DIRECTIVE[tone]}.`);
  if (length) lines.push(`Teklif uzunluğu: ${LENGTH_DIRECTIVE[length]}.`);
  return lines.length > 0 ? "\n" + lines.join("\n") : "";
}
