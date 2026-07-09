// POST /api/cv/tailor → mevcut CV'yi seçili bir ilana göre uyarlar (yeni bilgi eklemeden
// yeniden ifade/sırala). Kredi harcar (cv_tailor). Sonuç DÖNER, kaydedilmez — kullanıcı
// editörde inceleyip /api/cv PUT ile kaydeder. spendCredits closure (AI patlarsa iade).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { parseJson } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { spendCredits } from "@/lib/credits/spend";
import { tailorCv } from "@/lib/ai/cv";
import { cvContentSchema, cvTailorSchema } from "@/lib/validation/schemas/cv";
import { jobMatchResultSchema } from "@/lib/validation/schemas/job";

export const POST = withErrorHandler(async (req) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const te = await getTranslations("errors");
  const input = await parseJson(req, cvTailorSchema);

  // Mevcut CV (owner-only RLS).
  const { data: cvRow, error: cvError } = await supabase
    .from("cvs")
    .select("content")
    .eq("user_id", user.id)
    .maybeSingle();
  if (cvError) throw cvError;
  if (!cvRow) throw new NotFoundError(te("cvNotGenerated"));
  const parsedCv = cvContentSchema.safeParse(cvRow.content);
  if (!parsedCv.success) throw new NotFoundError(te("cvNotGenerated"));

  // Hedef ilan bağlamı: kayıtlı ilan (jobId) VEYA serbest metin (jobText).
  let jobContext: { title: string; description: string; requirements?: string[] };
  if ("jobId" in input) {
    const { data: job, error: jobError } = await supabase
      .from("job_listings")
      .select("title, description, match_result")
      .eq("id", input.jobId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (!job) throw new NotFoundError(te("jobNotFound"));

    // İlan gereksinimleri (varsa) — eski/rubriksiz satırlar için opsiyonel.
    const match = job.match_result ? jobMatchResultSchema.safeParse(job.match_result) : null;
    jobContext = {
      title: (job.title as string) ?? "",
      description: (job.description as string | null) ?? "",
      requirements: match?.success ? match.data.requirements : undefined,
    };
  } else {
    // Serbest yapıştırılmış ilan metni (kaydetmeye gerek yok).
    jobContext = { title: "", description: input.jobText };
  }

  const locale = await getUserLocale();

  const { result, balance, spent } = await spendCredits(user.id, "cv_tailor", async () =>
    tailorCv(parsedCv.data, jobContext, locale),
  );

  const admin = createSupabaseAdminClient();
  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cv_tailor",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    cost_usd: result.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ content: result.content, credits: { balance, spent } });
});
