// GET    /api/jobs/[id] → ilanın tam verisini döner (description, url, notes, budget dahil).
// PATCH  /api/jobs/[id] → durum, başlık, şirket veya notları günceller.
// DELETE /api/jobs/[id] → ilanı siler.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson, parseUuidParam } from "@/lib/validation";
import { jobUpdateSchema } from "@/lib/validation/schemas/job";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const GET = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, company, platform, status, match_score, match_result, description, url, notes, budget, created_at, updated_at, status_changed_at, reminder_date, deadline_date, tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  return NextResponse.json({ job: data });
});

export const PATCH = withErrorHandler(async (req, { params }) => {
  const id = parseUuidParam((await params).id as string);
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const input = await parseJson(req, jobUpdateSchema);

  const patch: Record<string, unknown> = { ...input };
  // Durum değişiyorsa status_changed_at damgalanır (follow-up hatırlatıcısının
  // referansı — not düzenlemesi gibi güncellemeler sayacı sıfırlamaz).
  if (input.status !== undefined) patch.status_changed_at = new Date().toISOString();
  // Tarih alanlarında "" = temizle → null (date kolonu boş string kabul etmez).
  if ("reminder_date" in input) patch.reminder_date = input.reminder_date || null;
  if ("deadline_date" in input) patch.deadline_date = input.deadline_date || null;
  // Etiketler: trim + case-insensitive tekilleştirme (ilk yazımı korur).
  if (input.tags) {
    const seen = new Set<string>();
    patch.tags = input.tags.filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const { data, error } = await supabase
    .from("job_listings")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, company, platform, status, match_score, match_result, notes, created_at, reminder_date, deadline_date, tags, budget")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  return NextResponse.json({ job: data });
});

export const DELETE = withErrorHandler(async (_req, { params }) => {
  const id = parseUuidParam((await params).id as string);
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
  if (count === 0) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  return new Response(null, { status: 204 });
});
