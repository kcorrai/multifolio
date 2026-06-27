// ŞABLON KORUMALI UÇ NOKTA — gelecekteki tüm API route'ları için referans desen.
// Üç sütunu birlikte gösterir:
//   1) withErrorHandler  → her hata yapılandırılmış cevaba/Sentry'ye gider.
//   2) parseJson(zod)    → istemci girdisine güvenilmez; sunucuda doğrulanır.
//   3) auth + RLS        → getUser() ile kimlik; DB erişimi RLS politikalarıyla
//                          (auth.uid() = user_id) sahibe sınırlı, parametreli sorgu.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { profileInputSchema } from "@/lib/validation/schemas/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/profile → oturum sahibinin profilini döner (yoksa null).
export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // RLS zaten sahibe sınırlar; user_id filtresi niyeti açık kılar.
  const { data, error } = await supabase
    .from("profiles")
    .select("id, headline, summary, skills, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error; // withErrorHandler → Sentry + generic 500.

  return NextResponse.json({ profile: data });
});

// POST /api/profile → profili oluşturur/günceller (kullanıcı başına tek profil).
export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // Doğrulanmamış istemci verisi buraya kadar gelmez.
  const input = await parseJson(req, profileInputSchema);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, ...input }, { onConflict: "user_id" })
    .select("id, headline, summary, skills, updated_at")
    .single();

  if (error) throw error;

  return NextResponse.json({ profile: data }, { status: 200 });
});
