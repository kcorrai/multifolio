// Başvuru kuyruğu (SAF, kredisiz): başvurulmamış + feed-eşleşen pool ilanlarını skor→
// relevance sırasına dizer. Taslak üretimi (kredi) İSTEK ÜZERİNE — bu fonksiyon yalnız
// "hangi işler sırada" hesabını yapar (ücretsiz, mevcut job_scores + feed kriterleri).
import { matchesFeed, feedCriteria } from "./filter";
import { jobRelevance, type RelevanceProfile } from "./relevance";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

export function buildApplyQueue(
  pool: PoolJobRow[],
  feeds: JobFeedRow[],
  scores: Map<string, number | null>,
  appliedIds: Set<string>,
  relProfile: RelevanceProfile,
  limit = 20,
): PoolJobRow[] {
  // Zaten başvurulmuş/takip edilen (job_listings.source_pool_id) kuyruğa girmez.
  const notApplied = pool.filter((p) => !appliedIds.has(p.id));
  // Feed varsa yalnız en az bir feed'e uyanlar; feed yoksa hepsi aday.
  const matched =
    feeds.length === 0
      ? notApplied
      : notApplied.filter((p) => feeds.some((f) => matchesFeed(p, feedCriteria(f), scores.get(p.id) ?? null)));
  // Sıralama: AI skoru (varsa) DESC → ücretsiz relevance DESC. Skorsuzlar sona.
  const ranked = matched
    .map((p) => ({ p, score: scores.get(p.id) ?? null, relevance: jobRelevance(relProfile, p) }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (b.relevance ?? -1) - (a.relevance ?? -1));
  return ranked.slice(0, limit).map((x) => x.p);
}
