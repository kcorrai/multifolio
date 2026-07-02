import { describe, it, expect } from "vitest";
import { runScrape } from "./run";
import type { ScrapeSource } from "@/lib/scrape/types";

// Zincirlenebilir Supabase admin mock'u: from(table).upsert()/.insert() çağrılarını yakalar.
function mockAdmin() {
  const calls: { upsert: unknown[]; insert: unknown[] } = { upsert: [], insert: [] };
  const admin = {
    from(table: string) {
      return {
        upsert(rows: unknown, opts: unknown) { calls.upsert.push({ table, rows, opts }); return Promise.resolve({ error: null }); },
        insert(row: unknown) { calls.insert.push({ table, row }); return Promise.resolve({ error: null }); },
      };
    },
  };
  return { admin, calls };
}

const okSource: ScrapeSource = {
  id: "ok",
  fetch: async () => [{ id: 1, title: "A" }, { bad: true }, { id: 2, title: "B" }],
  normalize: (raw) => {
    const r = raw as { id?: number; title?: string };
    return r.title ? { source: "ok", external_id: String(r.id), title: r.title, description: "", url: null, budget: null, skills: [], client_country: null, client_spent: null, posted_at: null } : null;
  },
};

const failSource: ScrapeSource = {
  id: "boom",
  fetch: async () => { throw new Error("network down"); },
  normalize: () => null,
};

describe("runScrape", () => {
  it("geçerlileri job_pool'a upsert eder, geçersizleri atlar, scrape_runs'a yazar", async () => {
    const { admin, calls } = mockAdmin();
    const results = await runScrape(admin as never, [okSource]);

    expect(results[0]).toMatchObject({ source: "ok", fetched: 3, upserted: 2, skipped: 1, error: null });
    const up = calls.upsert[0] as { table: string; rows: unknown[]; opts: unknown };
    expect(up.table).toBe("job_pool");
    expect(up.rows).toHaveLength(2);
    expect(up.opts).toEqual({ onConflict: "source,external_id" });
    const ins = calls.insert[0] as { table: string; row: { source: string; upserted: number } };
    expect(ins.table).toBe("scrape_runs");
    expect(ins.row).toMatchObject({ source: "ok", upserted: 2, skipped: 1 });
  });

  it("bir kaynak patlarsa diğerleri devam eder; hata scrape_runs'a loglanır", async () => {
    const { admin, calls } = mockAdmin();
    const results = await runScrape(admin as never, [failSource, okSource]);

    const boom = results.find((r) => r.source === "boom")!;
    expect(boom.error).toContain("network down");
    expect(boom.upserted).toBe(0);
    expect(results.find((r) => r.source === "ok")!.upserted).toBe(2);
    expect(calls.insert).toHaveLength(2);
  });

  it("hiç geçerli ilan yoksa job_pool.upsert çağrılmaz", async () => {
    const empty: ScrapeSource = { id: "e", fetch: async () => [{ bad: 1 }], normalize: () => null };
    const { admin, calls } = mockAdmin();
    await runScrape(admin as never, [empty]);
    expect(calls.upsert).toHaveLength(0);
    expect(calls.insert).toHaveLength(1);
  });
});
