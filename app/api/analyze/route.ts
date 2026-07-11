// POST /api/analyze — HERKESE AÇIK ücretsiz profil analizi (edinim kancası).
// Auth OPSİYONEL: kayıtsız istek teaser alır (skor+verdict+ilk öneri), tam
// rapor SUNUCUDA kesilir (full:null) — client blur hilesi değil. Girişli
// kullanıcı tam raporu görür. Kredi DÜŞMEZ.
// Rate limit: kayıtsız 5/saat/IP-hash (public_analyses, service-role),
// girişli 10/saat (usage_events kind='public_analyze' — profile/import deseni).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { publicAnalyzeRequestSchema } from "@/lib/validation/schemas/analyze";
import { htmlToText, detectPlatformFromUrl, isSafeExternalUrl, fetchExternalHtml } from "@/lib/import/text";
import { parseBionlukUsername, fetchBionlukProfile } from "@/lib/import/bionluk";
import { parseLinkedinUsername, fetchLinkedinProfile } from "@/lib/import/linkedin";
import { analyzeProfileText, type ProfileAnalyzeInput } from "@/lib/ai/profile-analyze";
import { computeAnalysisScore, analysisVerdict } from "@/lib/analyze/score";
import { hashIp } from "@/lib/analyze/ip-hash";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ANON_HOURLY_LIMIT = 5;
const USER_HOURLY_LIMIT = 10;
const FETCH_TIMEOUT_MS = 10_000;

export const POST = withErrorHandler(async (req) => {
  const t = await getTranslations("errors");
  const input = await parseJson(req, publicAnalyzeRequestSchema);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(); // null olabilir — AuthError YOK
  const admin = createSupabaseAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Rate limit — girişli: usage_events; kayıtsız: IP-hash (ham IP saklanmaz).
  let ipHash: string | null = null;
  if (user) {
    const { count, error } = await supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "public_analyze")
      .gte("created_at", oneHourAgo);
    if (error) throw error;
    if ((count ?? 0) >= USER_HOURLY_LIMIT) throw new RateLimitError(t("analyzeRateLimited"));
  } else {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    // Salt SABİT olmalı: service-role anahtarına düşerse anahtar rotasyonunda tüm
    // geçmiş IP-hash'leri geçersizleşir → rate-limit sayacı sıfırlanır (bypass).
    // IP-hash yalnız kaba anon bucketing içindir; kriptografik gizlilik gerektirmez.
    const salt = process.env.ANALYZE_IP_SALT || "multifolio-analyze-ip-salt-v1";
    ipHash = hashIp(ip, salt);
    const { count, error } = await admin
      .from("public_analyses")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", oneHourAgo);
    if (error) throw error;
    if ((count ?? 0) >= ANON_HOURLY_LIMIT) throw new RateLimitError(t("analyzeRateLimited"));
  }

  // İçerik çözümü: Bionluk/LinkedIn URL → yapılandırılmış çekim (AI'sız fetch);
  // diğer URL'ler → SSRF-güvenli HTML fetch; text → doğrudan.
  let analyzeInput: ProfileAnalyzeInput;
  if (input.url) {
    if (!isSafeExternalUrl(input.url)) throw new ValidationError(t("analyzeNoContent"));
    const platform = detectPlatformFromUrl(input.url);
    if (platform === "bionluk") {
      const username = parseBionlukUsername(input.url);
      const profile = username ? await fetchBionlukProfile(username) : null;
      if (!profile) throw new ValidationError(t("analyzeNoContent"));
      analyzeInput = { profile: profile.draft };
    } else if (platform === "linkedin") {
      const username = parseLinkedinUsername(input.url);
      let profile = null;
      try {
        profile = username ? await fetchLinkedinProfile(username) : null;
      } catch {
        profile = null;
      }
      if (!profile) throw new ValidationError(t("analyzeNoContent"));
      analyzeInput = { profile: profile.draft };
    } else {
      let html = "";
      try {
        html = await fetchExternalHtml(input.url, { timeoutMs: FETCH_TIMEOUT_MS });
      } catch {
        throw new ValidationError(t("analyzeNoContent"));
      }
      const text = htmlToText(html);
      // Anlamlı içerik eşiği: bot duvarı/hata sayfası ("403 Forbidden", "404 Not
      // Found") 80+ karakter olabilir ama çok az kelime içerir. Kelime sayısı
      // eşiği bu tür sayfaları "içerik yok" olarak daha güvenilir eler.
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 20) throw new ValidationError(t("analyzeNoContent")); // bot duvarı/boş sayfa
      analyzeInput = { text };
    }
  } else {
    analyzeInput = { text: input.text as string };
  }

  const locale = await getUserLocale();
  const result = await analyzeProfileText(analyzeInput, locale);

  // Şeffaf skor: sunucuda deterministik (AI tek sayı vermez).
  const score = computeAnalysisScore(result.analysis);
  const verdict = analysisVerdict(score);

  // Kayıt: girişli → usage_events (maliyet analitiği + limit); kayıtsız →
  // public_analyses (yalnız ip_hash — anonim maliyet bilinen sınır olarak dışarıda).
  if (user) {
    const { error } = await admin.from("usage_events").insert({
      user_id: user.id,
      kind: "public_analyze",
      platform: null,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_usd: result.costUsd,
      credits_spent: 0,
    });
    if (error) throw error;
  } else {
    const { error } = await admin.from("public_analyses").insert({ ip_hash: ipHash });
    if (error) throw error;
  }

  // TEASER GATING — kayıtsıza tam rapor SUNUCUDA kesilir.
  // Kilitli SAYI (Grammarly deseni): içerik değil, gizli madde ADEDİ döner →
  // "N iyileştirme daha var" boş kesmeden çok daha yüksek dönüşüm getirir.
  const teaser = {
    score,
    verdict,
    firstSuggestion: result.analysis.suggestions[0] ?? null,
    lockedSuggestions: Math.max(0, result.analysis.suggestions.length - 1),
    lockedNotes: result.analysis.upworkApprovalNotes.length,
  };
  if (!user) {
    return NextResponse.json({ ...teaser, full: null });
  }
  return NextResponse.json({
    ...teaser,
    full: {
      dimensions: {
        headline_impact: result.analysis.headline_impact,
        summary_quality: result.analysis.summary_quality,
        skills_coverage: result.analysis.skills_coverage,
        trust_signals: result.analysis.trust_signals,
      },
      suggestions: result.analysis.suggestions,
      upworkApprovalNotes: result.analysis.upworkApprovalNotes,
    },
  });
});
