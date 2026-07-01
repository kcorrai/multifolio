import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import type { AnalyticsData, JobRow } from "@/components/dashboard/shared";

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [usageRes, creditsRes, jobsRes] = await Promise.all([
    supabase.from("usage_events").select("kind, cost_usd, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const usageRows = usageRes.data ?? [];
  const totalUsd = usageRows.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0);

  const byKind: Record<string, { count: number; costUsd: number }> = {};
  for (const r of usageRows) {
    const k = r.kind as string;
    byKind[k] ??= { count: 0, costUsd: 0 };
    byKind[k].count += 1;
    byKind[k].costUsd += Number(r.cost_usd ?? 0);
  }

  // eslint-disable-next-line react-hooks/purity
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const daily: Record<string, number> = {};
  for (const r of usageRows) {
    if (new Date(r.created_at as string).getTime() < cutoff) continue;
    const day = (r.created_at as string).slice(0, 10);
    daily[day] = (daily[day] ?? 0) + Number(r.cost_usd ?? 0);
  }

  const analytics: AnalyticsData = {
    totalUsd,
    totalCount: usageRows.length,
    byKind,
    dailySeries: Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costUsd]) => ({ date, costUsd })),
  };

  const credits = creditsRes.data?.balance ?? 0;
  const jobs = (jobsRes.data ?? []) as unknown as JobRow[];

  return <AnalyticsTab analytics={analytics} credits={credits} jobs={jobs} />;
}
