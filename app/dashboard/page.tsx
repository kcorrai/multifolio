import { redirect } from "next/navigation";
import { ProfileStudio } from "@/components/profile-studio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileRes, portfolioRes, jobsRes, usageRes, creditsRes, connectionsRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolios").select("slug, published, content").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_listings").select("id, title, company, platform, status, match_score, match_result, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("usage_events").select("kind, platform, cost_usd, input_tokens, output_tokens, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("platform_connections").select("platform, profile_url, updated_at").eq("user_id", user.id),
  ]);

  const initialProfile = profileRes.data
    ? { headline: profileRes.data.headline as string, summary: profileRes.data.summary as string, skills: (profileRes.data.skills as string[]) ?? [] }
    : null;

  const initialPortfolio = portfolioRes.data
    ? { slug: portfolioRes.data.slug as string, published: portfolioRes.data.published as boolean, content: portfolioRes.data.content ?? null }
    : null;

  const initialJobs = (jobsRes.data ?? []) as Parameters<typeof ProfileStudio>[0]["initialJobs"];
  const initialCredits = creditsRes.data?.balance ?? 0;
  const initialConnections = Object.fromEntries(
    (connectionsRes.data ?? []).map((c) => [c.platform, c.profile_url as string])
  ) as Record<string, string>;

  const usageRows = usageRes.data ?? [];
  const initialSpendUsd = usageRows.reduce((sum, row) => sum + Number(row.cost_usd ?? 0), 0);

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
  const initialAnalytics = {
    totalUsd: initialSpendUsd,
    totalCount: usageRows.length,
    byKind,
    dailySeries: Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costUsd]) => ({ date, costUsd })),
  };

  return (
    <ProfileStudio
      userEmail={user.email ?? ""}
      initialProfile={initialProfile}
      initialSpendUsd={initialSpendUsd}
      initialPortfolio={initialPortfolio}
      initialJobs={initialJobs}
      initialAnalytics={initialAnalytics}
      initialCredits={initialCredits}
      initialConnections={initialConnections}
    />
  );
}
