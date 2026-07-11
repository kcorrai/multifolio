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

// Kaç EŞLEŞEN skill'de sinyal tam sayılır (doygunluk hedefi). Bu kadar profil skill'i
// ilanda geçiyorsa oran düşük olsa bile ilan güçlü alakalıdır (broad-skill telafisi).
const SKILL_SATURATION = 4;

/** Profil ile ilan arasındaki alaka skoru (0-100). Deterministik, ücretsiz.
 *  Profilde skill yoksa null (sinyal yetersiz → çağıran sıralama/eleme yapmaz).
 *  Temel sinyal skill eşleşmesi (oran VEYA mutlak sayı doygunluğu — hangisi yüksekse);
 *  başlık/rol örtüşmesi yalnız YUKARI çarpan bonus (eşleşmemesi cezalandırmaz). */
export function jobRelevance(profile: RelevanceProfile, job: PoolJobRow): number | null {
  const profSkills = (profile.skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (profSkills.length === 0) return null;

  const profHeadline = tokenize(profile.headline ?? "");

  // İlan tarafı: skill'ler (güçlü sinyal) + başlık(lar) + açıklamanın ilk kısmı.
  const jobSkillSet = skillTokens(job.skills ?? []);
  const jobTitleTokens = tokenize(
    [job.title, job.title_en ?? "", job.title_tr ?? ""].join(" "),
  );
  const jobDescTokens = tokenize((job.description ?? "").slice(0, 600));

  // (1) Kaç profil SKILL'i ilanda (skill VEYA başlık VEYA metin) geçiyor — token değil,
  // skill bazında (çok kelimeli skill tek eşleşme sayılır, sayımı şişirmez).
  let matched = 0;
  for (const skill of profSkills) {
    let hit = false;
    for (const tk of skillTokens([skill])) {
      if (jobSkillSet.has(tk) || jobTitleTokens.has(tk) || jobDescTokens.has(tk)) {
        hit = true;
        break;
      }
    }
    if (hit) matched++;
  }
  // Oran (kapsama) VEYA mutlak eşleşme doygunluğu — hangisi yüksekse. Çok-becerili
  // profil, az sayıda GÜÇLÜ eşleşmede düşük orandan ötürü elenmesin (Dashboard P0).
  const coverage = matched / profSkills.length;
  const saturation = Math.min(1, matched / SKILL_SATURATION);
  const skillScore = Math.max(coverage, saturation);

  // (2) Rol/başlık örtüşmesi: SADECE yukarı çarpan bonus (max +30%).
  let titleHits = 0;
  for (const h of profHeadline) {
    if (jobTitleTokens.has(h) || jobSkillSet.has(h)) titleHits++;
  }
  const titleScore = profHeadline.size > 0 ? titleHits / profHeadline.size : 0;

  const score = skillScore * (1 + 0.3 * titleScore);
  return Math.round(Math.min(1, score) * 100);
}

/** Near-duplicate başlık anahtarı: aynı ilanın farklı şehirde/cinsiyet-işaretiyle
 *  tekrarını yakalamak için başlığı normalize eder (JOBS-FLOWS P1). Cinsiyet işaretleri
 *  ((m/w/d), (f/m/x), (all genders)...) + sondaki konum kuyruğu (" in Waghäusel",
 *  " - Berlin", ", München") atılır; kalan alfanumerik token'lar anahtardır.
 *  Konum soyma yalnız kalanda ≥2 anlamlı token varsa uygulanır (aşırı birleşmeyi önler). */
export function nearDuplicateKey(title: string): string {
  let t = title.toLowerCase();
  // Cinsiyet/çeşitlilik işaretleri: (m/w/d), (w/m/d), (m/f/x), (all genders), (d/f/m)...
  t = t.replace(/\((?:[mwfdx](?:\s*\/\s*[mwfdx])+|all genders?|any gender)\)/g, " ");
  // Sondaki konum kuyruğu: " in <yer>", " - <yer>", " – <yer>", ", <yer>" (son segment).
  const stripped = t.replace(/\s*(?:\bin\b|[-–,])\s+[a-zäöüß.\s/()]+$/i, " ");
  const core = tokenize(stripped);
  const full = tokenize(t);
  // Konum soyma çok agresifse (kalan <2 token) soymadan önceki başlığı kullan.
  const useCore = core.size >= 2 ? core : full;
  return [...useCore].sort().join(" ");
}

/** Near-duplicate ilanları tekilleştirir: aynı normalize başlık anahtarı → İLK görülen
 *  kalır (çağıran zaten alakaya/tarihe göre sıraladıysa en iyi/en yeni kopya tutulur).
 *  Anahtar boşsa (başlık token vermezse) satır aynen geçer — yanlış birleştirme yapmaz. */
export function dedupeNearDuplicates(pool: PoolJobRow[]): PoolJobRow[] {
  const seen = new Set<string>();
  const out: PoolJobRow[] = [];
  for (const row of pool) {
    const key = nearDuplicateKey(row.title_en ?? row.title);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    out.push(row);
  }
  return out;
}

// Alaka eşikleri (UI + eleme davranışı için ortak).
export const RELEVANCE_MIN_SIGNAL_SKILLS = 3; // altında sinyal zayıf → eleme/sıralama uygulanmaz
export const RELEVANCE_HIDE_BELOW = 8;         // varsayılan feed'de bu skorun altını gizle
export const RELEVANCE_WARN_BELOW = 20;        // skorlama öncesi "pek uymuyor" uyarısı eşiği

/** Feedsiz varsayılan görünüm sıralaması: profil sinyali yeterliyse (≥3 skill)
 *  relevance DESC sırala + eşik altını ele; ELEME hepsini boşaltırsa en iyileri
 *  göster (asla boş feed). Sinyal zayıfsa gelen (kronolojik) sıra korunur. */
export function orderDefaultFeed(pool: PoolJobRow[], profile: RelevanceProfile): PoolJobRow[] {
  // Near-duplicate eleme sıralamadan ÖNCE değil SONRA anlamlı olurdu ama sıralama
  // kararlı; önce dedup edip sonra sıralamak en yüksek alakalı kopyayı garanti etmez.
  // Bu yüzden önce sırala, sonra dedup (ilk = en yüksek alaka kopya kalır).
  const skillCount = (profile.skills ?? []).filter((s) => s.trim()).length;
  if (skillCount < RELEVANCE_MIN_SIGNAL_SKILLS) return dedupeNearDuplicates(pool);
  const ranked = pool
    .map((row) => ({ row, rel: jobRelevance(profile, row) ?? 0 }))
    .sort((a, b) => b.rel - a.rel);
  const filtered = ranked.filter((x) => x.rel >= RELEVANCE_HIDE_BELOW);
  return dedupeNearDuplicates((filtered.length > 0 ? filtered : ranked).map((x) => x.row));
}
