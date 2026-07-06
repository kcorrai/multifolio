// POST /api/profile/import → URL/metin/PDF'ten AI ile profil taslağı çıkarır.
// ÜCRETSİZDİR (kredi düşmez — onboarding sürtünmesi sıfır); maliyet yine
// usage_events(kind='profile_import')'e yazılır ve aynı kayıtlar saatlik
// rate-limit için sayılır. Taslak DB'ye YAZILMAZ; kayıt /api/profile'da.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { importRequestSchema, type ImportRequest, type ProfileImportMedia } from "@/lib/validation/schemas/profile-import";
import type { PortfolioItem } from "@/lib/validation/schemas/profile";
import { htmlToText, detectPlatformFromUrl, isSafeExternalUrl, fetchExternalHtml } from "@/lib/import/text";
import { pdfToText } from "@/lib/import/pdf";
import { parseBionlukUsername, fetchBionlukProfile, type BionlukProfile } from "@/lib/import/bionluk";
import { parseLinkedinUsername, fetchLinkedinProfile, type LinkedinProfile } from "@/lib/import/linkedin";
import { extractProfile, type ProfileImportResult } from "@/lib/ai/profile-import";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PlatformId } from "@/lib/ai/platforms";

const HOURLY_LIMIT = 10;
const PDF_MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

// Eklentiden gelen zengin projeleri (başlık/açıklama/beceriler + görsel-altyazı) portfolyo
// öğelerine düzleştirir: her görsel bir öğe; ilk görsel proje açıklaması+becerilerini,
// diğerleri kendi altyazısını taşır. Toplam en fazla 50 öğe (portfolyo şema tavanı).
type ExtProject = NonNullable<Extract<ImportRequest, { mode: "extension" }>["portfolioProjects"]>[number];
function projectsToPortfolio(projects: ExtProject[]): PortfolioItem[] {
  const items: PortfolioItem[] = [];
  for (const p of projects) {
    const skillsLine = p.skills.length ? `Skills: ${p.skills.join(", ")}` : "";
    const projDesc = [p.description, skillsLine].filter(Boolean).join("\n\n").slice(0, 1000);
    p.images.forEach((im, i) => {
      if (items.length >= 50) return;
      const desc = (im.caption || (i === 0 ? projDesc : "")).slice(0, 1000);
      items.push({ title: p.title.slice(0, 200), description: desc, imageUrl: im.url, category: null });
    });
    if (items.length >= 50) break;
  }
  return items;
}

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

  // Kanala göre ham metni topla. Bionluk/LinkedIn özel yol: yapılandırılmış public
  // veriden doğrudan taslak (AI YOK — ücretsiz, kredisiz, daha doğru + foto).
  let text = "";
  let platform: PlatformId | null = null;
  let sourceUrl: string | null = null;
  let bionluk: BionlukProfile | null = null;
  let linkedin: LinkedinProfile | null = null;
  let extensionInput: Extract<ImportRequest, { mode: "extension" }> | null = null;
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
    } else if (input.mode === "extension") {
      // Eklenti: metin kullanıcının login'li sekmesinden gelir — sunucu fetch'i YOK
      // (bot duvarı bu sayede aşılır). Bildirilen platform, sourceUrl ile çapraz
      // doğrulanır ki platform_connections'a uydurma URL yazılamasın.
      if (detectPlatformFromUrl(input.sourceUrl) !== input.platform) {
        throw new ValidationError(t("importFetchFailed"));
      }
      text = input.text;
      platform = input.platform;
      sourceUrl = input.sourceUrl;
      extensionInput = input;
    } else {
      if (!isSafeExternalUrl(input.url)) throw new ValidationError(t("importFetchFailed"));
      platform = detectPlatformFromUrl(input.url);
      sourceUrl = input.url;

      if (platform === "bionluk") {
        const username = parseBionlukUsername(input.url);
        if (!username) throw new ValidationError(t("importFetchFailed"));
        bionluk = await fetchBionlukProfile(username);
        if (!bionluk) throw new ValidationError(t("importFetchFailed"));
      } else if (platform === "linkedin") {
        // LinkedIn public profil sayfasındaki JSON-LD → yapılandırılmış taslak + foto.
        const username = parseLinkedinUsername(input.url);
        if (!username) throw new ValidationError(t("importFetchFailed"));
        try {
          linkedin = await fetchLinkedinProfile(username);
        } catch {
          throw new ValidationError(t("importFetchFailed"));
        }
        if (!linkedin) throw new ValidationError(t("importFetchFailed"));
      } else {
        // Diğer platformlar: SSRF-güvenli fetch (yönlendirmeler elle doğrulanır) → HTML→metin → AI.
        let html = "";
        try {
          html = await fetchExternalHtml(input.url, { timeoutMs: FETCH_TIMEOUT_MS });
        } catch {
          throw new ValidationError(t("importFetchFailed"));
        }
        text = htmlToText(html);
        if (text.length < 80) throw new ValidationError(t("importFetchFailed")); // bot duvarı/boş sayfa
      }
    }
  }

  // Taslak: Bionluk/LinkedIn yapılandırılmış (AI'sız, maliyetsiz); diğerleri AI çıkarımı.
  let result: ProfileImportResult;
  if (bionluk) {
    result = { draft: bionluk.draft, model: "bionluk-structured", inputTokens: 0, outputTokens: 0, costUsd: 0 };
  } else if (linkedin) {
    result = { draft: linkedin.draft, model: "linkedin-structured", inputTokens: 0, outputTokens: 0, costUsd: 0 };
  } else {
    // Kaynak dilini KORUR (çeviri wizard'da ayrı "kendi dilime çevir" adımıyla).
    result = await extractProfile(text);
  }

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

  // Yapılandırılmış medya (avatar + portfolyo görselleri) — taslak inceleme ekranı
  // gösterir ve kaydederken profile yazar. Bionluk portfolyo verir; LinkedIn yalnız
  // avatar (public ld+json portfolyo içermez). Eklenti best-effort görsel URL'leri yollar.
  let media: ProfileImportMedia | undefined;
  if (bionluk) {
    media = { avatarUrl: bionluk.avatarUrl, portfolio: bionluk.portfolio };
  } else if (linkedin) {
    media = { avatarUrl: linkedin.avatarUrl, portfolio: [] };
  } else if (extensionInput) {
    // Zengin projeler varsa (Upwork proje modalları) onları düzleştir; yoksa düz görseller.
    const portfolio = extensionInput.portfolioProjects?.length
      ? projectsToPortfolio(extensionInput.portfolioProjects)
      : (extensionInput.portfolioImages ?? []).map((u) => ({
          title: "", description: "", imageUrl: u, category: null,
        }));
    media = { avatarUrl: extensionInput.avatarUrl ?? null, portfolio };
    // Eklenti akışında inceleme web'de yapılır: taslak + medya bekleyen-taslak satırına
    // upsert edilir (kullanıcı başına tek satır, RLS'li istemci); uzantı sonrasında
    // /dashboard/import?source=extension açar. created_at tazelik penceresi için yenilenir.
    const { error: draftError } = await supabase.from("profile_import_drafts").upsert(
      {
        user_id: user.id,
        platform: extensionInput.platform,
        source_url: extensionInput.sourceUrl,
        draft: result.draft,
        media,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (draftError) throw draftError;
  }

  // Platform verisi elimizdeyken platform_profiles'a da yaz (platform detay
  // sayfası "X'teki profilin" kartı buradan hydrate olur). Yalnız gerçek platform
  // verisi olan yollar: Bionluk/LinkedIn yapılandırılmış çekim + uzantı.
  if (platform && sourceUrl && (bionluk || linkedin || extensionInput)) {
    const { error: ppError } = await supabase.from("platform_profiles").upsert(
      {
        user_id: user.id,
        platform,
        headline: result.draft.headline,
        summary: result.draft.summary,
        skills: result.draft.skills,
        avatar_url: media?.avatarUrl ?? null,
        portfolio: media?.portfolio ?? [],
        source_url: sourceUrl,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );
    if (ppError) throw ppError;
  }

  return NextResponse.json({ draft: result.draft, platform, media });
});
