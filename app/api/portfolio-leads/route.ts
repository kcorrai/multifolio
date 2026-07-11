// Portfolyo lead API:
//   POST  → PUBLIC ziyaretçi "İşe al" talebi gönderir (auth YOK; slug→owner çözülür).
//   GET   → owner kendi lead'lerini listeler (auth, RLS sahibe sınırlar).
//   PATCH → owner lead durumunu günceller (auth; RLS update-own).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { leadSubmitSchema, leadStatusSchema } from "@/lib/validation/schemas/lead";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SUBMIT_HOURLY_LIMIT_PER_OWNER = 15; // tek portfolyoyu lead seliyle boğmayı önler

// POST /api/portfolio-leads — herkese açık gönderim.
export const POST = withErrorHandler(async (req) => {
  const t = await getTranslations("errors");
  const input = await parseJson(req, leadSubmitSchema);

  const admin = createSupabaseAdminClient();

  // Slug → yayınlanmış portfolyonun sahibi. Yayınlanmamış/eksik slug lead kabul etmez.
  const { data: portfolio } = await admin
    .from("portfolios")
    .select("user_id")
    .eq("slug", input.slug)
    .eq("published", true)
    .maybeSingle();
  if (!portfolio) throw new ValidationError(t("leadTargetMissing"));
  const ownerId = portfolio.user_id as string;

  // Flood koruması: son 1 saatte bu owner'a gelen lead sayısı.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("portfolio_leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ownerId)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= SUBMIT_HOURLY_LIMIT_PER_OWNER) throw new RateLimitError(t("leadRateLimited"));

  const { error } = await admin.from("portfolio_leads").insert({
    user_id: ownerId,
    name: input.name,
    email: input.email,
    budget: input.budget?.trim() || null,
    project_type: input.projectType?.trim() || null,
    timeline: input.timeline?.trim() || null,
    message: input.message,
    status: "new",
  });
  if (error) throw error;

  return NextResponse.json({ ok: true }, { status: 201 });
});

// GET /api/portfolio-leads — owner kendi lead'leri (RLS sahibe sınırlar).
export const GET = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("portfolio_leads")
    .select("id, name, email, budget, project_type, timeline, message, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return NextResponse.json({ leads: data ?? [] });
});

// PATCH /api/portfolio-leads — owner lead durumunu günceller (RLS update-own).
export const PATCH = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, leadStatusSchema);

  const { data, error } = await supabase
    .from("portfolio_leads")
    .update({ status: input.status })
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select("id, name, email, budget, project_type, timeline, message, status, created_at")
    .maybeSingle();
  if (error) throw error;

  return NextResponse.json({ lead: data });
});
