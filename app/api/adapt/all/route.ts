// POST /api/adapt/all → çekirdek profili TÜM platformlara tek istekte uyarlar
// (tek-tık aktivasyon). /api/adapt ile aynı koruma + kalıcılık + maliyet deseni;
// fark: PLATFORM_IDS üzerinde döner, platform başına kredi düşer (adaptation).
// Kredi biterse o ana kadar üretilenler KORUNUR (stoppedForCredits ile bildirilir).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, NotFoundError, InsufficientCreditsError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adaptProfile } from "@/lib/ai/adapt";
import { spendCredits } from "@/lib/credits/spend";
import { PLATFORM_IDS } from "@/lib/ai/platforms";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

export const POST = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const errors = await getTranslations("errors");
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profileRow) throw new NotFoundError(errors("profileRequired"));
  const profile = profileRow as ProfileInput;

  const admin = createSupabaseAdminClient();
  const results: { platform: string; output: { headline: string; body: string } }[] = [];
  let balance: number | null = null;
  let totalSpent = 0;
  let stoppedForCredits = false;

  // Sıralı: kredi düşümü yarış olmadan atomik kalsın; biri patlarsa spendCredits iade eder.
  for (const platform of PLATFORM_IDS) {
    try {
      const { result, balance: b, spent } = await spendCredits(user.id, "adaptation", async () => {
        const r = await adaptProfile(profile, platform, null);
        const { error: upsertError } = await supabase
          .from("adaptations")
          .upsert(
            { user_id: user.id, platform, headline: r.output.headline, body: r.output.body },
            { onConflict: "user_id,platform" },
          );
        if (upsertError) throw upsertError;
        return r;
      });
      balance = b;
      totalSpent += spent;
      results.push({ platform, output: result.output });
      await admin.from("usage_events").insert({
        user_id: user.id,
        kind: "adaptation",
        platform,
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        cost_usd: result.costUsd,
        credits_spent: spent,
      });
    } catch (err) {
      // Kredi bitti → o ana kadarki uyarlamalar kalıcı; kalanları atla, kısmi dön.
      if (err instanceof InsufficientCreditsError) {
        stoppedForCredits = true;
        break;
      }
      throw err;
    }
  }

  // Hiç uyarlama yapılamadıysa (ilk adımda kredi yetmedi) güncel bakiyeyi ayrıca çek.
  if (balance === null) {
    const { data: creditRow } = await supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    balance = creditRow?.balance ?? 0;
  }

  return NextResponse.json({
    results,
    adaptedCount: results.length,
    stoppedForCredits,
    credits: { balance, spent: totalSpent },
  });
});
