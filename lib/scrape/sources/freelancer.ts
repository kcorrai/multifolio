// Freelancer.com resmî API adaptörü — TEK ToS-temiz freelance gig feed'i
// (developers.freelancer.com; scrape yasak → yalnız API). ENV-GATED:
// FREELANCER_OAUTH_TOKEN yoksa orchestrator bu kaynağı hiç eklemez.
// fetch() ağ yapar; normalizeFreelancer() + isDevDesign() saf (test edilebilir).
//
// Auth: header `freelancer-oauth-v1: <token>` (OAuth2; public listeleme için bile şart).
// Endpoint: GET /api/projects/0.1/projects/active/ → { result: { projects: [...] } }.
// Kitleye uygunluk (Himalayas firehose dersi): Freelancer TÜM kategorileri döndürür
// (veri girişi, yazı, çeviri...) → yazılım/tasarım DIŞI projeler kategori adından elenir
// (job_details=true her job'a category{id,name} verir). Skill-ID tahmini YOK — ID kaymasına
// dayanıklı kategori-adı allowlist'i.
import { z } from "zod";
import { htmlToText } from "@/lib/import/text";
import type { PoolJobUpsert, ScrapeSource } from "@/lib/scrape/types";

const DEFAULT_BASE = "https://www.freelancer.com";
const ACTIVE_PROJECTS_PATH =
  "/api/projects/0.1/projects/active/?limit=100&job_details=true&full_description=true";

export function isFreelancerConfigured(): boolean {
  return !!process.env.FREELANCER_OAUTH_TOKEN;
}

// Yazılım + tasarım üst kategorileri (Freelancer "Skills" kategori adları — stabil).
// Kategori adı bu anahtarlardan birini içeriyorsa proje kitleye uygundur.
const DEV_DESIGN_CATEGORY_HINTS = [
  "software", "it &", "web", "mobile phones & computing",
  "design, media", "graphic", "engineering & science",
];

const jobSchema = z.object({
  name: z.string().optional(),
  category: z.object({ name: z.string().optional() }).optional(),
});

const projectSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  seo_url: z.string().optional(),
  type: z.string().optional(), // "fixed" | "hourly"
  preview_description: z.string().optional(),
  description: z.string().optional(),
  time_submitted: z.number().optional(),
  submitdate: z.number().optional(),
  currency: z.object({ code: z.string().optional(), sign: z.string().optional() }).optional(),
  budget: z.object({ minimum: z.number().optional(), maximum: z.number().optional() }).optional(),
  jobs: z.array(jobSchema).optional(),
});

type FreelancerJob = z.infer<typeof jobSchema>;

/** Projenin becerilerinden en az biri yazılım/tasarım kategorisinde mi? Kategori bilgisi
 *  hiç yoksa lenient (tut — nadir); bilgi VARSA en az bir dev/design kategorisi şart. */
export function isDevDesign(jobs: FreelancerJob[] | undefined): boolean {
  const cats = (jobs ?? [])
    .map((j) => j.category?.name?.toLowerCase().trim())
    .filter((n): n is string => !!n);
  if (cats.length === 0) return true;
  return cats.some((name) => DEV_DESIGN_CATEGORY_HINTS.some((h) => name.includes(h)));
}

/** Bütçe aralığını kısa metne çevirir ("$250-750", hourly → "$25-50/hr"); min/max yok/0 → null. */
function formatBudget(
  min: number | undefined,
  max: number | undefined,
  sign: string | undefined,
  type: string | undefined,
): string | null {
  const lo = min && min > 0 ? min : null;
  const hi = max && max > 0 ? max : null;
  if (lo == null && hi == null) return null;
  const s = sign || "$";
  const suffix = type === "hourly" ? "/hr" : "";
  const range = lo != null && hi != null ? `${s}${lo}-${hi}` : `${s}${(lo ?? hi) as number}`;
  return `${range}${suffix}`;
}

export function normalizeFreelancer(raw: unknown): PoolJobUpsert | null {
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return null;
  const p = parsed.data;
  // Kitle DIŞI kategori (veri girişi/yazı/çeviri...) → atla (feed alaka koruması).
  if (!isDevDesign(p.jobs)) return null;
  const submitted = p.time_submitted ?? p.submitdate ?? null;
  return {
    source: "freelancer",
    external_id: String(p.id),
    title: p.title,
    description: htmlToText(p.description ?? p.preview_description ?? ""),
    url: p.seo_url ? `${DEFAULT_BASE}/projects/${p.seo_url}` : null,
    budget: formatBudget(p.budget?.minimum, p.budget?.maximum, p.currency?.sign, p.type),
    skills: (p.jobs ?? []).map((j) => j.name).filter((n): n is string => !!n),
    client_country: null,
    client_spent: null,
    posted_at: submitted != null ? new Date(submitted * 1000).toISOString() : null,
    // Tüm Freelancer projeleri freelance gig → istihdam-türü rozeti/filtresi bunu gösterir.
    job_type: "freelance",
  };
}

async function fetchFreelancer(): Promise<unknown[]> {
  const token = process.env.FREELANCER_OAUTH_TOKEN;
  if (!token) throw new Error("Freelancer not configured (FREELANCER_OAUTH_TOKEN yok)");
  const base = process.env.FREELANCER_API_BASE || DEFAULT_BASE;
  const res = await fetch(`${base}${ACTIVE_PROJECTS_PATH}`, {
    headers: { accept: "application/json", "freelancer-oauth-v1": token },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Freelancer HTTP ${res.status}`);
  const data = (await res.json()) as { result?: { projects?: unknown[] } };
  return Array.isArray(data.result?.projects) ? data.result.projects : [];
}

export const freelancerSource: ScrapeSource = {
  id: "freelancer",
  fetch: fetchFreelancer,
  normalize: normalizeFreelancer,
};
