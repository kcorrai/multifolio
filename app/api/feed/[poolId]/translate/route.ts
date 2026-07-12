// POST /api/feed/[poolId]/translate → ilan açıklamasını kullanıcının UI diline çevirir.
// ÜCRETSİZDİR (kredi düşmez — platform maliyeti). Cache PAYLAŞIMLIDIR (job_translations):
// ilk isteyen için AI çevirir, sonraki tüm kullanıcılar cache'ten okur. Maliyet
// usage_events(kind='job_translate')'e yazılır ve aynı kayıtlar saatlik rate-limit
// için sayılır (profile_import deseni).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseUuidParam } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { translateJobDescription } from "@/lib/ai/translate";

const HOURLY_LIMIT = 30;

export const POST = withErrorHandler(async (_req, { params }) => {
  const poolId = parseUuidParam((await params).poolId as string, "poolId");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const locale = await getUserLocale();

  // İlan + paylaşımlı cache tek turda (RLS'li client: ikisi de authenticated select).
  const [poolRes, cacheRes] = await Promise.all([
    supabase.from("job_pool").select("description, lang").eq("id", poolId).maybeSingle(),
    supabase.from("job_translations").select("description").eq("job_pool_id", poolId).eq("locale", locale).maybeSingle(),
  ]);
  if (poolRes.error) throw poolRes.error;
  if (!poolRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));
  if (cacheRes.error) throw cacheRes.error;

  // İlan zaten kullanıcının dilindeyse çeviriye gerek yok.
  if (poolRes.data.lang === locale) {
    return NextResponse.json({ description: poolRes.data.description, cached: true });
  }
  if (cacheRes.data) {
    return NextResponse.json({ description: cacheRes.data.description, cached: true });
  }

  // Rate-limit: son 1 saatteki job_translate sayısı (yalnız AI'a giden istekler sayılır).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "job_translate")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) {
    throw new RateLimitError((await getTranslations("errors"))("translateRateLimited"));
  }

  const result = await translateJobDescription(poolRes.data.description);

  // Paylaşımlı cache'e İDEMPOTENT yazım (service-role: insert politikası yok).
  // score route ScoreRaceLost deseni: insert(→select) satır döndürdüyse yarışı
  // KAZANDIK; 23505 (unique) veya boşsa başka istek zaten yazmış → yarışı KAYBETTİK,
  // kazananın çevirisini oku ve dön (böylece iki racer TUTARLI aynı metni görür).
  const admin = createSupabaseAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .from("job_translations")
    .insert({ job_pool_id: poolId, locale, description: result.translated })
    .select("id")
    .maybeSingle();
  if (insertErr && insertErr.code !== "23505") throw insertErr;
  if (insertErr || !inserted) {
    const { data: winner } = await supabase
      .from("job_translations")
      .select("description")
      .eq("job_pool_id", poolId)
      .eq("locale", locale)
      .maybeSingle();
    return NextResponse.json({ description: winner?.description ?? result.translated, cached: true });
  }

  // Kazandık → maliyet + rate-limit kaydı (kredi düşmez).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "job_translate", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: 0,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ description: result.translated, cached: false });
});
