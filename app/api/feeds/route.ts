// GET  /api/feeds → kullanıcının kayıtlı feed'leri.
// POST /api/feeds → yeni feed (kullanıcı başına en çok 10).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { feedCreateSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FEEDS = 10;
const FEED_COLS = "id, name, keywords, min_budget, platform, created_at";

export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase.from("job_feeds").select(FEED_COLS).eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return NextResponse.json({ feeds: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedCreateSchema);

  const { count, error: countError } = await supabase.from("job_feeds").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_FEEDS) {
    throw new ValidationError((await getTranslations("errors"))("feedLimitReached"));
  }

  const { data, error } = await supabase.from("job_feeds").insert({
    user_id: user.id, name: input.name, keywords: input.keywords,
    min_budget: input.minBudget ?? null, platform: input.platform ?? null,
  }).select(FEED_COLS).single();
  if (error) throw error;
  return NextResponse.json({ feed: data }, { status: 201 });
});
