// GET/PATCH /api/notifications — dashboard içi bildirimler (RLS: sahip okur/günceller).
// GET: son 30 bildirim + okunmamış sayısı. PATCH: id verilirse o bildirimi,
// verilmezse tüm okunmamışları okundu işaretler. Üreticiler service-role ile yazar.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { notificationReadSchema } from "@/lib/validation/schemas/notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const [listRes, countRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);
  if (listRes.error) throw listRes.error;
  if (countRes.error) throw countRes.error;

  return NextResponse.json({
    notifications: listRes.data ?? [],
    unreadCount: countRes.count ?? 0,
  });
});

export const PATCH = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { id } = await parseJson(req, notificationReadSchema);

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (id) query = query.eq("id", id);

  const { error } = await query;
  if (error) throw error;

  return NextResponse.json({ ok: true });
});
