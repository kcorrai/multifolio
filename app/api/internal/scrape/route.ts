// POST /api/internal/scrape — dış cron (cron-job.org) tetikler. x-cron-secret
// header'ı SCRAPER_CRON_SECRET ile eşleşmezse 401. Kaynakları çalıştırıp job_pool'a
// upsert eder, ardından çevrilmemiş başlıkları EN/TR'ye çevirir (hata izole —
// çeviri patlasa da scrape sonucu döner). withErrorHandler'dan geçer; service-role yalnız burada.
import { timingSafeEqual } from "node:crypto";
import { NextResponse, after } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScrape } from "@/lib/scrape/run";
import { translateNewTitles } from "@/lib/scrape/translate-titles";
import { notifyFeedMatches } from "@/lib/scrape/notify";
import { runAutoDraft } from "@/lib/queue/auto-draft";
import { translateJobTitles } from "@/lib/ai/translate";
import { sendFeedDigestEmail } from "@/lib/notifications/email";
import { remotiveSource } from "@/lib/scrape/sources/remotive";
import { remoteOkSource } from "@/lib/scrape/sources/remoteok";
import { weWorkRemotelySource } from "@/lib/scrape/sources/weworkremotely";

// Arka plan (çeviri+bildirim) adımı için tavan; Fluid Compute yanıttan sonra
// after() işini bu süreye kadar sürdürür (AI başlık çevirisi ~50sn sürebilir).
export const maxDuration = 300;

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
  // Koşu başlangıcı: bildirim adımı yalnız bu andan sonra INSERT edilen
  // (created_at >= startedAt) pool satırlarını "yeni" sayar.
  const startedAt = new Date().toISOString();
  // Kaynaklar KATEGORİ-FİLTRELİ tutulur (feed alaka koruması). Canlı doğrulamada 3
  // aday kaynaktan 2'si REDDEDİLDİ: Himalayas (200 ilanın ~%8'i dev/design, kategori
  // query'si yok sayılıyor) ve The Muse (categories alanı query'yi kopyalıyor → "Software
  // Engineering" altında Corporate Counsel/Civil Engineer/sürücü reklamı, ~%50 gürültü) —
  // ikisi de filtresiz firehose, Arbeitnow gibi feed alakasını bozar. WWR kategori feed'leri
  // (programming + design) temiz → eklendi.
  const results = await runScrape(admin, [
    remotiveSource,
    remoteOkSource,
    weWorkRemotelySource,
  ]);

  // Çeviri (AI, ~50sn) + bildirim adımları cron-job.org'un ~30sn HTTP zaman
  // aşımını aşıyordu → koşu "Failed (timeout)" görünüyordu (iş aslında bitiyordu).
  // Yanıttan SONRA arka planda çalışır (Fluid Compute waitUntil): cron hızlı 200
  // alır, çeviri/bildirim maxDuration'a kadar sürer. İçeride hata izole (loglar döner).
  after(async () => {
    await translateNewTitles(admin, translateJobTitles);
    await notifyFeedMatches(admin, sendFeedDigestEmail, startedAt);
    // Opt-in feed'lere uyan yeni ilanlara arka-plan teklif taslağı (feed günlük tavanı +
    // bakiye ile sınırlı; AUTO-SUBMIT YOK). Hata izole — patlasa da scrape sonucu döner.
    await runAutoDraft(admin, startedAt);
  });

  return NextResponse.json({ ok: true, results });
});
