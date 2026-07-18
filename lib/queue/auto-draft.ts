// Arka-plan otomatik taslak orchestrator'ı (server-only; yalnız cron'dan çağrılır).
// notify.ts deseni: service-role client parametre alınır, hata İZOLE (patlasa da scrape döner).
// Opt-in feed'lere (auto_draft_daily>0) uyan YENİ ilanlara teklif taslaklar — feed başına
// günlük tavan + koşu-başı emniyet + kullanıcı bakiyesiyle sınırlı. AI skorlama YOK (ücretsiz
// relevance ile seçim). Kredi ATOMİK (spendCredits): yetersizse taslak üretilmez. AUTO-SUBMIT YOK.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";
import type { ProfileInput } from "@/lib/validation/schemas/profile";
import { selectAutoDraftJobs } from "./auto-draft-select";
import { generateProposal } from "@/lib/ai/proposal";
import { spendCredits } from "@/lib/credits/spend";
import { createNotification } from "@/lib/notifications/create";
import { InsufficientCreditsError } from "@/lib/errors";
import { PLATFORM_IDS, type PlatformId } from "@/lib/ai/platforms";
import type { RelevanceProfile } from "@/lib/feed/relevance";

const POOL_COLS = "id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr, job_type";
const FEED_COLS = "id, user_id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, job_types, notify, proposal_prompt, auto_draft_daily, auto_draft_used, auto_draft_used_date, created_at";

type AutoFeed = JobFeedRow & { user_id: string; auto_draft_used?: number; auto_draft_used_date?: string | null };

export interface AutoDraftResult {
  newJobs: number;
  drafted: number;
  users: number;
  error: string | null;
  ms: number;
}

export async function runAutoDraft(admin: SupabaseClient, sinceIso: string): Promise<AutoDraftResult> {
  const started = Date.now();
  const today = sinceIso.slice(0, 10); // YYYY-MM-DD (UTC) — feed günlük sayaç sıfırlama referansı
  let drafted = 0;
  let usersTouched = 0;
  try {
    const { data: jobsData, error: jobsErr } = await admin.from("job_pool").select(POOL_COLS).gte("created_at", sinceIso);
    if (jobsErr) throw jobsErr;
    const newJobs = (jobsData ?? []) as PoolJobRow[];
    if (newJobs.length === 0) return { newJobs: 0, drafted: 0, users: 0, error: null, ms: Date.now() - started };

    const { data: feedsData, error: feedsErr } = await admin.from("job_feeds").select(FEED_COLS).gt("auto_draft_daily", 0);
    if (feedsErr) throw feedsErr;
    const feeds = (feedsData ?? []) as AutoFeed[];
    if (feeds.length === 0) return { newJobs: newJobs.length, drafted: 0, users: 0, error: null, ms: Date.now() - started };

    const byUser = new Map<string, AutoFeed[]>();
    for (const f of feeds) {
      const list = byUser.get(f.user_id) ?? [];
      list.push(f);
      byUser.set(f.user_id, list);
    }

    for (const [userId, userFeeds] of byUser) {
      // generateProposal profil ister; profilsiz kullanıcı atlanır.
      const { data: profile } = await admin.from("profiles").select("headline, summary, skills").eq("user_id", userId).maybeSingle();
      if (!profile?.headline) continue;

      const { data: tracked } = await admin.from("job_listings").select("source_pool_id").eq("user_id", userId).not("source_pool_id", "is", null);
      const trackedIds = new Set(((tracked ?? []) as { source_pool_id: string | null }[]).map((r) => r.source_pool_id).filter((v): v is string => !!v));

      // Feed başına kalan tavan (tarih değişmişse used sıfırlanmış sayılır).
      const remainingByFeed: Record<string, number> = {};
      const feedById = new Map<string, AutoFeed>();
      for (const f of userFeeds) {
        feedById.set(f.id, f);
        const usedToday = f.auto_draft_used_date === today ? (f.auto_draft_used ?? 0) : 0;
        remainingByFeed[f.id] = Math.max(0, (f.auto_draft_daily ?? 0) - usedToday);
      }

      const relProfile: RelevanceProfile = { headline: profile.headline as string, skills: (profile.skills as string[] | null) ?? null };
      const picks = selectAutoDraftJobs(userFeeds, newJobs, trackedIds, relProfile, remainingByFeed);
      if (picks.length === 0) continue;

      const profileInput: ProfileInput = {
        headline: profile.headline as string,
        summary: (profile.summary as string | null) ?? "",
        skills: (profile.skills as string[] | null) ?? [],
      };
      const usedDelta: Record<string, number> = {};
      let userDrafted = 0;

      for (const { job, feedId } of picks) {
        try {
          const { data: jl, error: jlErr } = await admin.from("job_listings").insert({
            user_id: userId, title: job.title, description: job.description, platform: job.source,
            url: job.url ?? null, budget: job.budget ?? null, source_pool_id: job.id, status: "saved",
          }).select("id").single();
          if (jlErr || !jl) continue;
          const jobId = jl.id as string;
          const platform: PlatformId = (PLATFORM_IDS as readonly string[]).includes(job.source) ? (job.source as PlatformId) : "upwork";
          const feed = feedById.get(feedId);

          const { result: ai, spent } = await spendCredits(userId, "proposal", async () => {
            const proposal = await generateProposal(profileInput, (job.description || job.title).slice(0, 10000), platform, {
              feedPrompt: feed?.proposal_prompt ?? undefined,
              locale: "en",
            });
            const { error: pErr } = await admin.from("proposals").insert({
              user_id: userId, job_id: jobId, platform, content: proposal.content, coverage: proposal.coverage,
            });
            if (pErr) throw pErr;
            return proposal;
          });

          await admin.from("usage_events").insert({
            user_id: userId, kind: "proposal", model: ai.model,
            input_tokens: ai.inputTokens, output_tokens: ai.outputTokens, cost_usd: ai.costUsd, credits_spent: spent,
          });

          userDrafted += 1;
          drafted += 1;
          usedDelta[feedId] = (usedDelta[feedId] ?? 0) + 1;
        } catch (err) {
          if (err instanceof InsufficientCreditsError) break; // bakiye bitti → bu kullanıcıyı durdur
          // Diğer hata: bu işi atla, kullanıcının kalanına devam et.
        }
      }

      // Feed günlük sayaçlarını güncelle (yalnız taslaklanan feed'ler).
      for (const [fid, inc] of Object.entries(usedDelta)) {
        if (inc <= 0) continue;
        const f = feedById.get(fid);
        const base = f?.auto_draft_used_date === today ? (f?.auto_draft_used ?? 0) : 0;
        await admin.from("job_feeds").update({ auto_draft_used: base + inc, auto_draft_used_date: today }).eq("id", fid);
      }

      if (userDrafted > 0) {
        usersTouched += 1;
        // TİP-BAZLI: sayı title'da DATUM olarak taşınır; notification-bell okuyucunun
        // diline (en/tr) çevirir (cron'da kullanıcı locale'i yok → burada sabit metin YAZILMAZ).
        await createNotification(admin, {
          userId,
          type: "auto_draft",
          title: String(userDrafted),
          body: null,
          link: "/dashboard/jobs?view=applied",
        });
      }
    }

    return { newJobs: newJobs.length, drafted, users: usersTouched, error: null, ms: Date.now() - started };
  } catch (err) {
    return { newJobs: 0, drafted, users: usersTouched, error: err instanceof Error ? err.message : String(err), ms: Date.now() - started };
  }
}
