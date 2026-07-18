// Haftalık kişisel özet e-postası (Dalga 3 / Tier 2 #6 — Grammarly deseni).
// Cron haftada bir tetikler; kullanıcı başına son 7 günün aktivitesi
// (eklenen/güncellenen başvurular, üretilen teklifler, kredi kullanımı) +
// feed'leriyle eşleşen yeni ilanlar tek e-postada özetlenir.
// notify.ts deseninde: client + gönderici PARAMETRE alınır (server-only import
// etmez; saf çekirdek buildWeeklySummaries test edilebilir). Hata içeride
// yakalanır — bir kullanıcının e-postası patlasa da koşu devam eder.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PoolJobRow } from "@/lib/validation/schemas/feed";
import type { JobStatus } from "@/lib/validation/schemas/job";
import { buildFeedDigests, type NotifyFeedRow } from "@/lib/scrape/notify";

/** E-postada listelenen eşleşme tavanı; kalanı "+N more" olur. */
export const WEEKLY_MAX_MATCHES = 3;

export interface WeeklyJobRow {
  user_id: string;
  status: JobStatus;
  created_at: string;
}

export interface WeeklyUsageRow {
  user_id: string;
  credits_spent: number | null;
}

export interface WeeklySummary {
  userId: string;
  /** Bu hafta EKLENEN ilan sayısı (created_at >= since). */
  jobsAdded: number;
  /** Bu hafta dokunulan başvuruların durum dağılımı (eklenenler dahil). */
  statusCounts: Partial<Record<JobStatus, number>>;
  proposals: number;
  creditsUsed: number;
  /** Feed'lerle eşleşen yeni pool ilanları (tavanlı). */
  matches: PoolJobRow[];
  matchTotal: number;
}

/** Saf: haftalık satır dilimlerinden kullanıcı başına özet üretir.
 *  Hiç sinyali olmayan kullanıcıya özet ÜRETİLMEZ (boş e-posta atılmaz). */
export function buildWeeklySummaries(input: {
  sinceIso: string;
  jobs: WeeklyJobRow[]; // updated_at >= since dilimi
  proposals: { user_id: string }[];
  usage: WeeklyUsageRow[];
  feeds: NotifyFeedRow[];
  newJobs: PoolJobRow[];
}): WeeklySummary[] {
  const users = new Set<string>();
  for (const j of input.jobs) users.add(j.user_id);
  for (const p of input.proposals) users.add(p.user_id);
  for (const u of input.usage) users.add(u.user_id);

  // Feed eşleşmeleri: mevcut saf çekirdek yeniden kullanılır (skor kriteri lenient).
  const matchesByUser = new Map<string, PoolJobRow[]>();
  for (const d of buildFeedDigests(input.feeds, input.newJobs)) {
    matchesByUser.set(d.userId, d.jobs);
    users.add(d.userId);
  }

  const summaries: WeeklySummary[] = [];
  for (const userId of users) {
    const jobs = input.jobs.filter((j) => j.user_id === userId);
    const statusCounts: Partial<Record<JobStatus, number>> = {};
    for (const j of jobs) statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1;

    const jobsAdded = jobs.filter((j) => j.created_at >= input.sinceIso).length;
    const proposals = input.proposals.filter((p) => p.user_id === userId).length;
    const creditsUsed = input.usage
      .filter((u) => u.user_id === userId)
      .reduce((sum, u) => sum + Number(u.credits_spent ?? 0), 0);
    const allMatches = matchesByUser.get(userId) ?? [];

    if (jobs.length === 0 && proposals === 0 && creditsUsed === 0 && allMatches.length === 0) continue;

    summaries.push({
      userId,
      jobsAdded,
      statusCounts,
      proposals,
      creditsUsed,
      matches: allMatches.slice(0, WEEKLY_MAX_MATCHES),
      matchTotal: allMatches.length,
    });
  }
  return summaries;
}

export interface WeeklyDigestSender {
  (to: string, summary: WeeklySummary): Promise<void>;
}

export interface WeeklyDigestResult {
  users: number;
  optedOut: number;
  sent: number;
  error: string | null;
  ms: number;
}

const FEED_COLS = "id, user_id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, job_types, notify, proposal_prompt, created_at";
const POOL_COLS = "id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr, job_type";

export async function runWeeklyDigest(
  admin: SupabaseClient,
  send: WeeklyDigestSender,
  sinceIso: string,
): Promise<WeeklyDigestResult> {
  const started = Date.now();
  let users = 0;
  let optedOut = 0;
  let sent = 0;
  try {
    // updated_at INSERT'te de now() → hem eklenen hem güncellenen satırları kapsar.
    const [jobsRes, proposalsRes, usageRes, feedsRes, poolRes, optOutRes] = await Promise.all([
      admin.from("job_listings").select("user_id, status, created_at").gte("updated_at", sinceIso),
      admin.from("proposals").select("user_id").gte("created_at", sinceIso),
      admin.from("usage_events").select("user_id, credits_spent").gte("created_at", sinceIso),
      admin.from("job_feeds").select(FEED_COLS),
      admin.from("job_pool").select(POOL_COLS).gte("created_at", sinceIso),
      admin.from("user_settings").select("user_id").eq("weekly_digest", false),
    ]);
    for (const r of [jobsRes, proposalsRes, usageRes, feedsRes, poolRes, optOutRes]) {
      if (r.error) throw r.error;
    }

    const summaries = buildWeeklySummaries({
      sinceIso,
      jobs: (jobsRes.data ?? []) as WeeklyJobRow[],
      proposals: (proposalsRes.data ?? []) as { user_id: string }[],
      usage: (usageRes.data ?? []) as WeeklyUsageRow[],
      feeds: (feedsRes.data ?? []) as NotifyFeedRow[],
      newJobs: (poolRes.data ?? []) as PoolJobRow[],
    });
    users = summaries.length;

    const skip = new Set((optOutRes.data ?? []).map((r) => (r as { user_id: string }).user_id));

    for (const s of summaries) {
      if (skip.has(s.userId)) { optedOut++; continue; }
      const { data: userData, error: userErr } = await admin.auth.admin.getUserById(s.userId);
      if (userErr || !userData?.user?.email) continue; // e-postasız/silinmiş kullanıcı atlanır
      await send(userData.user.email, s);
      sent++;
    }

    return { users, optedOut, sent, error: null, ms: Date.now() - started };
  } catch (err) {
    return {
      users,
      optedOut,
      sent,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - started,
    };
  }
}
