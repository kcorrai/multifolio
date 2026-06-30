// GET /api/analytics → kullanıcının kullanım istatistikleri + başvuru performansı.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const [usageRes, jobsRes] = await Promise.all([
    supabase
      .from("usage_events")
      .select("kind, platform, model, cost_usd, input_tokens, output_tokens, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_listings")
      .select("status, platform, created_at")
      .eq("user_id", user.id),
  ]);

  if (usageRes.error) throw usageRes.error;
  if (jobsRes.error) throw jobsRes.error;

  const rows = usageRes.data ?? [];
  const jobs = jobsRes.data ?? [];

  // Toplam
  const totalUsd = rows.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const totalTokens = rows.reduce(
    (s, r) => s + Number(r.input_tokens ?? 0) + Number(r.output_tokens ?? 0),
    0,
  );

  // İşlem türüne göre özet
  const byKind: Record<string, { count: number; costUsd: number }> = {};
  for (const r of rows) {
    const k = r.kind as string;
    byKind[k] ??= { count: 0, costUsd: 0 };
    byKind[k].count += 1;
    byKind[k].costUsd += Number(r.cost_usd ?? 0);
  }

  // Son 30 gün günlük harcama (grafik için)
  const daily: Record<string, number> = {};
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const r of rows) {
    const ts = new Date(r.created_at as string).getTime();
    if (ts < cutoff) continue;
    const day = (r.created_at as string).slice(0, 10);
    daily[day] = (daily[day] ?? 0) + Number(r.cost_usd ?? 0);
  }
  const dailySeries = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, costUsd]) => ({ date, costUsd }));

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

  return NextResponse.json({ totalUsd, totalTokens, byKind, dailySeries, count: rows.length, applicationStats });
});
