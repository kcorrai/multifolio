// POST /api/profile/import → URL/metin/PDF'ten AI ile profil taslağı çıkarır.
// ÜCRETSİZDİR (kredi düşmez — onboarding sürtünmesi sıfır); maliyet yine
// usage_events(kind='profile_import')'e yazılır ve aynı kayıtlar saatlik
// rate-limit için sayılır. Taslak DB'ye YAZILMAZ; kayıt /api/profile'da.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { importRequestSchema } from "@/lib/validation/schemas/profile-import";
import { htmlToText, detectPlatformFromUrl, isSafeExternalUrl } from "@/lib/import/text";
import { pdfToText } from "@/lib/import/pdf";
import { extractProfile } from "@/lib/ai/profile-import";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlatformId } from "@/lib/ai/platforms";

const HOURLY_LIMIT = 10;
const PDF_MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const t = await getTranslations("errors");

  // Rate-limit: son 1 saatteki profile_import sayısı (RLS select_own yeterli).
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "profile_import")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) throw new RateLimitError(t("importRateLimited"));

  // Kanala göre ham metni topla.
  let text = "";
  let platform: PlatformId | null = null;
  let sourceUrl: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // file modu: PDF bellekte işlenir, saklanmaz.
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf" || file.size === 0 || file.size > PDF_MAX_BYTES) {
      throw new ValidationError(t("importNoText"));
    }
    text = await pdfToText(new Uint8Array(await file.arrayBuffer()));
    if (!text) throw new ValidationError(t("importNoText"));
  } else {
    const input = await parseJson(req, importRequestSchema);
    if (input.mode === "text") {
      text = input.text;
    } else {
      if (!isSafeExternalUrl(input.url)) throw new ValidationError(t("importFetchFailed"));
      platform = detectPlatformFromUrl(input.url);
      sourceUrl = input.url;
      let html = "";
      try {
        const res = await fetch(input.url, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MultifolioBot/1.0)", Accept: "text/html" },
          redirect: "follow",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
      } catch {
        throw new ValidationError(t("importFetchFailed"));
      }
      text = htmlToText(html);
      if (text.length < 80) throw new ValidationError(t("importFetchFailed")); // bot duvarı/boş sayfa
    }
  }

  const locale = await getUserLocale();
  const result = await extractProfile(text, locale);

  // Anlamlılık: taslak tamamen boşsa kullanılabilir bir profil yok demektir.
  const d = result.draft;
  if (!d.headline.trim() && !d.summary.trim() && d.skills.length === 0) {
    throw new ValidationError(t("importNothingFound"));
  }

  // Maliyet + rate-limit kaydı (server-otoritatif, service-role).
  const admin = createSupabaseAdminClient();
  const { error: insertError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "profile_import",
    platform,
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: 0,
  });
  if (insertError) throw insertError;

  // Bonus: URL bilinen platformsa bağlantıyı da kaydet (RLS'li istemci —
  // kullanıcının kendi satırı; hata sessizce yutulmaz, withErrorHandler yakalar).
  if (platform && sourceUrl) {
    const { error: connError } = await supabase
      .from("platform_connections")
      .upsert({ user_id: user.id, platform, profile_url: sourceUrl }, { onConflict: "user_id,platform" });
    if (connError) throw connError;
  }

  return NextResponse.json({ draft: result.draft, platform });
});
