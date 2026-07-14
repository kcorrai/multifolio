// Profil güç/optimizasyon skoru (SAF, kredisiz, deterministik). Kanıta dayalı freelance
// profil kurallarını denetler: başlıkta anahtar kelime (aramada bulunma), güçlü açılış
// (platformlar ilk satırları gösterir), somut kanıt (rakam), yeterli beceri, klişe yok.
// Vollna/UpHunt "profil audit" farklılaştırıcısı — ama kredisiz + anlık. UI checklist gösterir.
import { extractKeywordsFromText } from "@/lib/cv/keywords";

export type ProfileCheckId =
  | "headlinePresent"
  | "headlineLength"
  | "headlineKeyword"
  | "summaryLength"
  | "summaryHook"
  | "summaryQuantified"
  | "skillsCount"
  | "noCliche";

export interface ProfileCheck {
  id: ProfileCheckId;
  passed: boolean;
  weight: number; // skor katkısı (toplam 100)
}

export interface ProfileStrength {
  score: number; // 0-100
  band: "strong" | "good" | "fair" | "weak";
  checks: ProfileCheck[];
}

export interface ProfileStrengthInput {
  headline: string;
  summary: string;
  skills: string[];
}

// Somut kanıt sinyali (rakam/%/para/çarpan). ats.ts QUANTIFIED_RE ile aynı dünya.
const QUANTIFIED_RE = /\d|%|\$|₺|€|£/;
// Freelance profillerinde en sık klişeler (yüksek hassasiyet — net kötü kalıplar).
const CLICHE_RE =
  /\b(hard[-\s]?working|team player|detail[-\s]?oriented|self[-\s]?motivated|go[-\s]?getter|results[-\s]?driven|passionate professional|think outside the box|jack of all trades|100% satisfaction|best quality|world[-\s]?class)\b/i;

/** İlk cümle (hook) — nokta/satır sonuna kadar. Platformlar bunu önizlemede gösterir. */
function firstSentence(text: string): string {
  const m = text.trim().match(/^[^.!?\n]{1,400}/);
  return (m ? m[0] : text.trim()).trim();
}

/**
 * Çekirdek profilin güç skorunu deterministik hesaplar + hangi kuralın geçtiğini döner
 * (UI actionable checklist). Platform-bağımsız — evrensel freelance profil sinyalleri.
 */
export function assessProfileStrength(profile: ProfileStrengthInput): ProfileStrength {
  const headline = (profile.headline ?? "").trim();
  const summary = (profile.summary ?? "").trim();
  const skills = (profile.skills ?? []).filter((s) => s.trim());

  const headlineKeywords = headline ? extractKeywordsFromText(headline) : [];
  const hook = summary ? firstSentence(summary) : "";

  const checks: ProfileCheck[] = [
    // Başlık var mı (arama + önizlemenin en kritik alanı).
    { id: "headlinePresent", passed: headline.length > 0, weight: 15 },
    // Başlık uzunluğu makul (çok kısa = zayıf; çok uzun = kesilir).
    { id: "headlineLength", passed: headline.length >= 20 && headline.length <= 120, weight: 10 },
    // Başlıkta aranabilir beceri/teknoloji anahtar kelimesi (profil bununla bulunur).
    { id: "headlineKeyword", passed: headlineKeywords.length >= 1, weight: 15 },
    // Özet yeterince dolu.
    { id: "summaryLength", passed: summary.length >= 120, weight: 15 },
    // Güçlü açılış: ilk cümle kısa ve öz (~160 karakter — hook önizlemede görünür).
    { id: "summaryHook", passed: hook.length > 0 && hook.length <= 160, weight: 10 },
    // Somut kanıt: özette en az bir rakam/metrik (jenerik övgü değil).
    { id: "summaryQuantified", passed: QUANTIFIED_RE.test(summary), weight: 15 },
    // Yeterli beceri (LinkedIn 3 pin, Upwork eşleşme → ≥5 sağlıklı).
    { id: "skillsCount", passed: skills.length >= 5, weight: 10 },
    // Klişe yok (recruiter'lar jenerik ifadeleri eler).
    { id: "noCliche", passed: !CLICHE_RE.test(`${headline} ${summary}`), weight: 5 },
  ];

  const score = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  const band: ProfileStrength["band"] =
    score >= 85 ? "strong" : score >= 65 ? "good" : score >= 40 ? "fair" : "weak";

  return { score, band, checks };
}
