// Profil başlığı optimize edici (SAF, AI/API/kredi yok): freelance başlığını
// deterministik kriterlere göre puanlar. Tamamen istemcide. EN+TR desen tanıma.
// Kriterler: uzunluk, spesifik rol/beceri, sonuç/değer sözcüğü, klişe yok.

export type HeadlineCheckId = "length" | "role" | "outcome" | "noBuzzwords";

export interface HeadlineCheckItem {
  id: HeadlineCheckId;
  passed: boolean;
  weight: number;
}

export interface HeadlineReport {
  charCount: number;
  checks: HeadlineCheckItem[];
  buzzwordsFound: string[];
  score: number;
  verdict: "strong" | "ok" | "weak";
}

const WEIGHTS: Record<HeadlineCheckId, number> = {
  length: 20,
  role: 30,
  outcome: 30,
  noBuzzwords: 20,
};

// Rol / beceri sözcükleri (EN+TR) — "freelancer" tek başına yetmez, somut rol/teknoloji.
const ROLE_RE = /\b(developer|engineer|designer|writer|copywriter|marketer|consultant|editor|illustrator|animator|strategist|analyst|architect|manager|specialist|photographer|videographer|translator|react|next\.?js|node|python|shopify|webflow|figma|ui|ux|seo|geli[şs]tirici|m[üu]hendis|tasar[ıi]mc[ıi]|yazar|dan[ıi][şs]man|edit[öo]r|pazarlamac[ıi]|stratejist|analist|mimar|[çc]evirmen|foto[ğg]raf[çc][ıi])\b/i;

// Sonuç / değer sözcükleri (EN+TR) — ne teslim ettiğini gösterir.
const OUTCOME_RE = /\b(help|helping|build|building|grow|growing|ship|shipping|increase|reduce|boost|convert|launch|scale|create|design|develop|write|optimize|drive|deliver|turn|yard[ıi]m|b[üu]y[üu]t|art[ıi]r|azalt|d[öo]n[üu][şs]t[üu]r|olu[şs]tur|tasarla|geli[şs]tir|teslim|[öo]l[çc]ekle|kazand[ıi]r)\w*/i;

// Klişe / şişirme sözcükler (EN+TR) — bulunması güveni düşürür.
const BUZZWORDS = [
  "ninja", "guru", "rockstar", "rock star", "wizard", "superstar", "passionate",
  "hardworking", "hard-working", "hard working", "hustler", "unicorn", "genius",
  "expert freelancer", "results-driven", "detail-oriented",
  "tutkulu", "çalışkan", "azimli", "işkolik", "efsane", "sihirbaz",
];

export function scoreHeadline(input: string): HeadlineReport {
  const text = (input || "").trim();
  const charCount = text.length;
  const lower = text.toLowerCase();
  const has = charCount >= 3;

  const buzzwordsFound = BUZZWORDS.filter((b) => lower.includes(b));

  const checks: HeadlineCheckItem[] = [
    { id: "length", passed: has && charCount >= 20 && charCount <= 90, weight: WEIGHTS.length },
    { id: "role", passed: has && ROLE_RE.test(text), weight: WEIGHTS.role },
    { id: "outcome", passed: has && OUTCOME_RE.test(text), weight: WEIGHTS.outcome },
    { id: "noBuzzwords", passed: has && buzzwordsFound.length === 0, weight: WEIGHTS.noBuzzwords },
  ];

  const score = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0);
  const verdict: HeadlineReport["verdict"] = score >= 80 ? "strong" : score >= 50 ? "ok" : "weak";

  return { charCount, checks, buzzwordsFound, score, verdict };
}
