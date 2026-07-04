// GET/PATCH /api/settings — kullanıcı ayarları (user_settings, RLS).
// Satır YOKSA varsayılanlar döner (weeklyDigest: true); PATCH upsert eder.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { settingsUpdateSchema } from "@/lib/validation/schemas/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("user_settings")
    .select("weekly_digest")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;

  return NextResponse.json({ weeklyDigest: data?.weekly_digest ?? true });
});

export const PATCH = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, settingsUpdateSchema);

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: user.id, weekly_digest: input.weeklyDigest },
      { onConflict: "user_id" },
    )
    .select("weekly_digest")
    .single();
  if (error) throw error;

  return NextResponse.json({ weeklyDigest: data.weekly_digest });
});
