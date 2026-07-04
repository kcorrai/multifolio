import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import type { JobRow } from "@/components/dashboard/shared";
import { aggregateCreditUsage } from "@/lib/credits/analytics";
import { computeProfileStrength } from "@/lib/profile-strength";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, jobsRes, usageRes, connRes, ppRes, adaptRes] = await Promise.all([
    supabase.from("profiles").select("user_id, headline, summary, skills, avatar_url, portfolio").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("kind, credits_spent, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("platform_connections").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("platform_profiles").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("adaptations").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // Onboarding: profili olmayan kullanıcının ilk işi içe aktarma wizard'ıdır.
  // Yalnız Genel Bakış yönlendirir — diğer sekmelerde gezinme engellenmez.
  if (!profileRes.data) redirect("/dashboard/import");
  const profile = profileRes.data;
  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  // eslint-disable-next-line react-hooks/purity
  const analytics = aggregateCreditUsage(usageRes.data ?? [], Date.now());

  const strength = computeProfileStrength({
    headline: (profile.headline as string | null) ?? null,
    summary: (profile.summary as string | null) ?? null,
    skills: (profile.skills as string[] | null) ?? null,
    avatarUrl: (profile.avatar_url as string | null) ?? null,
    portfolioCount: Array.isArray(profile.portfolio) ? profile.portfolio.length : 0,
    connectionsCount: connRes.count ?? 0,
    platformProfilesCount: ppRes.count ?? 0,
    adaptationsCount: adaptRes.count ?? 0,
  });

  return (
    <OverviewTab
      profileSaved
      jobs={jobs}
      analytics={analytics}
      strength={strength}
    />
  );
}
