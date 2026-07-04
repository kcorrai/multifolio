// POST /api/internal/weekly-digest — dış cron (cron-job.org, haftada 1) tetikler.
// Scrape route'uyla AYNI secret kullanılır (x-cron-secret = SCRAPER_CRON_SECRET;
// ayrı env çoğaltmaya değmez). Son 7 günün kullanıcı aktivitesi + feed
// eşleşmelerini kullanıcı başına tek özet e-postada gönderir (opt-out:
// user_settings.weekly_digest=false). withErrorHandler'dan geçer.
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runWeeklyDigest } from "@/lib/digest/weekly";
import { sendWeeklyDigestEmail } from "@/lib/notifications/email";

// GET: hafif erişilebilirlik yanıtı (cron servisleri URL doğrularken GET/HEAD atar).
export const GET = withErrorHandler(async () => {
  return NextResponse.json({ ok: true, hint: "POST with x-cron-secret header to trigger weekly digest" });
});

// Sabit-zamanlı secret karşılaştırması (scrape route'undaki desen).
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const POST = withErrorHandler(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.SCRAPER_CRON_SECRET;
  if (!expected || !secretMatches(secret, expected)) throw new AuthError();

  const admin = createSupabaseAdminClient();
  const sinceIso = new Date(Date.now() - WEEK_MS).toISOString();
  const result = await runWeeklyDigest(admin, sendWeeklyDigestEmail, sinceIso);
  return NextResponse.json({ ok: true, result });
});
