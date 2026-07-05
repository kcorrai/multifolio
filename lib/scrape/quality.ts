// Scrape kalite süzgeci (SAF): ücretsiz iş API'leri (özellikle RemoteOK, kategori
// filtresi YOK) çöp/spam ilan + kalıplaşmış (boilerplate) çöp etiket döndürür.
// Bu ikisi feed'i kirletir VE relevance motorunu bozar (herkes ortak "design"
// etiketine eşleşir). Burada job_pool'a yazmadan önce temizlenir. AI/kredi YOK,
// deterministik + test edilebilir. runScrape orchestrator uygular.

// Açıkça spam/alakasız başlıklar → ilan hiç eklenmez. Yüksek kesinlik hedeflenir
// (meşru yazılım/tasarım ilanını elememeli). RemoteOK gözlemiyle seçildi:
// "Online Casino Game Tester", "All Positions", "Jobs", "File Clerk", "Data Entry...".
const JUNK_TITLE_PATTERNS: RegExp[] = [
  /\b(casino|gambling|betting|sportsbook|forex|binary\s*option|airdrop|escort|adult\s+content)\b/i,
  /\b(data\s*entry|file\s*clerk|form\s*filling|typing\s*job|copy[-\s]?paste\s*job|reshipping|package\s*handler|envelope\s*stuffing|mystery\s*shopper)\b/i,
];

// Tamamı jenerik/boş "başlık" (gerçek ilan değil) — tam eşleşme.
const GENERIC_TITLES = new Set([
  "jobs", "job", "all positions", "various positions", "multiple positions",
  "open positions", "other", "general", "n/a", "position",
]);

export function isJunkTitle(title: string): boolean {
  const t = (title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return true;
  if (GENERIC_TITLES.has(t)) return true;
  return JUNK_TITLE_PATTERNS.some((re) => re.test(t));
}

// Aynı TAM etiket setini birden çok ilanın paylaşması = kaynağın kalıp/çöp etiketi
// (gerçek per-ilan beceri değil). Bu setler relevance'ı bozar → skills'i boşaltırız
// (relevance başlık eşleşmesine düşer). Eşik: minShared farklı ilan aynı seti taşırsa.
function tagSignature(skills: string[]): string {
  return skills.map((s) => s.toLowerCase().trim()).filter(Boolean).sort().join("|");
}

export function stripBoilerplateTags<T extends { skills: string[] }>(rows: T[], minShared = 3): T[] {
  const freq = new Map<string, number>();
  for (const r of rows) {
    if (r.skills.length === 0) continue;
    const sig = tagSignature(r.skills);
    if (!sig) continue;
    freq.set(sig, (freq.get(sig) ?? 0) + 1);
  }
  return rows.map((r) => {
    if (r.skills.length === 0) return r;
    const sig = tagSignature(r.skills);
    return sig && (freq.get(sig) ?? 0) >= minShared ? { ...r, skills: [] } : r;
  });
}

// Tek geçişte: ÖNCE kalıp etiketleri temizle (frekans tüm ilanlardan sayılır —
// çöp ilanlar da kalıbı kanıtlar), SONRA çöp başlıkları ele.
export function cleanScrapedRows<T extends { title: string; skills: string[] }>(rows: T[]): T[] {
  return stripBoilerplateTags(rows).filter((r) => !isJunkTitle(r.title));
}
