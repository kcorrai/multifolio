// PATCH  /api/feeds/[id] → feed güncelle.
// DELETE /api/feeds/[id] → feed sil.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { feedUpdateSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEED_COLS = "id, name, keywords, min_budget, platform, created_at";

export const PATCH = withErrorHandler(async (req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedUpdateSchema);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.keywords !== undefined) patch.keywords = input.keywords;
  if (input.minBudget !== undefined) patch.min_budget = input.minBudget;
  if (input.platform !== undefined) patch.platform = input.platform;

  const { data, error } = await supabase.from("job_feeds").update(patch).eq("id", id).eq("user_id", user.id).select(FEED_COLS).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError();
  return NextResponse.json({ feed: data });
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const { id } = await params as { id: string };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { error } = await supabase.from("job_feeds").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
