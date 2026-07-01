import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import type { JobRow } from "@/components/dashboard/shared";
import { aggregateCreditUsage } from "@/lib/credits/analytics";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [usageRes, creditsRes, jobsRes] = await Promise.all([
    supabase.from("usage_events").select("kind, credits_spent, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  // eslint-disable-next-line react-hooks/purity
  const analytics = aggregateCreditUsage(usageRes.data ?? [], Date.now());

  const credits = creditsRes.data?.balance ?? 0;
  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];

  return <AnalyticsTab analytics={analytics} credits={credits} jobs={jobs} />;
}
