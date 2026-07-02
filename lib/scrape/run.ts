// Alt-proje B — scrape orchestrator. Her kaynağı bağımsız çalıştırır (biri
// patlasa diğeri devam), geçerli ilanları job_pool'a upsert eder ve koşu
// özetini scrape_runs'a yazar. Service-role client'ı PARAMETRE olarak alır
// (import etmez) — bu yüzden saf/test-edilebilir kalır; "server-only" gerekmez.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PoolJobUpsert, ScrapeSource, ScrapeRunResult } from "@/lib/scrape/types";

async function runOne(admin: SupabaseClient, source: ScrapeSource): Promise<ScrapeRunResult> {
  const started = Date.now();
  const base = { source: source.id, fetched: 0, upserted: 0, skipped: 0 };
  try {
    const raw = await source.fetch();
    const rows: PoolJobUpsert[] = [];
    for (const item of raw) {
      const norm = source.normalize(item);
      if (norm) rows.push(norm);
    }
    const fetched = raw.length;
    const skipped = fetched - rows.length;

    if (rows.length > 0) {
      const { error } = await admin.from("job_pool").upsert(rows, { onConflict: "source,external_id" });
      if (error) throw error;
    }

    const result: ScrapeRunResult = { ...base, fetched, upserted: rows.length, skipped, error: null, ms: Date.now() - started };
    await logRun(admin, result);
    return result;
  } catch (err) {
    const result: ScrapeRunResult = { ...base, error: err instanceof Error ? err.message : String(err), ms: Date.now() - started };
    await logRun(admin, result);
    return result;
  }
}

// scrape_runs'a koşu özeti yaz. Log yazımı da patlarsa yut (asıl sonucu döndürmeyi engelleme).
async function logRun(admin: SupabaseClient, r: ScrapeRunResult): Promise<void> {
  try {
    await admin.from("scrape_runs").insert({
      source: r.source, fetched: r.fetched, upserted: r.upserted, skipped: r.skipped, error: r.error, ms: r.ms,
    });
  } catch { /* log yazımı best-effort; koşu sonucu yine döner */ }
}

export async function runScrape(admin: SupabaseClient, sources: ScrapeSource[]): Promise<ScrapeRunResult[]> {
  return Promise.all(sources.map((s) => runOne(admin, s)));
}
