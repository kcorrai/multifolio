// GET  /api/proposal?job_id={id} → o ilana ait teklifleri döner.
// POST /api/proposal → AI teklifi üretir ve kaydeder.
import { NextResponse } from "next/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseQuery } from "@/lib/validation";
import { proposalCreateSchema } from "@/lib/validation/schemas/proposal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateProposal } from "@/lib/ai/proposal";
import { z } from "zod";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

const jobIdQuerySchema = z.object({ job_id: z.string().uuid() });

export const GET = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { job_id } = parseQuery(new URL(req.url).searchParams, jobIdQuerySchema);

  const { data, error } = await supabase
    .from("proposals")
    .select("id, job_id, platform, content, created_at")
    .eq("job_id", job_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json({ proposals: data ?? [] });
});

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, proposalCreateSchema);

  const profileRes = await supabase
    .from("profiles")
    .select("headline, summary, skills")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError("Teklif üretmek için önce profil doldurmalısın.");

  const result = await generateProposal(
    profileRes.data as ProfileInput,
    input.job_description,
    input.platform,
  );

  // Teklifi proposals tablosuna kaydet
  const { data: saved, error: saveError } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      job_id: input.job_id,
      platform: input.platform,
      content: result.content,
    })
    .select("id, job_id, platform, content, created_at")
    .single();

  if (saveError) throw saveError;

  // Maliyet kaydı
  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "proposal",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
  });
  if (usageError) throw usageError;

  return NextResponse.json({
    proposal: saved,
    cost: { usd: result.costUsd, inputTokens: result.inputTokens, outputTokens: result.outputTokens },
  }, { status: 201 });
});
