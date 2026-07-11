// GET  /api/feedback → oturum sahibinin geri bildirim geçmişi (RLS select-own).
// POST /api/feedback → yeni ürün geri bildirimi (kategori + mesaj). Ücretsiz; spam'e
// karşı saatte 10 ile sınırlı. E-posta YOK — kayıtlar Supabase'ten (service-role) okunur.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { feedbackCreateSchema } from "@/lib/validation/schemas/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const HOURLY_LIMIT = 10;

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("feedback")
    .select("id, category, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  return NextResponse.json({ feedback: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedbackCreateSchema);

  // Basit saatlik oran sınırı (spam koruması) — kullanıcının son 1 saatteki kaydı.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("feedback")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) {
    throw new RateLimitError((await getTranslations("feedback"))("rateLimited"));
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert({ user_id: user.id, category: input.category, message: input.message })
    .select("id, category, message, created_at")
    .single();
  if (error) throw error;

  return NextResponse.json({ feedback: data }, { status: 201 });
});
