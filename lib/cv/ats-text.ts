// SAF ham-metin ATS denetleyicisi (AI/kredi/I/O YOK, vitest'li). Halka açık ücretsiz
// /ats-check aracı için: kullanıcı CV metnini yapıştırır → deterministik ATS uyum skoru
// + geçen/kalan kontroller + (opsiyonel ilan metni verilirse) anahtar kelime kapsamı.
// lib/cv/ats.ts yapılandırılmış CvContent ister; bu dosya ham metinle çalışır (regex).
// QUANTIFIED_RE / FILLER_RE ats.ts'ten yeniden kullanılır.
import { QUANTIFIED_RE, FILLER_RE } from "./ats";

export type ResumeCheckId =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "quantified"
  | "noFiller"
  | "dates"
  | "length"
  | "keywords";

export interface ResumeCheck {
  id: ResumeCheckId;
  passed: boolean;
}

export interface ResumeAtsResult {
  score: number; // 0-100
  verdict: "strong" | "average" | "weak";
  checks: ResumeCheck[];
  wordCount: number;
  quantifiedBullets: number;
  totalBullets: number;
  keywordCoverage: number | null; // ilan verilmişse 0-100, yoksa null
  missingKeywords: string[]; // ilanda geçip CV'de olmayan (ilk 12)
}

// Bölüm başlığı sezgi regex'leri (EN + TR).
const SECTION_RE = {
  summary: /\b(summary|profile|objective|about me)\b|özet|hakkımda|profil|kariyer hedefi/i,
  skills: /\b(skills|competenc|technolog|proficienc)\w*/i,
  experience: /\b(experience|employment|work history)\b|deneyim|iş geçmişi|çalışma geçmişi|iş tecrübesi/i,
  education: /\b(education|academic)\b|eğitim|öğrenim/i,
};
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
// En az ~8 rakamlı telefon dizisi (uluslararası biçimler dahil).
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const BULLET_RE = /^\s*[•\-*–●▪·]\s+/;

// Anahtar kelime çıkarımında elenen çok yaygın kelimeler (EN + TR mini stopword).
const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "who", "this", "that",
  "have", "has", "was", "were", "from", "not", "but", "all", "can", "must", "should", "able",
  "job", "role", "team", "work", "working", "experience", "years", "year", "plus", "etc",
  "ve", "ile", "için", "bir", "bu", "olan", "gibi", "veya", "ya", "da", "de", "en", "çok",
  "iş", "işi", "deneyim", "yıl", "takım", "ekip",
]);

const norm = (s: string) => s.trim().toLowerCase();

// Serbest metinden aday anahtar kelime kümesi (ilan → beklenen terimler).
function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9çğıöşü+#.]+/i)
    .map((t) => t.replace(/^[.]+|[.]+$/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
  return Array.from(new Set(tokens)).slice(0, 40);
}

/**
 * Ham CV metnini ATS uyumu açısından puanlar. jobText verilirse anahtar kelime kapsamı
 * boyutu da eklenir (verilmezse o boyut hariç, kalan ağırlıklar yeniden ölçeklenir).
 */
export function scoreResumeText(rawText: string, jobText = ""): ResumeAtsResult {
  const text = rawText ?? "";
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Madde işaretleri (bullet). Yoksa "cümle satırları"na düş (tek başına anlamlı satır).
  const bulletLines = lines.filter((l) => BULLET_RE.test(l));
  const contentLines = lines.map((l) => l.trim()).filter((l) => l.length >= 20);
  const bullets = bulletLines.length > 0 ? bulletLines : contentLines;
  const totalBullets = bullets.length;
  const quantifiedBullets = bullets.filter((b) => QUANTIFIED_RE.test(b)).length;
  const fillerBullets = bullets.filter((b) => FILLER_RE.test(b)).length;

  // Boyut alt-skorları (0..1) — her biri bir "check".
  const hasEmail = EMAIL_RE.test(text);
  const hasPhone = PHONE_RE.test(text);
  const contact = (hasEmail ? 0.7 : 0) + (hasPhone ? 0.3 : 0);

  const hasSummary = SECTION_RE.summary.test(lower);
  const hasSkills = SECTION_RE.skills.test(lower);
  const hasExperience = SECTION_RE.experience.test(lower);
  const hasEducation = SECTION_RE.education.test(lower);

  const quantRatio = totalBullets ? quantifiedBullets / totalBullets : 0;
  const quantified = totalBullets ? Math.min(1, quantRatio / 0.5) : 0; // %50 hedef → tam puan
  const noFiller = totalBullets ? Math.max(0, 1 - fillerBullets / totalBullets) : 1;
  const hasDates = YEAR_RE.test(text);

  // Uzunluk: ~200-900 kelime ideal ATS aralığı; çok kısa/uzun ceza.
  const length = wordCount >= 200 && wordCount <= 900 ? 1 : wordCount >= 120 && wordCount <= 1200 ? 0.6 : wordCount >= 60 ? 0.3 : 0;

  // Anahtar kelime kapsamı (opsiyonel).
  let keywordCoverage: number | null = null;
  let keyword = 0;
  let missingKeywords: string[] = [];
  const kws = extractKeywords(jobText);
  if (kws.length > 0) {
    const resume = norm(text);
    const matched = kws.filter((k) => resume.includes(k));
    const missing = kws.filter((k) => !resume.includes(k));
    const ratio = matched.length / kws.length;
    keywordCoverage = Math.round(ratio * 100);
    keyword = ratio;
    missingKeywords = missing.slice(0, 12);
  }

  // Ağırlıklı toplam. Anahtar kelime yoksa o boyut hariç, kalanlar yeniden ölçeklenir.
  const base: [number, number][] = [
    [contact, 0.14],
    [hasSummary ? 1 : 0, 0.08],
    [hasSkills ? 1 : 0, 0.12],
    [hasExperience ? 1 : 0, 0.18],
    [hasEducation ? 1 : 0, 0.06],
    [quantified, 0.16],
    [noFiller, 0.08],
    [hasDates ? 1 : 0, 0.05],
    [length, 0.08],
  ];
  const dims = keywordCoverage === null ? base : [...base, [keyword, 0.15] as [number, number]];
  const totalWeight = dims.reduce((s, [, w]) => s + w, 0);
  const raw = totalWeight ? dims.reduce((s, [v, w]) => s + v * w, 0) / totalWeight : 0;
  const score = Math.min(100, Math.max(0, Math.round(raw * 100)));

  const checks: ResumeCheck[] = [
    { id: "contact", passed: hasEmail && hasPhone },
    { id: "summary", passed: hasSummary },
    { id: "skills", passed: hasSkills },
    { id: "experience", passed: hasExperience },
    { id: "education", passed: hasEducation },
    { id: "quantified", passed: totalBullets > 0 && quantRatio >= 0.3 },
    { id: "noFiller", passed: fillerBullets === 0 },
    { id: "dates", passed: hasDates },
    { id: "length", passed: length >= 0.6 },
  ];
  if (keywordCoverage !== null) {
    checks.push({ id: "keywords", passed: keywordCoverage >= 60 });
  }

  return {
    score,
    verdict: score >= 75 ? "strong" : score >= 50 ? "average" : "weak",
    checks,
    wordCount,
    quantifiedBullets,
    totalBullets,
    keywordCoverage,
    missingKeywords,
  };
}
