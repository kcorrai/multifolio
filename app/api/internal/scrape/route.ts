// POST /api/internal/scrape — dış cron (cron-job.org) tetikler. x-cron-secret
// header'ı SCRAPER_CRON_SECRET ile eşleşmezse 401. Kaynakları çalıştırıp job_pool'a
// upsert eder. withErrorHandler'dan geçer; service-role yalnız burada.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScrape } from "@/lib/scrape/run";
import { remotiveSource } from "@/lib/scrape/sources/remotive";
import { arbeitnowSource } from "@/lib/scrape/sources/arbeitnow";

export const POST = withErrorHandler(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.SCRAPER_CRON_SECRET;
  if (!expected || secret !== expected) throw new AuthError();

  const admin = createSupabaseAdminClient();
  const results = await runScrape(admin, [remotiveSource, arbeitnowSource]);
  return NextResponse.json({ ok: true, results });
});
