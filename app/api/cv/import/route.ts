// POST /api/cv/import → yüklenen CV'yi (PDF/DOCX) bellekte metne çevirir, AI ile
// yapılandırılmış CvContent'e çıkarır ve TASLAK olarak döner (DB'ye YAZILMAZ — kullanıcı
// editörde inceleyip /api/cv PUT ile kaydeder). ÜCRETSİZDİR (kredi düşmez); maliyet yine
// usage_events(kind='cv_import')'e yazılır ve saatlik rate-limit için sayılır.
// Ham dosya SAKLANMAZ (KVKK/GDPR — veri minimizasyonu). profile/import deseni.
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, ValidationError, RateLimitError, withErrorHandler } from "@/lib/errors";
import { pdfToText } from "@/lib/import/pdf";
import { docxToText } from "@/lib/import/docx";
import { extractCvFromText } from "@/lib/ai/cv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const HOURLY_LIMIT = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const PDF_TYPE = "application/pdf";
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const tc = await getTranslations("cv");

  // Rate-limit: son 1 saatteki cv_import sayısı.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "cv_import")
    .gte("created_at", oneHourAgo);
  if (countError) throw countError;
  if ((count ?? 0) >= HOURLY_LIMIT) throw new RateLimitError(tc("uploadRateLimited"));

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) throw new ValidationError(tc("errorUpload"));

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
    throw new ValidationError(tc("errorUpload"));
  }

  // Tür: yalnız PDF + DOCX. Eski .doc (application/msword) ve diğerleri reddedilir.
  let text = "";
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === PDF_TYPE) {
    text = await pdfToText(new Uint8Array(buf));
  } else if (file.type === DOCX_TYPE) {
    text = await docxToText(buf);
  } else {
    throw new ValidationError(tc("errorUploadType"));
  }

  // Boş metin → taranmış/görsel dosya (metin katmanı yok). Net mesajla reddet.
  if (text.length < 30) throw new ValidationError(tc("errorUploadEmpty"));

  const locale = await getUserLocale();
  const result = await extractCvFromText(text, locale);

  // Maliyet + rate-limit kaydı (server-otoritatif, service-role). Kredi düşmez.
  const admin = createSupabaseAdminClient();
  const { error: insertError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cv_import",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: 0,
  });
  if (insertError) throw insertError;

  // Taslak döner — DB'ye YAZILMAZ (kullanıcı inceleyip kaydeder).
  return NextResponse.json({ content: result.content });
});
