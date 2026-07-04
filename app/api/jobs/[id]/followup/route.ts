// POST /api/jobs/[id]/followup — yanıt alınamayan başvuru için AI takip
// mesajı üretir (1 kredi). Mesaj KALICI DEĞİL — kullanıcı kopyalayıp
// platformda gönderir (proposals'a yazmak teklif geçmişini kirletir).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseUuidParam } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateFollowUp } from "@/lib/ai/followup";
import { spendCredits } from "@/lib/credits/spend";

export const POST = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const [jobRes, profileRes, proposalRes] = await Promise.all([
    supabase
      .from("job_listings")
      .select("title, description, platform, status, status_changed_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("headline")
      .eq("user_id", user.id)
      .maybeSingle(),
    // Bu ilana gönderilen SON teklif — mesaja bağlam olur (tekrar edilmez).
    supabase
      .from("proposals")
      .select("content")
      .eq("job_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (jobRes.error) throw jobRes.error;
  if (!jobRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));
  if (profileRes.error) throw profileRes.error;
  if (proposalRes.error) throw proposalRes.error;

  const job = jobRes.data;
  const ref = (job.status_changed_at as string | null) ?? (job.updated_at as string);
  const daysSince = Math.max(1, Math.floor((Date.now() - new Date(ref).getTime()) / 86_400_000));

  const locale = await getUserLocale();
  const { result, balance, spent } = await spendCredits(user.id, "followup", () =>
    generateFollowUp({
      jobTitle: job.title as string,
      platform: job.platform as string | null,
      jobDescription: job.description as string | null,
      lastProposal: (proposalRes.data?.content as string | undefined) ?? null,
      daysSince,
      headline: (profileRes.data?.headline as string | undefined) ?? null,
      locale,
    }),
  );

  // Maliyet kaydı (analitik — kredi iadesi kapsamı dışında)
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "followup",
    platform: job.platform,
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({
    message: result.content,
    credits: { balance, spent },
  });
});
