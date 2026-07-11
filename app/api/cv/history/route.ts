// GET /api/cv/history → oturum sahibinin son 30 günlük ATS skor anlık görüntüleri
// (trend grafiği). RLS owner-only. Tablo henüz yoksa (migration 0036 bekliyor) veya
// hata → boş geçmiş döner (feature opsiyonel; 500 verme).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("cv_score_history")
    .select("score, created_at")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ history: [] });

  return NextResponse.json({ history: data ?? [] });
});
