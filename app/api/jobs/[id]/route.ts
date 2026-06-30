// GET    /api/jobs/[id] → ilanın tam verisini döner (description, url, notes, budget dahil).
// PATCH  /api/jobs/[id] → durum, başlık, şirket veya notları günceller.
// DELETE /api/jobs/[id] → ilanı siler.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { jobUpdateSchema } from "@/lib/validation/schemas/job";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async (_req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, company, platform, status, match_score, match_result, description, url, notes, budget, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("İlan bulunamadı.");

  return NextResponse.json({ job: data });
});

export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, jobUpdateSchema);

  const { data, error } = await supabase
    .from("job_listings")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, company, platform, status, match_score, match_result, notes, created_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError("İlan bulunamadı.");

  return NextResponse.json({ job: data });
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { error, count } = await supabase
    .from("job_listings")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
  if (count === 0) throw new NotFoundError("İlan bulunamadı.");

  return new Response(null, { status: 204 });
});
