// Teklif kalite linter'ı (SAF, kredisiz, deterministik). Üretilen teklifi reddettiren
// en sık nedenlere karşı denetler (araştırma: Upwork red nedenlerinin ~%60'ı): uzunluk,
// eylem çağrısı (CTA), jenerik/klişe açılış, düzenlenmemiş placeholder + ÖZGÜLLÜK
// (ilandan somut detay atfı — arXiv 2509.25054: AI cilası sinyal değerini yitirdi,
// özgüllük tek kalıcı sinyal). Hiçbir rakip bunu sunmuyor → farklılaştırıcı.
// Yüksek-hassasiyet kuralları (yanlış-pozitif düşük); sinyalse uyarır, engellemez.
import type { ProposalLength } from "@/lib/proposal/style";
import { extractKeywordsFromText } from "@/lib/cv/keywords";

export type QualityIssue =
  | "wordCountLow"
  | "wordCountHigh"
  | "noCta"
  | "generic"
  | "placeholder"
  | "notSpecific";

export type QualityBand = "excellent" | "good" | "fair" | "weak";

export interface ProposalQuality {
  score: number; // 0-100
  band: QualityBand;
  wordCount: number;
  issues: QualityIssue[];
}

// Uzunluk hedef aralıkları (style.ts direktifleriyle uyumlu, biraz toleranslı).
const RANGES: Record<ProposalLength, [number, number]> = {
  concise: [60, 140],
  standard: [130, 250],
  detailed: [220, 400],
};

// Eylem çağrısı sinyalleri (EN + TR — teklif dili platforma göre değişir).
const CTA_RE =
  /\b(discuss|call|chat|message|connect|available|schedule|let'?s|when can|when would|ready to start|reach out|get started|hop on)\b|görüş(elim|mek)|mesaj at|beni ara|müsait|ne zaman|başlayabil|hemen başla|iletişim/i;

// Jenerik/klişe açılışlar (net kötü kalıplar — yüksek hassasiyet).
const GENERIC_RE =
  /\b(i am an expert|i'?m an expert|dear sir|dear madam|to whom it may concern|i will help you|i am the best|i'?m the best|i'?m delighted|i hope this (message|proposal|email) finds you)\b|sayın yetkili|ben bu işin uzman|en iyisiyim/i;

// Düzenlenmemiş şablon/placeholder kalıntısı.
const PLACEHOLDER_RE = /\{[^}]*\}|\[[^\]]*\]|\bx{3,}\b|lorem ipsum|<[a-z_]+>/i;

/**
 * Teklif ilandan somut detay içeriyor mu? İlanın anahtar terimlerinden (beceri/araç/
 * teknoloji) EN AZ BİRİ teklifte geçmeli. İlan yeterli sinyal taşıyorsa (≥3 terim) ve
 * teklif HİÇBİRİNİ atmıyorsa → jenerik/özgül-değil. İlan yoksa/az sinyalliyse kontrol atlanır.
 */
function lacksSpecificity(proposal: string, jobDescription: string): boolean {
  const jobKeywords = extractKeywordsFromText(jobDescription);
  if (jobKeywords.length < 3) return false; // ilan zayıf sinyalli → adil değil
  const lower = ` ${proposal.toLowerCase()} `;
  const hit = jobKeywords.some((k) => lower.includes(k.toLowerCase()));
  return !hit;
}

/** Üretilen teklifi deterministik olarak değerlendirir. Boş metin → weak/skor 0.
 * jobDescription verilirse özgüllük (ilandan somut detay atfı) boyutu da denetlenir. */
export function assessProposal(
  text: string,
  length: ProposalLength = "standard",
  jobDescription?: string,
): ProposalQuality {
  const clean = (text ?? "").trim();
  const wordCount = clean ? clean.split(/\s+/).length : 0;
  const issues: QualityIssue[] = [];

  const [min, max] = RANGES[length];
  if (wordCount < min) issues.push("wordCountLow");
  else if (wordCount > max) issues.push("wordCountHigh");

  if (!CTA_RE.test(clean)) issues.push("noCta");
  if (GENERIC_RE.test(clean)) issues.push("generic");
  if (PLACEHOLDER_RE.test(clean)) issues.push("placeholder");
  if (clean && jobDescription && lacksSpecificity(clean, jobDescription)) issues.push("notSpecific");

  const score = clean ? Math.max(0, 100 - issues.length * 20) : 0;
  const band: QualityBand =
    score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "weak";

  return { score, band, wordCount, issues };
}
