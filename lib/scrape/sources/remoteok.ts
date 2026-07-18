// RemoteOK ücretsiz JSON API adaptörü. ToS: kaynağa (ilan URL'ine) dofollow
// link + "Remote OK" adının anılması gerekir — ilan url alanı zaten RemoteOK'a
// gider, UI'da kaynak rozeti gösterilir. Dizinin İLK elemanı legal-notice
// objesidir (id/position yok) → şema doğal reddeder, özel kod gerekmez.
// fetch() ağ yapar; normalizeRemoteOK() saf (test edilebilir).
import { z } from "zod";
import { htmlToText } from "@/lib/import/text";
import { inferJobTypeFromTags } from "@/lib/scrape/job-type";
import type { PoolJobUpsert, ScrapeSource } from "@/lib/scrape/types";

const REMOTEOK_URL = "https://remoteok.com/api";

// RemoteOK tek ilan şeması (yalnız kullandığımız alanlar; fazlası yok sayılır).
// salary_min/max bilinmiyorsa 0 gelir → budget null.
const remoteOkJobSchema = z.object({
  id: z.union([z.number(), z.string()]),
  position: z.string(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
});

// Yıllık USD aralığını kısa metne çevirir ("$40k-60k/yr"); veri yoksa null.
function formatSalary(min?: number, max?: number): string | null {
  const lo = min && min > 0 ? min : null;
  const hi = max && max > 0 ? max : null;
  if (lo == null && hi == null) return null;
  const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  if (lo != null && hi != null) return `$${k(lo)}-${k(hi)}/yr`;
  return `$${k((lo ?? hi) as number)}/yr`;
}

export function normalizeRemoteOK(raw: unknown): PoolJobUpsert | null {
  const parsed = remoteOkJobSchema.safeParse(raw);
  if (!parsed.success) return null;
  const j = parsed.data;
  // location düzensiz gelebilir ("Freeport Ridge Estate, ") — kuyruğu kırp.
  const location = (j.location ?? "").replace(/[,\s]+$/, "").trim();
  return {
    source: "remoteok",
    external_id: String(j.id),
    title: j.position,
    description: htmlToText(j.description ?? ""),
    url: j.url ?? null,
    budget: formatSalary(j.salary_min, j.salary_max),
    skills: j.tags ?? [],
    client_country: location || null,
    client_spent: null,
    posted_at: j.date ?? null,
    // RemoteOK ayrı job_type alanı vermez → tags'te ipucu (contract/freelance) varsa çıkar.
    job_type: inferJobTypeFromTags(j.tags),
  };
}

async function fetchRemoteOK(): Promise<unknown[]> {
  // RemoteOK varsayılan fetch UA'sını bazen engelliyor → tarayıcı-benzeri UA.
  const res = await fetch(REMOTEOK_URL, {
    headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!res.ok) throw new Error(`RemoteOK HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? data : [];
}

export const remoteOkSource: ScrapeSource = {
  id: "remoteok",
  fetch: fetchRemoteOK,
  normalize: normalizeRemoteOK,
};
