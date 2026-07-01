import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import type { JobRow } from "@/components/dashboard/shared";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, portfolioRes, jobsRes, usageRes, creditsRes] = await Promise.all([
    supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("published").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
  ]);

  const profileSaved = profileRes.data !== null;
  const portfolioPublished = (portfolioRes.data?.published as boolean) ?? false;
  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];
  const totalCount = usageRes.count ?? 0;
  const credits = creditsRes.data?.balance ?? 0;

  return (
    <OverviewTab
      profileSaved={profileSaved}
      portfolioPublished={portfolioPublished}
      jobs={jobs}
      totalCount={totalCount}
      credits={credits}
    />
  );
}
