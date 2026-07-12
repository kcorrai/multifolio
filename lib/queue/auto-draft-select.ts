// Otomatik taslak aday seçimi (SAF, kredisiz, server-only bağımlılık YOK → test edilebilir).
// Yeni + takip-edilmeyen + feed-eşleşen ilanları relevance'a göre sıralar, her feed'in
// kalan günlük tavanı kadar seçer, koşu-başı emniyet sınırıyla. AI skorlama KULLANMAZ
// (ücretsiz relevance) → kredi yalnız üretimde harcanır (orchestrator'da).
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import { jobRelevance, type RelevanceProfile } from "@/lib/feed/relevance";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

// Koşu-başı kullanıcı emniyeti: tek scrape sonrası bir kullanıcıya en çok bu kadar taslak
// (feed tavanlarına EK üst sınır; kaçak harcamayı bounded tutar).
export const AUTO_DRAFT_MAX_PER_RUN = 5;

export interface AutoDraftPick {
  job: PoolJobRow;
  feedId: string;
}

export function selectAutoDraftJobs(
  feeds: JobFeedRow[],
  newJobs: PoolJobRow[],
  trackedIds: Set<string>,
  relProfile: RelevanceProfile,
  remainingByFeed: Record<string, number>,
): AutoDraftPick[] {
  const remaining = { ...remainingByFeed };
  const candidates = newJobs
    .filter((j) => !trackedIds.has(j.id))
    .map((j) => ({ job: j, rel: jobRelevance(relProfile, j) }))
    .sort((a, b) => (b.rel ?? -1) - (a.rel ?? -1));

  const picks: AutoDraftPick[] = [];
  for (const c of candidates) {
    if (picks.length >= AUTO_DRAFT_MAX_PER_RUN) break;
    // Kalan tavanı olan ilk eşleşen feed'e ata (skor null — yeni ilanın cache'li skoru olamaz).
    const feed = feeds.find((f) => (remaining[f.id] ?? 0) > 0 && matchesFeed(c.job, feedCriteria(f), null));
    if (!feed) continue;
    picks.push({ job: c.job, feedId: feed.id });
    remaining[feed.id] -= 1;
  }
  return picks;
}
