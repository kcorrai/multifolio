// Ücretsiz profil × ilan alaka motoru (Dashboard P0-1/P0-2). SAF, AI YOK, kredi YOK.
// Amaç: varsayılan feed'i profile göre sıralamak/elemek ve skorlama öncesi kullanıcıyı
// bariz uymayan ilanlarda uyarmak. AI skorlaması (kredi) opsiyonel derinlik olarak kalır.
import type { PoolJobRow } from "@/lib/validation/schemas/feed";

export interface RelevanceProfile {
  headline: string | null;
  skills: string[] | null;
}

// Çok geçen ama alaka taşımayan kelimeler (gürültü) — token setinden atılır.
const STOP = new Set([
  "and", "or", "the", "a", "an", "for", "with", "of", "to", "in", "on", "at", "developer",
  "engineer", "senior", "junior", "lead", "remote", "ve", "veya", "ile", "için", "geliştirici",
]);

// Serbest metni normalize token setine çevirir (lowercase, alfanumerik, ≥2 char, stopword hariç).
function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#.]+/)) {
    const t = raw.replace(/^[.]+|[.]+$/g, "");
    if (t.length >= 2 && !STOP.has(t)) out.add(t);
  }
  return out;
}

// Skill listesini normalize eder (çok kelimeli skill'ler ayrı token'lara da açılır).
function skillTokens(skills: string[]): Set<string> {
  const out = new Set<string>();
  for (const s of skills) {
    const norm = s.trim().toLowerCase();
    if (!norm) continue;
    out.add(norm);
    for (const part of tokenize(norm)) out.add(part);
  }
  return out;
}

/** Profil ile ilan arasındaki alaka skoru (0-100). Deterministik, ücretsiz.
 *  Profilde skill yoksa null (sinyal yetersiz → çağıran sıralama/eleme yapmaz).
 *  Temel sinyal skill kesişimi; başlık/rol örtüşmesi yalnız YUKARI çarpan bonus
 *  (eşleşmemesi skoru cezalandırmaz — rol kelimeleri çoğu ilan başlığında birebir geçmez). */
export function jobRelevance(profile: RelevanceProfile, job: PoolJobRow): number | null {
  const profSkills = (profile.skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (profSkills.length === 0) return null;

  const profSkillSet = skillTokens(profSkills);
  const profHeadline = tokenize(profile.headline ?? "");

  // İlan tarafı: skill'ler (güçlü sinyal) + başlık(lar) + açıklamanın ilk kısmı.
  const jobSkillSet = skillTokens(job.skills ?? []);
  const jobTitleTokens = tokenize(
    [job.title, job.title_en ?? "", job.title_tr ?? ""].join(" "),
  );
  const jobDescTokens = tokenize((job.description ?? "").slice(0, 600));

  // (1) Temel: profil skill token'larının kaçı ilanda (skill VEYA başlık VEYA metin) geçiyor.
  let skillHits = 0;
  for (const s of profSkillSet) {
    if (jobSkillSet.has(s) || jobTitleTokens.has(s) || jobDescTokens.has(s)) skillHits++;
  }
  const skillScore = profSkillSet.size > 0 ? skillHits / profSkillSet.size : 0;

  // (2) Rol/başlık örtüşmesi: SADECE yukarı çarpan bonus (max +30%).
  let titleHits = 0;
  for (const h of profHeadline) {
    if (jobTitleTokens.has(h) || jobSkillSet.has(h)) titleHits++;
  }
  const titleScore = profHeadline.size > 0 ? titleHits / profHeadline.size : 0;

  const score = skillScore * (1 + 0.3 * titleScore);
  return Math.round(Math.min(1, score) * 100);
}

// Alaka eşikleri (UI + eleme davranışı için ortak).
export const RELEVANCE_MIN_SIGNAL_SKILLS = 3; // altında sinyal zayıf → eleme/sıralama uygulanmaz
export const RELEVANCE_HIDE_BELOW = 8;         // varsayılan feed'de bu skorun altını gizle
export const RELEVANCE_WARN_BELOW = 20;        // skorlama öncesi "pek uymuyor" uyarısı eşiği

/** Feedsiz varsayılan görünüm sıralaması: profil sinyali yeterliyse (≥3 skill)
 *  relevance DESC sırala + eşik altını ele; ELEME hepsini boşaltırsa en iyileri
 *  göster (asla boş feed). Sinyal zayıfsa gelen (kronolojik) sıra korunur. */
export function orderDefaultFeed(pool: PoolJobRow[], profile: RelevanceProfile): PoolJobRow[] {
  const skillCount = (profile.skills ?? []).filter((s) => s.trim()).length;
  if (skillCount < RELEVANCE_MIN_SIGNAL_SKILLS) return pool;
  const ranked = pool
    .map((row) => ({ row, rel: jobRelevance(profile, row) ?? 0 }))
    .sort((a, b) => b.rel - a.rel);
  const filtered = ranked.filter((x) => x.rel >= RELEVANCE_HIDE_BELOW);
  return (filtered.length > 0 ? filtered : ranked).map((x) => x.row);
}
