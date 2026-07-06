// /dashboard/start — "Getting Started" onboarding sayfası (dashboard logosu buraya
// yönlendirir). Adım tamamlanma durumlarını GERÇEK veriden türetir; tümü bitince tek
// seferlik bonus krediyi verir (server-otoritatif, idempotent).
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maybeGrantOnboardingBonus, ONBOARDING_BONUS_CREDITS } from "@/lib/credits/onboarding-bonus";
import { GettingStarted, type StepKey } from "@/components/dashboard/getting-started";

export default async function StartPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, connRes, adaptRes, feedRes, portfolioRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("platform", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("adaptations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("job_feeds").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("portfolios").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("published", true),
  ]);

  const profile = profileRes.data as { headline?: string; summary?: string } | null;
  const done: Record<StepKey, boolean> = {
    verifyEmail: user.app_metadata?.email_verified === true,
    profile: !!(profile?.headline?.trim() && profile?.summary?.trim()),
    connect: (connRes.count ?? 0) > 0,
    adapt: (adaptRes.count ?? 0) > 0,
    feed: (feedRes.count ?? 0) > 0,
    portfolio: (portfolioRes.count ?? 0) > 0,
  };
  const allDone = Object.values(done).every(Boolean);

  // Ödül: tümü bitmişse bir kez ver. Zaten verilmişse "kazanıldı" göster (tekrar vermez).
  const alreadyGranted = (user.user_metadata as Record<string, unknown> | undefined)?.onboarding_bonus_granted === true;
  const justGranted = await maybeGrantOnboardingBonus(user, allDone);

  return (
    <GettingStarted
      done={done}
      allDone={allDone}
      bonusEarned={alreadyGranted || justGranted}
      justGranted={justGranted}
      bonusCredits={ONBOARDING_BONUS_CREDITS}
    />
  );
}
