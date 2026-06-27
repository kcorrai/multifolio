// GET  /api/portfolio → oturum sahibinin portfolyosunu döner (yoksa null).
// PUT  /api/portfolio → slug / published / content alanlarını günceller (kısmi).
// Şablon: app/api/profile/route.ts ile aynı koruma deseni.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { portfolioUpdateSchema } from "@/lib/validation/schemas/portfolio";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("portfolios")
    .select("id, slug, published, content, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return NextResponse.json({ portfolio: data });
});

export const PUT = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, portfolioUpdateSchema);

  const { data, error } = await supabase
    .from("portfolios")
    .upsert({ user_id: user.id, ...input }, { onConflict: "user_id" })
    .select("id, slug, published, content, updated_at")
    .single();

  if (error) throw error;

  return NextResponse.json({ portfolio: data });
});
