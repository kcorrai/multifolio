// PATCH  /api/feeds/[id] → feed güncelle.
// DELETE /api/feeds/[id] → feed sil.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseUuidParam } from "@/lib/validation";
import { feedUpdateSchema } from "@/lib/validation/schemas/feed";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEED_COLS = "id, name, keywords, exclude_keywords, min_budget, platform, exclude_countries, min_hourly_rate, min_fixed_price, min_client_spent, min_score, notify, proposal_prompt, auto_draft_daily, created_at";

export const PATCH = withErrorHandler(async (req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, feedUpdateSchema);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.keywords !== undefined) patch.keywords = input.keywords;
  if (input.excludeKeywords !== undefined) patch.exclude_keywords = input.excludeKeywords;
  if (input.minBudget !== undefined) patch.min_budget = input.minBudget;
  if (input.platform !== undefined) patch.platform = input.platform;
  if (input.excludeCountries !== undefined) patch.exclude_countries = input.excludeCountries;
  if (input.minHourlyRate !== undefined) patch.min_hourly_rate = input.minHourlyRate;
  if (input.minFixedPrice !== undefined) patch.min_fixed_price = input.minFixedPrice;
  if (input.minClientSpent !== undefined) patch.min_client_spent = input.minClientSpent;
  if (input.minScore !== undefined) patch.min_score = input.minScore;
  if (input.notify !== undefined) patch.notify = input.notify;
  if (input.proposalPrompt !== undefined) patch.proposal_prompt = input.proposalPrompt?.trim() ? input.proposalPrompt : null;
  if (input.autoDraftDaily !== undefined) patch.auto_draft_daily = input.autoDraftDaily;

  const { data, error } = await supabase.from("job_feeds").update(patch).eq("id", id).eq("user_id", user.id).select(FEED_COLS).maybeSingle();
  if (error) throw error;
  if (!data) throw new NotFoundError();
  return NextResponse.json({ feed: data });
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { error } = await supabase.from("job_feeds").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  return NextResponse.json({ ok: true });
});
