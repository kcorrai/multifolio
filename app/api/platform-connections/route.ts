import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { platformConnectionUpsertSchema } from "@/lib/validation/schemas/platform-connection";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/platform-connections → kullanıcının tüm platform bağlantıları
export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("platform_connections")
    .select("id, platform, profile_url, created_at, updated_at")
    .eq("user_id", user.id)
    .order("platform");

  if (error) throw error;

  return NextResponse.json({ connections: data ?? [] });
});

// PUT /api/platform-connections → bir platformu ekle/güncelle (upsert)
export const PUT = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, platformConnectionUpsertSchema);

  const { data, error } = await supabase
    .from("platform_connections")
    .upsert(
      { user_id: user.id, platform: input.platform, profile_url: input.profile_url },
      { onConflict: "user_id,platform" },
    )
    .select("id, platform, profile_url, created_at, updated_at")
    .single();

  if (error) throw error;

  return NextResponse.json({ connection: data });
});

// DELETE /api/platform-connections → bir platform bağlantısını sil
export const DELETE = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, platformConnectionUpsertSchema.pick({ platform: true }));

  const { error } = await supabase
    .from("platform_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", input.platform);

  if (error) throw error;

  return NextResponse.json({ ok: true });
});
