// Arbeitnow ücretsiz açık job-board API adaptörü. fetch() ağ; normalize saf.
// Alan adları gerçek cevapla doğrulandı: slug/title/description/url/tags/location/created_at (unix sn).
import { z } from "zod";
import { htmlToText } from "@/lib/import/text";
import type { PoolJobUpsert, ScrapeSource } from "@/lib/scrape/types";

const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";

const arbeitnowJobSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  created_at: z.number().optional(),
});

export function normalizeArbeitnow(raw: unknown): PoolJobUpsert | null {
  const parsed = arbeitnowJobSchema.safeParse(raw);
  if (!parsed.success) return null;
  const j = parsed.data;
  return {
    source: "arbeitnow",
    external_id: j.slug,
    title: j.title,
    description: htmlToText(j.description ?? ""),
    url: j.url ?? null,
    budget: null,
    skills: j.tags ?? [],
    client_country: j.location && j.location.trim() ? j.location : null,
    client_spent: null,
    posted_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
  };
}

async function fetchArbeitnow(): Promise<unknown[]> {
  const res = await fetch(ARBEITNOW_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Arbeitnow HTTP ${res.status}`);
  const data = (await res.json()) as { data?: unknown[] };
  return Array.isArray(data.data) ? data.data : [];
}

export const arbeitnowSource: ScrapeSource = {
  id: "arbeitnow",
  fetch: fetchArbeitnow,
  normalize: normalizeArbeitnow,
};
