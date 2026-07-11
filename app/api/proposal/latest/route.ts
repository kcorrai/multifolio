// GET /api/proposal/latest → kullanıcının EN SON ürettiği teklifi döner (içerik + platform).
// Tarayıcı uzantısının "sayfaya yapıştır" akışı kullanır: kullanıcı dashboard'da teklif
// üretir, apply sekmesinde bu teklifi cover-letter kutusuna yapıştırır (auto-submit YOK).
// RLS owner (select-own); AI/kredi yok. Teklif yoksa proposal:null.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("proposals")
    .select("content, platform, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return NextResponse.json({ proposal: data ?? null });
});
