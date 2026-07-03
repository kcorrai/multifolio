// Cron scrape sonrası feed bildirimi: koşuda YENİ eklenen pool ilanlarını
// notify=true feed'lerle eşleştirir, kullanıcı başına TEK özet e-posta gönderir.
// run.ts/translate-titles.ts deseninde: client + gönderici PARAMETRE alınır
// (server-only import etmez; saf çekirdek buildFeedDigests test edilebilir).
// Hata içeride yakalanır: bildirim patlasa da scrape sonucu döner.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";

/** job_feeds satırı + sahibi (service-role tüm kullanıcıları tarar). */
export type NotifyFeedRow = JobFeedRow & { user_id: string };

export interface FeedDigest {
  userId: string;
  feedNames: string[];
  jobs: PoolJobRow[];
}

/** Saf: yeni ilanları bildirimli feed'lerle eşleştirip kullanıcı başına özet üretir.
 *  Skor kriteri null geçilir (yeni ilanların cache'li skoru olamaz — lenient). */
export function buildFeedDigests(feeds: NotifyFeedRow[], newJobs: PoolJobRow[]): FeedDigest[] {
  const byUser = new Map<string, NotifyFeedRow[]>();
  for (const f of feeds) {
    const list = byUser.get(f.user_id) ?? [];
    list.push(f);
    byUser.set(f.user_id, list);
  }

  const digests: FeedDigest[] = [];
  for (const [userId, userFeeds] of byUser) {
    const feedNames = new Set<string>();
    const jobs: PoolJobRow[] = [];
    for (const job of newJobs) {
      const hits = userFeeds.filter((f) => matchesFeed(job, feedCriteria(f), null));
      if (hits.length > 0) {
        jobs.push(job);
        for (const f of hits) feedNames.add(f.name);
      }
    }
    if (jobs.length > 0) digests.push({ userId, feedNames: [...feedNames], jobs });
  }
  return digests;
}

export interface DigestSender {
  (to: string, feedNames: string[], jobs: PoolJobRow[]): Promise<void>;
}

export interface NotifyResult {
  newJobs: number;
  digests: number;
  sent: number;
  error: string | null;
  ms: number;
}

const POOL_COLS = "id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr";
const FEED_COLS = "id, user_id, name, keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, created_at";

export async function notifyFeedMatches(
  admin: SupabaseClient,
  send: DigestSender,
  sinceIso: string,
): Promise<NotifyResult> {
  const started = Date.now();
  let newCount = 0;
  let digestCount = 0;
  let sent = 0;
  try {
    // created_at yalnız INSERT'te atanır → upsert'te güncellenen eski satırlar elenmiş olur.
    const { data: jobsData, error: jobsErr } = await admin
      .from("job_pool").select(POOL_COLS).gte("created_at", sinceIso);
    if (jobsErr) throw jobsErr;
    const newJobs = (jobsData ?? []) as PoolJobRow[];
    newCount = newJobs.length;
    if (newCount === 0) return { newJobs: 0, digests: 0, sent: 0, error: null, ms: Date.now() - started };

    const { data: feedsData, error: feedsErr } = await admin
      .from("job_feeds").select(FEED_COLS).eq("notify", true);
    if (feedsErr) throw feedsErr;

    const digests = buildFeedDigests((feedsData ?? []) as NotifyFeedRow[], newJobs);
    digestCount = digests.length;

    for (const d of digests) {
      const { data: userData, error: userErr } = await admin.auth.admin.getUserById(d.userId);
      if (userErr || !userData?.user?.email) continue; // e-postasız/silinmiş kullanıcı atlanır
      await send(userData.user.email, d.feedNames, d.jobs);
      sent++;
    }

    return { newJobs: newCount, digests: digestCount, sent, error: null, ms: Date.now() - started };
  } catch (err) {
    return {
      newJobs: newCount,
      digests: digestCount,
      sent,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    };
  }
}
