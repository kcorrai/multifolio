// POST /api/feed/[poolId]/score → profil × pool ilanı AI skoru.
// Cache: job_scores'ta varsa kredi harcamadan döner. Yoksa 1 kredi (job_match),
// sonucu job_scores'a upsert, maliyeti usage_events'e yazar. match route deseni.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseUuidParam } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matchJobToProfile } from "@/lib/ai/match";
import { spendCredits } from "@/lib/credits/spend";
import type { ProfileInput } from "@/lib/validation/schemas/profile";

// Eşzamanlı iki skorlama isteği yarıştığında (ikisi de cache'i ıskalayıp kredi
// düşürünce) İKİNCİ yazan bunu fırlatır: spendCredits krediyi iade eder, dışarıda
// yakalanıp mevcut (yarışı kazananın yazdığı) skor döndürülür → kullanıcı 1 kez ücretlenir.
class ScoreRaceLost extends Error {}

export const POST = withErrorHandler(async (req, { params }) => {
  const poolId = parseUuidParam((await params).poolId as string, "poolId");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  // force=true → cache bypass + üzerine yaz (eski rubriksiz skoru rubrikliyle yenileme).
  // Gövde opsiyonel; boş/geçersiz gövde force=false sayılır.
  const body = await req.json().catch(() => null);
  const force = body?.force === true;

  // Cache kontrol: skor varsa kredi harcamadan döndür.
  if (!force) {
    const cachedRes = await supabase.from("job_scores").select("score, result").eq("user_id", user.id).eq("job_pool_id", poolId).maybeSingle();
    if (cachedRes.error) throw cachedRes.error;
    if (cachedRes.data) {
      return NextResponse.json({ score: cachedRes.data.score, result: cachedRes.data.result, credits: null, cached: true });
    }
  }

  // Profil + pool ilanını çek (bağlam alanları rubriğin bütçe/ilan-kalitesi boyutlarını besler).
  const [profileRes, poolRes] = await Promise.all([
    supabase.from("profiles").select("headline, summary, skills").eq("user_id", user.id).maybeSingle(),
    supabase.from("job_pool").select("title, description, budget, skills, client_country, client_spent").eq("id", poolId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (!profileRes.data) throw new NotFoundError((await getTranslations("errors"))("profileRequiredMatch"));
  if (poolRes.error) throw poolRes.error;
  if (!poolRes.data) throw new NotFoundError((await getTranslations("errors"))("jobNotFound"));

  const locale = await getUserLocale();
  const admin = createSupabaseAdminClient();
  const pool = poolRes.data;
  const jobContext = {
    title: pool.title as string | null,
    budget: pool.budget as string | null,
    skills: pool.skills as string[] | null,
    clientCountry: pool.client_country as string | null,
    clientSpent: pool.client_spent as number | null,
  };

  let scored;
  try {
    scored = await spendCredits(user.id, "job_match", async () => {
      const matched = await matchJobToProfile(profileRes.data as ProfileInput, pool.description, locale, jobContext);
      const row = { user_id: user.id, job_pool_id: poolId, score: matched.result.score, result: matched.result };
      if (force) {
        // Yeniden analiz: mevcut satırın üzerine yaz (yarış senaryosu yok — kullanıcı tetikler).
        const { error: upsertErr } = await admin.from("job_scores").upsert(row, { onConflict: "user_id,job_pool_id" });
        if (upsertErr) throw upsertErr;
        return matched;
      }
      // İdempotent yazım: ON CONFLICT DO NOTHING (ignoreDuplicates). Satır döndüyse
      // yarışı KAZANDIK; boşsa başka istek zaten yazmış → yarışı KAYBETTİK.
      const { data: inserted, error: insertErr } = await admin.from("job_scores").insert(row).select("id").maybeSingle();
      // 23505 (unique_violation) = yarış kaybı; diğer hatalar gerçek hata.
      if (insertErr && insertErr.code !== "23505") throw insertErr;
      if (insertErr || !inserted) throw new ScoreRaceLost();
      return matched;
    });
  } catch (err) {
    if (err instanceof ScoreRaceLost) {
      // Kredi spendCredits tarafından iade edildi; kazananın yazdığı skoru döndür.
      const { data: winner } = await supabase.from("job_scores").select("score, result").eq("user_id", user.id).eq("job_pool_id", poolId).maybeSingle();
      if (winner) {
        return NextResponse.json({ score: winner.score, result: winner.result, credits: null, cached: true });
      }
    }
    throw err;
  }

  const { result, balance, spent } = scored;

  // Maliyet kaydı (kredi iadesi kapsamı dışında).
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id, kind: "job_match", model: result.model,
    input_tokens: result.inputTokens, output_tokens: result.outputTokens,
    cost_usd: result.costUsd, credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ score: result.result.score, result: result.result, credits: { balance, spent }, cached: false });
});
