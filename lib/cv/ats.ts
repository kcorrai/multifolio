// Saf ATS (Applicant Tracking System) uyum skoru — AI/kredi YOK, deterministik.
// lib/analyze/score.ts + lib/health/scan.ts saf deseni: ağırlıklı boyut toplamı +
// kod bazlı bulgular (UI kodu i18n ile metne çevirir). İstemci de import eder (anlık skor).
import type { CvContent } from "@/lib/validation/schemas/cv";

export type AtsIssueCode =
  | "noName"
  | "noEmail"
  | "noPhone"
  | "noSummary"
  | "noSkills"
  | "noExperience"
  | "fewQuantified"
  | "fillerPhrases"
  | "inconsistentDates"
  | "lowKeywordCoverage";

export type AtsSeverity = "high" | "medium" | "low";

export interface AtsIssue {
  code: AtsIssueCode;
  severity: AtsSeverity;
}

export interface AtsResult {
  score: number; // 0-100
  issues: AtsIssue[];
  // İlan anahtar kelimeleri verildiyse kapsam yüzdesi (0-100); yoksa null.
  keywordCoverage: number | null;
}

// Nicelenmiş sonuç sinyali: rakam, yüzde, para, çarpan (2x), veya "k/m" ölçek.
const QUANTIFIED_RE = /\d|%|\$|₺|€|£/;
// Zayıf/dolgu ifadeler (EN + TR) — madde işaretinde geçmesi kaliteyi düşürür.
const FILLER_RE =
  /\b(responsible for|helped|assisted|worked on|duties included|tasked with)\b|sorumluydu|sorumluyum|yardımcı oldu|görev aldı|çalıştı(m|ğım)?/i;

const norm = (s: string) => s.trim().toLowerCase();

// Metinden kaba kelime kümesi (anahtar kelime kapsamı için).
function contentText(cv: CvContent): string {
  return [
    cv.title,
    cv.summary,
    ...cv.skills.hard,
    ...cv.skills.soft,
    ...cv.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...cv.projects.flatMap((p) => [p.name, p.description, ...p.bullets]),
    ...cv.certifications.map((c) => c.name),
  ]
    .join(" ")
    .toLowerCase();
}

function allBullets(cv: CvContent): string[] {
  return [...cv.experience.flatMap((e) => e.bullets), ...cv.projects.flatMap((p) => p.bullets)];
}

// Tarih tutarlılığı: dolu tarihlerin hepsi 4 haneli yıl içermeli (yoksa ATS yanlış boşluk sanar).
function datesConsistent(cv: CvContent): boolean {
  const dates = [
    ...cv.experience.flatMap((e) => [e.startDate, e.endDate]),
    ...cv.education.flatMap((e) => [e.startDate, e.endDate]),
  ].filter((d) => d.trim() && !/^(present|current|halen|devam)/i.test(d.trim()));
  if (dates.length === 0) return true;
  return dates.every((d) => /\d{4}/.test(d));
}

/**
 * CV'nin ATS uyum skorunu hesaplar. jobKeywords verilirse anahtar kelime kapsamı
 * boyutu da eklenir (ilana göre skor); verilmezse o boyut hariç tutulup yeniden ölçeklenir.
 */
export function scoreCv(cv: CvContent, jobKeywords?: string[]): AtsResult {
  const issues: AtsIssue[] = [];

  // Boyut alt-skorları (0..1).
  const hasName = cv.fullName.trim().length > 0;
  const hasEmail = cv.contact.email.trim().length > 0;
  const hasPhone = cv.contact.phone.trim().length > 0;
  const contact = (hasEmail ? 0.6 : 0) + (hasPhone ? 0.25 : 0) + (hasName ? 0.15 : 0);
  if (!hasName) issues.push({ code: "noName", severity: "medium" });
  if (!hasEmail) issues.push({ code: "noEmail", severity: "high" });
  else if (!hasPhone) issues.push({ code: "noPhone", severity: "low" });

  const summary = cv.summary.trim().length >= 60 ? 1 : cv.summary.trim().length > 0 ? 0.5 : 0;
  if (summary === 0) issues.push({ code: "noSummary", severity: "medium" });

  const hardCount = cv.skills.hard.filter((s) => s.trim()).length;
  const skills = hardCount >= 5 ? 1 : hardCount / 5;
  if (hardCount === 0) issues.push({ code: "noSkills", severity: "high" });

  const expCount = cv.experience.length;
  const projCount = cv.projects.length;
  const experience = expCount >= 2 ? 1 : expCount === 1 ? 0.7 : projCount >= 1 ? 0.5 : 0;
  if (expCount === 0 && projCount === 0) issues.push({ code: "noExperience", severity: "high" });

  const bullets = allBullets(cv).filter((b) => b.trim());
  const quantifiedCount = bullets.filter((b) => QUANTIFIED_RE.test(b)).length;
  const quantifiedRatio = bullets.length ? quantifiedCount / bullets.length : 0;
  const quantified = bullets.length ? Math.min(1, quantifiedRatio / 0.5) : 0; // %50 hedef → tam puan
  if (bullets.length > 0 && quantifiedRatio < 0.3) issues.push({ code: "fewQuantified", severity: "medium" });

  const fillerCount = bullets.filter((b) => FILLER_RE.test(b)).length;
  const filler = bullets.length ? Math.max(0, 1 - fillerCount / bullets.length) : 1;
  if (fillerCount > 0) issues.push({ code: "fillerPhrases", severity: "low" });

  const dates = datesConsistent(cv) ? 1 : 0;
  if (dates === 0) issues.push({ code: "inconsistentDates", severity: "low" });

  // Anahtar kelime kapsamı (opsiyonel).
  let keywordCoverage: number | null = null;
  let keyword = 0;
  const kw = (jobKeywords ?? []).map(norm).filter(Boolean);
  const uniqueKw = Array.from(new Set(kw));
  if (uniqueKw.length > 0) {
    const text = contentText(cv);
    const matched = uniqueKw.filter((k) => text.includes(k)).length;
    const ratio = matched / uniqueKw.length;
    keywordCoverage = Math.round(ratio * 100);
    keyword = ratio;
    if (ratio < 0.6) issues.push({ code: "lowKeywordCoverage", severity: "high" });
  }

  // Ağırlıklar. Anahtar kelime yoksa o boyut hariç, kalanlar yeniden ölçeklenir.
  const base: [number, number][] = [
    [contact, 0.12],
    [summary, 0.1],
    [skills, 0.13],
    [experience, 0.2],
    [quantified, 0.15],
    [filler, 0.1],
    [dates, 0.05],
  ];
  const dims = keywordCoverage === null ? base : [...base, [keyword, 0.15] as [number, number]];
  const totalWeight = dims.reduce((s, [, w]) => s + w, 0);
  const raw = dims.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
  const score = Math.min(100, Math.max(0, Math.round(raw * 100)));

  // Bulguları önem sırasına diz (high → low).
  const order: Record<AtsSeverity, number> = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  return { score, issues, keywordCoverage };
}

export function atsVerdict(score: number): "strong" | "average" | "weak" {
  if (score >= 75) return "strong";
  if (score >= 50) return "average";
  return "weak";
}
