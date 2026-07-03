// POST /api/internal/scrape — dış cron (cron-job.org) tetikler. x-cron-secret
// header'ı SCRAPER_CRON_SECRET ile eşleşmezse 401. Kaynakları çalıştırıp job_pool'a
// upsert eder, ardından çevrilmemiş başlıkları EN/TR'ye çevirir (hata izole —
// çeviri patlasa da scrape sonucu döner). withErrorHandler'dan geçer; service-role yalnız burada.
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScrape } from "@/lib/scrape/run";
import { translateNewTitles } from "@/lib/scrape/translate-titles";
import { translateJobTitles } from "@/lib/ai/translate";
import { remotiveSource } from "@/lib/scrape/sources/remotive";
import { arbeitnowSource } from "@/lib/scrape/sources/arbeitnow";

// GET: hafif erişilebilirlik yanıtı (cron servisleri URL doğrularken GET/HEAD atar).
// İŞ YAPMAZ, secret istemez; gerçek çekme yalnız POST + x-cron-secret ile.
export const GET = withErrorHandler(async () => {
  return NextResponse.json({ ok: true, hint: "POST with x-cron-secret header to trigger scrape" });
});

// Sabit-zamanlı secret karşılaştırması (timing oracle önlemi). Uzunluk farkı
// zaten reddedilir; eşit uzunlukta timingSafeEqual erken-çıkış sızıntısını kapatır.
function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const POST = withErrorHandler(async (req) => {
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.SCRAPER_CRON_SECRET;
  if (!expected || !secretMatches(secret, expected)) throw new AuthError();

  const admin = createSupabaseAdminClient();
  const results = await runScrape(admin, [remotiveSource, arbeitnowSource]);
  const titles = await translateNewTitles(admin, translateJobTitles);
  return NextResponse.json({ ok: true, results, titles });
});
