// Remotive ücretsiz JSON API adaptörü. Kısıt: günde ≤4 çekim, kaynağa link/kredi.
// fetch() ağ yapar; normalizeRemotive() saf (test edilebilir).
import { z } from "zod";
import { htmlToText } from "@/lib/import/text";
import type { PoolJobUpsert, ScrapeSource } from "@/lib/scrape/types";

// Kitleye (freelance yazılım + tasarım) uygun kategoriler — filtresiz firehose
// yerine yalnız alakalı ilanlar çekilir (feed alaka düzeltmesi, Dashboard P0-1).
const REMOTIVE_CATEGORIES = ["software-dev", "design"] as const;
const remotiveUrl = (category: string) =>
  `https://remotive.com/api/remote-jobs?category=${category}&limit=100`;

// Remotive tek ilan şeması (yalnız kullandığımız alanlar; fazlası yok sayılır).
const remotiveJobSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  salary: z.string().optional(),
  candidate_required_location: z.string().optional(),
  publication_date: z.string().optional(),
  description: z.string().optional(),
});

export function normalizeRemotive(raw: unknown): PoolJobUpsert | null {
  const parsed = remotiveJobSchema.safeParse(raw);
  if (!parsed.success) return null;
  const j = parsed.data;
  return {
    source: "remotive",
    external_id: String(j.id),
    title: j.title,
    description: htmlToText(j.description ?? ""),
    url: j.url ?? null,
    budget: j.salary && j.salary.trim() ? j.salary : null,
    skills: j.tags ?? [],
    client_country: j.candidate_required_location && j.candidate_required_location.trim()
      ? j.candidate_required_location : null,
    client_spent: null,
    posted_at: j.publication_date ?? null,
  };
}

async function fetchOne(category: string): Promise<unknown[]> {
  const res = await fetch(remotiveUrl(category), { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Remotive HTTP ${res.status} (${category})`);
  const data = (await res.json()) as { jobs?: unknown[] };
  return Array.isArray(data.jobs) ? data.jobs : [];
}

async function fetchRemotive(): Promise<unknown[]> {
  // Kategori bazlı çekimler birleşir (dedup upsert'te). allSettled: bir kategori
  // Remotive rate-limit'ine (≤4/gün) takılsa da diğeri yine gelir — hepsi patlamaz.
  const settled = await Promise.allSettled(REMOTIVE_CATEGORIES.map(fetchOne));
  const jobs = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  // İkisi de başarısızsa gerçek hatayı yüzeye çıkar (runScrape kaynağı 'error' loglar).
  if (jobs.length === 0) {
    const firstErr = settled.find((s): s is PromiseRejectedResult => s.status === "rejected");
    if (firstErr) throw firstErr.reason;
  }
  return jobs;
}

export const remotiveSource: ScrapeSource = {
  id: "remotive",
  fetch: fetchRemotive,
  normalize: normalizeRemotive,
};
