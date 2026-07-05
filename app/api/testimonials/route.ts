// Testimonial API:
//   POST  → PUBLIC müşteri yorumu gönderir (auth YOK; slug→owner çözülür, pending eklenir).
//   GET   → owner kendi yorumlarını listeler (auth).
//   PATCH → owner yorumu onaylar/reddeder (auth; RLS sahibe sınırlar).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { testimonialSubmitSchema, testimonialStatusSchema } from "@/lib/validation/schemas/testimonial";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUBMIT_HOURLY_LIMIT_PER_OWNER = 10; // tek portfolyoyu yorum seliyle boğmayı önler

// POST /api/testimonials — herkese açık gönderim.
export const POST = withErrorHandler(async (req) => {
  const t = await getTranslations("errors");
  const input = await parseJson(req, testimonialSubmitSchema);

  const admin = createSupabaseAdminClient();

  // Slug → yayınlanmış portfolyonun sahibi. Yayınlanmamış/eksik slug yorum kabul etmez.
  const { data: portfolio } = await admin
    .from("portfolios")
    .select("user_id")
    .eq("slug", input.slug)
    .eq("published", true)
    .maybeSingle();
  if (!portfolio) throw new ValidationError(t("testimonialTargetMissing"));
  const ownerId = portfolio.user_id as string;

  // Flood koruması: son 1 saatte bu owner'a gelen gönderim sayısı.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= SUBMIT_HOURLY_LIMIT_PER_OWNER) throw new RateLimitError(t("testimonialRateLimited"));

  const { error } = await admin.from("testimonials").insert({
    user_id: ownerId,
    author_name: input.authorName,
    author_role: input.authorRole?.trim() || null,
    quote: input.quote,
    status: "pending",
  });
  if (error) throw error;

  return NextResponse.json({ ok: true }, { status: 201 });
});

// GET /api/testimonials — owner kendi yorumları (RLS sahibe sınırlar; onaylı+bekleyen).
export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, author_role, quote, status, created_at")
    .eq("user_id", user.id)
    .neq("status", "rejected")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return NextResponse.json({ testimonials: data ?? [] });
});

// PATCH /api/testimonials — owner yorumu onaylar/reddeder (RLS update-own).
export const PATCH = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, testimonialStatusSchema);

  const { data, error } = await supabase
    .from("testimonials")
    .update({ status: input.status })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select("id, author_name, author_role, quote, status, created_at")
    .maybeSingle();
  if (error) throw error;

  return NextResponse.json({ testimonial: data });
});
