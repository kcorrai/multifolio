// GET  /api/jobs → kullanıcının ilanlarını döner (yeniden eskiye sıralı).
// POST /api/jobs → yeni ilan oluşturur.
import { NextResponse } from "next/server";
import { AuthError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { jobCreateSchema } from "@/lib/validation/schemas/job";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, company, platform, status, match_score, match_result, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ jobs: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, jobCreateSchema);

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ user_id: user.id, ...input })
    .select("id, title, company, platform, status, match_score, match_result, created_at")
    .single();

  if (error) throw error;

  return NextResponse.json({ job: data }, { status: 201 });
});
