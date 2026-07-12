// POST /api/proposal/[id]/translate → teklif metnini kullanıcının UI diline çevirir.
// ÜCRETSİZDİR (kredi düşmez — platform maliyeti; TR kullanıcının EN teklifi
// anlaması "İngilizce bariyeri" güven meselesi). Cache YOK: teklif kullanıcıya
// özel + düşük hacim; saatlik limit usage_events(kind='proposal_translate').
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseUuidParam } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { translateProposalContent } from "@/lib/ai/translate";
import { PLATFORM_LANGUAGE, type PlatformId } from "@/lib/ai/platforms";

const HOURLY_LIMIT = 30;

export const POST = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const locale = await getUserLocale();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("content, platform")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!proposal) throw new NotFoundError((await getTranslations("errors"))("proposalNotFound"));

  // Teklif zaten kullanıcının dilindeyse çeviriye gerek yok.
  const contentLang = PLATFORM_LANGUAGE[proposal.platform as PlatformId] ?? "en";
  if (contentLang === locale) {
    return NextResponse.json({ content: proposal.content, cached: true });
  }

  // Rate-limit: son 1 saatteki proposal_translate sayısı (job_translate deseni).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "proposal_translate")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) {
    throw new RateLimitError((await getTranslations("errors"))("translateRateLimited"));
  }

  const result = await translateProposalContent(proposal.content as string);

  // Maliyet + rate-limit kaydı (kredi düşmez).
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "proposal_translate", platform: proposal.platform,
    model: result.model, input_tokens: result.inputTokens,
    output_tokens: result.outputTokens, cost_usd: result.costUsd, credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ content: result.translated, cached: false });
});
