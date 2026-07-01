// GET /api/analytics → kullanıcının kullanım istatistikleri + başvuru performansı.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { aggregateCreditUsage } from "@/lib/credits/analytics";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const [usageRes, jobsRes] = await Promise.all([
    supabase
      .from("usage_events")
      .select("kind, credits_spent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_listings")
      .select("status, platform, created_at")
      .eq("user_id", user.id),
  ]);

  if (usageRes.error) throw usageRes.error;
  if (jobsRes.error) throw jobsRes.error;

  const jobs = jobsRes.data ?? [];
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const usage = aggregateCreditUsage(usageRes.data ?? [], Date.now());

  // Başvuru performansı
  const byStatus: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const dailyApps: Record<string, number> = {};

  for (const j of jobs) {
    const status = j.status as string;
    byStatus[status] = (byStatus[status] ?? 0) + 1;

    const platform = (j.platform as string | null) ?? "diğer";
    byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;

    const ts = new Date(j.created_at as string).getTime();
    if (ts >= cutoff) {
      const day = (j.created_at as string).slice(0, 10);
      dailyApps[day] = (dailyApps[day] ?? 0) + 1;
    }
  }

  const applicationStats = {
    dailyApplications: Object.entries(dailyApps)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    byPlatform: Object.entries(byPlatform).map(([platform, count]) => ({ platform, count })),
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
  };

  return NextResponse.json({
    totalCredits: usage.totalCredits,
    byKind: usage.byKind,
    dailySeries: usage.dailySeries,
    count: usage.totalCount,
    applicationStats,
  });
});
