import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import type { JobRow } from "@/components/dashboard/shared";
import { aggregateCreditUsage } from "@/lib/credits/analytics";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, jobsRes, usageRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("kind, credits_spent, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const profileSaved = profileRes.data !== null;

  // Onboarding: profili olmayan kullanıcının ilk işi içe aktarma wizard'ıdır.
  // Yalnız Genel Bakış yönlendirir — diğer sekmelerde gezinme engellenmez.
  if (!profileSaved) redirect("/dashboard/import");
  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  // eslint-disable-next-line react-hooks/purity
  const analytics = aggregateCreditUsage(usageRes.data ?? [], Date.now());

  return (
    <OverviewTab
      profileSaved={profileSaved}
      jobs={jobs}
      analytics={analytics}
    />
  );
}
