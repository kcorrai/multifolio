// POST /api/cv/generate → kullanıcının profil + projelerinden AI ile ATS-uyumlu CV
// içeriği üretir, cvs tablosuna yazar, maliyeti usage_events'e kaydeder.
// portfolio/generate/route.ts deseni: spendCredits closure (yazım patlarsa iade).
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getUserLocale } from "@/i18n/locale";
import { AuthError, NotFoundError, withErrorHandler } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateCv } from "@/lib/ai/cv";
import { spendCredits } from "@/lib/credits/spend";
import { profileProjectSchema, type ProfileProject } from "@/lib/validation/schemas/profile";
import { cvThemeSchema } from "@/lib/validation/schemas/cv";

export const POST = withErrorHandler(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("headline, summary, skills, projects")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profileData) throw new NotFoundError((await getTranslations("errors"))("profileRequiredPortfolio"));

  // Projeleri güvenle normalize et (bozuk satır tüm üretimi patlatmasın).
  const projects: ProfileProject[] = Array.isArray(profileData.projects)
    ? (profileData.projects as unknown[])
        .map((p) => profileProjectSchema.safeParse(p))
        .filter((r): r is { success: true; data: ProfileProject } => r.success)
        .map((r) => r.data)
    : [];

  const locale = await getUserLocale();
  const admin = createSupabaseAdminClient();

  // Yeniden üretimde kullanıcının seçtiği tema KORUNUR (AI tema üretmez).
  const { data: existingCv } = await supabase
    .from("cvs")
    .select("content")
    .eq("user_id", user.id)
    .maybeSingle();
  const existingTheme = (existingCv?.content as { theme?: unknown } | null)?.theme;
  const theme = cvThemeSchema.parse(existingTheme);

  const { result, balance, spent } = await spendCredits(user.id, "cv_generation", async () => {
    const ai = await generateCv(
      {
        headline: profileData.headline as string,
        summary: profileData.summary as string,
        skills: (profileData.skills as string[] | null) ?? [],
      },
      projects,
      locale,
      theme,
    );
    // İletişim e-postası boşsa hesap e-postasına varsayılan (kullanıcı editörde değiştirir).
    const content = {
      ...ai.content,
      contact: {
        ...ai.content.contact,
        email: ai.content.contact.email || (user.email ?? ""),
      },
    };
    const { data: cv, error: upsertError } = await admin
      .from("cvs")
      .upsert({ user_id: user.id, content }, { onConflict: "user_id" })
      .select("id, content, updated_at")
      .single();
    if (upsertError) throw upsertError;
    return { ai, cv };
  });

  const { error: usageError } = await admin.from("usage_events").insert({
    user_id: user.id,
    kind: "cv_generation",
    model: result.ai.model,
    input_tokens: result.ai.inputTokens,
    output_tokens: result.ai.outputTokens,
    cost_usd: result.ai.costUsd,
    credits_spent: spent,
  });
  if (usageError) throw usageError;

  return NextResponse.json({ cv: result.cv, credits: { balance, spent } });
});
