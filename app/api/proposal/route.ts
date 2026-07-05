// GET  /api/proposal?job_id={id} → o ilana ait teklifleri döner.
// POST /api/proposal → AI teklifi üretir ve kaydeder.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseQuery } from "@/lib/validation";
import { proposalCreateSchema, type ProposalCoverageItem } from "@/lib/validation/schemas/proposal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateProposal } from "@/lib/ai/proposal";
import { spendCredits } from "@/lib/credits/spend";
import { z } from "zod";
import { matchesFeed, feedCriteria } from "@/lib/feed/filter";
import type { ProfileInput } from "@/lib/validation/schemas/profile";
import type { JobMatchResult } from "@/lib/validation/schemas/job";
import type { PoolJobRow, JobFeedRow } from "@/lib/validation/schemas/feed";

const jobIdQuerySchema = z.object({ job_id: z.string().uuid() });

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { job_id } = parseQuery(new URL(req.url).searchParams, jobIdQuerySchema);

  const { data, error } = await supabase
    .from("proposals")
    .select("id, job_id, platform, content, coverage, created_at")
    .eq("job_id", job_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ proposals: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, proposalCreateSchema);

  const [profileRes, jobRes, lastProposalRes, platformProfileRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_listings")
      .select("match_result, source_pool_id")
      .eq("id", input.job_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    // No-match yolunda ilk üretimde çıkarılan gereksinimleri geri beslemek için en son teklifin kapsamı.
    supabase
      .from("proposals")
      .select("coverage")
      .eq("job_id", input.job_id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Hedef platformdan çekilmiş gerçek profil (varsa) prompt'a ek bağlam olarak girer.
    supabase
      .from("platform_profiles")
      .select("headline, summary, skills")
      .eq("user_id", user.id)
      .eq("platform", input.platform)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequiredProposal"));
  if (jobRes.error) throw jobRes.error;

  // Gereksinim önceliği: (1) ilan eşleştirmesinden çıkan requirements (kanonik),
  // (2) yoksa önceki teklifin coverage'ından çıkan gereksinimler (regenerate'te seti stabil tutar).
  const matchRequirements = (jobRes.data?.match_result as JobMatchResult | null)?.requirements;
  const priorRequirements = (lastProposalRes.data?.coverage as ProposalCoverageItem[] | null)
    ?.map((c) => c.requirement)
    .filter(Boolean);
  const requirements = matchRequirements?.length
    ? matchRequirements
    : priorRequirements?.length
      ? priorRequirements
      : undefined;

  // İlan bir feed'den geldiyse (source_pool_id) ilana uyan İLK prompt'lu feed'in
  // teklif yönergesi AI'a eklenir (kullanıcının UpHunt-tarzı özel prompt'u).
  const sourcePoolId = (jobRes.data?.source_pool_id as string | null) ?? null;
  let feedPrompt: string | null = null;
  if (sourcePoolId) {
    const [poolRes, feedsRes] = await Promise.all([
      supabase
        .from("job_pool")
        .select("id, source, external_id, title, description, url, budget, skills, client_country, client_spent, posted_at, created_at, lang, title_en, title_tr")
        .eq("id", sourcePoolId)
        .maybeSingle(),
      supabase
        .from("job_feeds")
        .select("id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, created_at")
        .eq("user_id", user.id)
        .not("proposal_prompt", "is", null),
    ]);
    if (poolRes.error) throw poolRes.error;
    if (feedsRes.error) throw feedsRes.error;
    if (poolRes.data) {
      const pool = poolRes.data as PoolJobRow;
      const feed = ((feedsRes.data ?? []) as JobFeedRow[]).find(
        (f) => (f.proposal_prompt ?? "").trim() && matchesFeed(pool, feedCriteria(f), null),
      );
      feedPrompt = feed?.proposal_prompt ?? null;
    }
  }

  const proposalLocale = await getUserLocale();
  // AI üretimi + teklifin kaydı tek closure'da: kayıt patlarsa spendCredits krediyi iade eder
  // (kredi öde-sonuç kaybolma durumunu önler). usage_events (analitik) dışarıda kalır.
  const { result, balance, spent } = await spendCredits(user.id, "proposal", async () => {
    const ai = await generateProposal(
      profileRes.data as ProfileInput,
      input.job_description,
      input.platform,
      {
        requirements,
        focusRequirements: input.focus_requirements,
        locale: proposalLocale,
        platformProfile: platformProfileRes.data as { headline: string; summary: string; skills: string[] } | null,
        feedPrompt,
        tone: input.tone,
        length: input.length,
      },
    );
    const { data: saved, error: saveError } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        job_id: input.job_id,
        platform: input.platform,
        content: ai.content,
        coverage: ai.coverage,
      })
      .select("id, job_id, platform, content, coverage, created_at")
      .single();
    if (saveError) throw saveError;
    return { ai, saved };
  });

  // Maliyet kaydı (analitik — kredi iadesi kapsamı dışında)
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "proposal",
    model: result.ai.model,
    input_tokens: result.ai.inputTokens,
    output_tokens: result.ai.outputTokens,
    cost_usd: result.ai.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({
    proposal: result.saved,
    credits: { balance, spent },
  }, { status: 201 });
});
