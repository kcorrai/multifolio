// GET  /api/cv → oturum sahibinin CV'sini döner (yoksa null).
// PUT  /api/cv → CV içeriğini kaydeder (upsert; user_id UNIQUE).
// Şablon: app/api/profile/route.ts + app/api/portfolio/route.ts koruma deseni.
// CV ÖZELDİR — public select yok (RLS owner-only).
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { cvUpdateSchema } from "@/lib/validation/schemas/cv";
import { scoreCv } from "@/lib/cv/ats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("cvs")
    .select("id, content, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return NextResponse.json({ cv: data });
});

export const PUT = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, cvUpdateSchema);

  // user_id UNIQUE → upsert güvenli (slug gibi NOT NULL ek alan yok).
  const { data, error } = await supabase
    .from("cvs")
    .upsert({ user_id: user.id, content: input.content }, { onConflict: "user_id" })
    .select("id, content, updated_at")
    .single();
  if (error) throw error;

  // ATS skoru anlık görüntüsü (trend grafiği). Best-effort: yalnız skor DEĞİŞTİYSE
  // yeni satır (autosave/tekrar-kayıt spam'i yok). Tablo henüz yoksa (migration 0036
  // uygulanmadıysa) select hata döner → sessizce atlanır, CV kaydını BOZMAZ.
  const score = scoreCv(input.content).score;
  const { data: last, error: lastErr } = await supabase
    .from("cv_score_history")
    .select("score")
    .eq("cv_id", data.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastErr && (!last || last.score !== score)) {
    await supabase.from("cv_score_history").insert({ user_id: user.id, cv_id: data.id, score });
  }

  return NextResponse.json({ cv: data });
});
