// Saf anahtar-kelime eşleştirme (AI/kredi YOK, deterministik). İlan metninden aday
// beceri/araç terimlerini çıkarır ve CV metnine karşı kapsar — "eksik anahtar kelime"
// sinyali (Teal/Rezi tarzı eşleşme %). Yaklaşıktır (lexicon + kısaltma); yüksek-kaliteli
// çıkarım AI tailor yolunda yapılır. İstemci de import eder (anlık, kredisiz panel).
import type { CvContent } from "@/lib/validation/schemas/cv";

// Çok-alanlı yaygın freelance beceri/araç sözlüğü (yazılım/tasarım/pazarlama/yazı/veri).
// Küçük harf kanonik; ilan metninde tam-kelime/ifade olarak aranır. Kapsamlı değil —
// düşük gürültülü, güvenilir sinyal hedefler. Kısaltmalar (ALLCAPS) ayrıca yakalanır.
const SKILL_LEXICON: readonly string[] = [
  // Yazılım / web
  "javascript", "typescript", "react", "next.js", "nextjs", "vue", "angular", "svelte",
  "node.js", "nodejs", "python", "django", "flask", "fastapi", "java", "spring", "kotlin",
  "swift", "objective-c", "go", "golang", "rust", "ruby", "rails", "php", "laravel",
  "c++", "c#", ".net", "graphql", "rest", "grpc", "html", "css", "sass", "tailwind",
  "redux", "webpack", "vite", "jest", "cypress", "playwright", "docker", "kubernetes",
  "terraform", "ansible", "aws", "azure", "gcp", "firebase", "supabase", "postgresql",
  "mysql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "microservices",
  "ci/cd", "git", "linux", "nginx", "serverless", "websocket", "oauth",
  // Veri / AI
  "sql", "pandas", "numpy", "spark", "hadoop", "airflow", "dbt", "tableau", "power bi",
  "looker", "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
  "nlp", "computer vision", "data analysis", "data engineering", "etl", "a/b testing",
  // Tasarım
  "figma", "sketch", "adobe xd", "photoshop", "illustrator", "indesign", "after effects",
  "premiere", "ui design", "ux design", "ux research", "wireframing", "prototyping",
  "design systems", "typography", "branding", "motion design", "3d", "blender",
  // Pazarlama / içerik
  "seo", "sem", "google ads", "facebook ads", "meta ads", "google analytics", "ga4",
  "content marketing", "copywriting", "email marketing", "hubspot", "mailchimp",
  "social media", "influencer", "ppc", "cro", "marketing automation", "salesforce",
  // Yazı / diğer
  "technical writing", "content strategy", "editing", "proofreading", "translation",
  "localization", "wordpress", "shopify", "webflow", "notion", "jira", "confluence",
  "agile", "scrum", "kanban", "project management", "product management", "stakeholder",
  "customer success", "account management", "video editing", "photography",
];

// Sözlükte tam kelime olarak aranan terimlerin regex'i (özel karakterler kaçışlı, en
// uzun önce → "next.js" "js"den önce eşleşir). Bir kez derlenir.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LEXICON_SORTED = [...SKILL_LEXICON].sort((a, b) => b.length - a.length);

// İçinde çok geçen ama beceri olmayan ALLCAPS kelimeler (çıkarımdan hariç).
const ACRONYM_STOP = new Set([
  "AND", "THE", "FOR", "YOU", "OUR", "ARE", "WITH", "WILL", "ALL", "NEW", "USA", "CEO",
  "CTO", "HR", "EU", "UK", "US", "PDF", "OK", "FAQ", "Q&A",
]);

// Ham ilan metninden aday anahtar kelimeler çıkarır (küçük harf normalize, tekilleştirilmiş).
export function extractKeywordsFromText(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found = new Set<string>();

  // 1) Sözlük ifadeleri (kelime sınırıyla).
  for (const term of LEXICON_SORTED) {
    const re = new RegExp(`(^|[^a-z0-9+.#])${escapeRe(term)}([^a-z0-9+.#]|$)`, "i");
    if (re.test(lower)) found.add(term);
  }

  // 2) Teknik kısaltmalar (2-6 harf ALLCAPS, ör. SQL/AWS/SEO/API) — ham metinden.
  const acronyms = text.match(/\b[A-Z][A-Z0-9]{1,5}\b/g) ?? [];
  for (const a of acronyms) {
    if (!ACRONYM_STOP.has(a)) found.add(a.toLowerCase());
  }

  return Array.from(found);
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
  coveragePct: number; // 0-100; anahtar kelime yoksa 0
}

// CV metninden kaba kelime kümesi (ats.ts contentText ile aynı mantık).
function cvText(cv: CvContent): string {
  return [
    cv.title,
    cv.summary,
    ...cv.skills.hard,
    ...cv.skills.soft,
    ...cv.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...cv.projects.flatMap((p) => [p.name, p.description, ...p.bullets]),
    ...cv.certifications.map((c) => c.name),
    ...cv.languages.map((l) => l.name),
  ]
    .join(" ")
    .toLowerCase();
}

// Prose olduğunu ele veren cümle işaretleri (başlık DEĞİL sinyali).
const PROSE_HINT = /[.!?]|,\s|\b(we|our|the|is|are|looking|seeking|join|about)\b/i;

/**
 * İlan metninden HEDEF İŞ UNVANINI çıkarır (best-effort). Kaynak sinyalleri:
 * (1) "Job Title:/Position:/Role:" öneki, (2) ilk anlamlı satır (kısa + az kelime +
 * prose değil). Güvenilir bir unvan bulunamazsa null. Birebir unvan CV'de olmak, ATS'te
 * en güçlü tek kaldıraç (Jobscan ~1M örneklem: 10.6x mülakat daveti) — bu yüzden ayrı sinyal.
 */
export function extractTargetTitle(jdText: string): string | null {
  const lines = jdText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // (1) Açık önek: "Job Title: X" / "Position: X" / "Role: X".
  for (const line of lines.slice(0, 8)) {
    const m = line.match(/^(?:job\s*title|position|role|title|pozisyon|unvan)\s*[:\-–]\s*(.+)$/i);
    if (m) {
      const cand = m[1].trim().replace(/[.;,]$/, "");
      if (cand.length >= 3 && cand.length <= 70 && cand.split(/\s+/).length <= 8) return cand;
    }
  }
  // (2) İlk anlamlı satır başlık gibi mi? (kısa, ≤8 kelime, prose işareti yok).
  const first = lines[0];
  if (!first) return null;
  if (first.length < 3 || first.length > 70) return null;
  if (first.split(/\s+/).length > 8) return null;
  if (PROSE_HINT.test(first)) return null;
  return first;
}

/** CV'nin başlığı veya bir deneyim rolü, hedef unvanı BİREBİR içeriyor mu (normalize). */
export function titlePresentInCv(cv: CvContent, targetTitle: string): boolean {
  const target = targetTitle.trim().toLowerCase();
  if (!target) return false;
  const hay = [cv.title, ...cv.experience.map((e) => e.role)]
    .filter(Boolean)
    .join(" | ")
    .toLowerCase();
  return hay.includes(target);
}

/** Verilen anahtar kelimelerin CV'de kapsanma durumunu döner (eşleşen/eksik/%). */
export function matchKeywords(cv: CvContent, keywords: string[]): KeywordMatch {
  const unique = Array.from(new Set(keywords.map((k) => k.trim().toLowerCase()).filter(Boolean)));
  if (unique.length === 0) return { matched: [], missing: [], coveragePct: 0 };

  const text = cvText(cv);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of unique) {
    // Kelime sınırıyla (kısmi kelime eşleşmesini önle: "go" → "google" değil).
    const re = new RegExp(`(^|[^a-z0-9+.#])${escapeRe(k)}([^a-z0-9+.#]|$)`, "i");
    if (re.test(text)) matched.push(k);
    else missing.push(k);
  }
  return {
    matched,
    missing,
    coveragePct: Math.round((matched.length / unique.length) * 100),
  };
}
