// GET /api/analytics → kullanıcının kullanım istatistikleri:
// platform bazında harcama, işlem sayısı ve son 7 gün günlük özet.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("usage_events")
    .select("kind, platform, model, cost_usd, input_tokens, output_tokens, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];

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

  return NextResponse.json({ totalUsd, totalTokens, byKind, dailySeries, count: rows.length });
});
